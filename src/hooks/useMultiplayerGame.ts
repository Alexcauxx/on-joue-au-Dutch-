/**
 * useMultiplayerGame — Hook central du jeu multijoueur.
 *
 * S'abonne aux changements Supabase Realtime et expose :
 * - l'état du jeu visible par le joueur courant
 * - toutes les actions possibles (piocher, échanger, Dutch...)
 *
 * Chaque action met à jour Supabase → les autres joueurs
 * reçoivent automatiquement la mise à jour.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { subscribeToGame, updateGameState, getGame, getPlayers } from '../services/gameService'
import { shuffle, totalScore } from '../utils/cards'
import { isValidCard, normalizeCard } from '../utils/cardUtils'
import type {
  GameRecord, PlayerRecord, GameState, GamePhase, Card
} from '../types/game'

interface UseMultiplayerGameOptions {
  gameId:   string
  playerId: string
  /** Appelé quand la partie passe en phase 'end' */
  onGameEnd?: (finalState: GameState, players: PlayerRecord[]) => void
}

export function useMultiplayerGame({
  gameId,
  playerId,
  onGameEnd,
}: UseMultiplayerGameOptions) {
  const [game,    setGame]    = useState<GameRecord | null>(null)
  const [players, setPlayers] = useState<PlayerRecord[]>([])
  const [error,   setError]   = useState<string | null>(null)

  // ── Abonnement Realtime + chargement initial ───────────────
  useEffect(() => {
    if (!gameId) return

    let mounted = true

    const loadInitial = async () => {
      try {
        const [initialGame, initialPlayers] = await Promise.all([
          getGame(gameId),
          getPlayers(gameId),
        ])

        if (!mounted) return
        if (initialGame) setGame(initialGame)
        if (initialPlayers) setPlayers(initialPlayers)
      } catch (err) {
        console.error('[MULTIPLAYER] initial load error', err)
        if (mounted) setError('Impossible de charger la partie.')
      }
    }

    loadInitial()
    const unsubscribe = subscribeToGame(gameId, setGame, setPlayers)
    return () => { mounted = false; unsubscribe() }
  }, [gameId])

  // ── Détection de fin de partie ──────────────────────────────
  useEffect(() => {
    const state = game?.game_state
    if (!state || state.phase !== 'end' || !onGameEnd) return

    const myHand = state.hands[playerId]?.cards ?? []
    const opponentId = state.playerOrder.find(id => id !== playerId)
    const opponentHand = opponentId ? state.hands[opponentId]?.cards ?? [] : []
    const playerScore = totalScore(myHand)
    const opponentScore = totalScore(opponentHand)

    onGameEnd({
      pH: myHand,
      oH: opponentHand,
      dutch: state.dutchCallerId === playerId ? 'player' : state.dutchCallerId ? 'opponent' : null,
      playerWon: playerScore <= opponentScore,
    }, players)
  }, [game?.game_state?.phase, game?.game_state, onGameEnd, playerId, players])

  // ── État dérivé ─────────────────────────────────────────────
  const gameState        = game?.game_state ?? null
  const myHand           = gameState?.hands[playerId]?.cards ?? []
  const myPeeksUsed      = gameState?.hands[playerId]?.peeksUsed ?? 0
  const currentPlayerId  = gameState
    ? gameState.playerOrder[gameState.currentPlayerIndex]
    : null
  const isMyTurn         = currentPlayerId === playerId
  const phase            = gameState?.phase ?? 'peek'
  const gameStateRef     = useRef<GameState | null>(null)

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // ── Utilitaire : sauvegarder l'état ────────────────────────
  const save = useCallback(async (newState: GameState) => {
    try {
      await updateGameState(gameId, newState)
      setError(null)
    } catch (e) {
      setError('Erreur de synchronisation. Vérifie ta connexion.')
    }
  }, [gameId])

  const jackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearJackTimer = useCallback(() => {
    if (jackTimerRef.current !== null) {
      clearTimeout(jackTimerRef.current)
      jackTimerRef.current = null
    }
  }, [])

  const cancelPendingEffect = useCallback(() => {
    clearJackTimer()
  }, [clearJackTimer])

  // ── Utilitaire : passer au joueur suivant ───────────────────
  const advanceTurn = useCallback((state: GameState): GameState => {
    const nextIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length

    // Si Dutch est annoncé et plus personne n'a de dernier tour → fin
    if (state.dutchCallerId) {
      const remaining = state.lastTurnPlayerIds.filter(
        pid => pid !== state.playerOrder[nextIndex]
      )
      if (remaining.length === 0 && state.lastTurnPlayerIds.length > 0) {
        return { ...state, phase: 'end', currentPlayerIndex: nextIndex }
      }
    }

    return {
      ...state,
      currentPlayerIndex: nextIndex,
      phase:              'draw',
      held:               null,
      heldFrom:           null,
      specialAction:      null,
      turn:               state.turn + 1,
    }
  }, [])

  // ── Utilitaire : remélangeage si pioche vide ────────────────
  const ensureDeck = useCallback((state: GameState): GameState => {
    if (state.deck.length > 0) return state
    if (state.discardPile.length <= 1) return state   // plus de cartes du tout

    const top  = state.discardPile[state.discardPile.length - 1]
    const newDeck = shuffle(state.discardPile.slice(0, -1))
    return { ...state, deck: newDeck, discardPile: [top] }
  }, [])

  // ── Auto-resolve des actions spéciales (Queen/Jack) à l'expiration ─
  useEffect(() => {
    if (!gameState || !gameState.specialAction || gameState.specialAction.type !== 'jack') return

    const effectId = gameState.specialAction.effectId
    const actorId = gameState.specialAction.actorId
    const turn = gameState.specialAction.turn
    const expiresAt = gameState.specialAction.expiresAt ?? 0
    const now = Date.now()

    if (expiresAt <= now) {
      console.log('SPECIAL ACTION EXPIRED IMMEDIATELY', gameState.specialAction)
      const next = advanceTurn({ ...gameState, specialAction: null })
      save(next)
      return
    }

    cancelPendingEffect()
    jackTimerRef.current = window.setTimeout(() => {
      const currentState = gameStateRef.current
      if (!currentState || !currentState.specialAction) return
      if (currentState.specialAction.effectId !== effectId) return
      if (currentState.specialAction.actorId !== actorId) return
      if (currentState.specialAction.type !== 'jack') return
      if (currentState.specialAction.turn !== turn) return
      if (currentState.turn !== turn) return

      console.log('SPECIAL ACTION TIMEOUT RESOLVE', currentState.specialAction)
      const next = advanceTurn({ ...currentState, specialAction: null })
      save(next)
    }, expiresAt - now + 50)

    return () => cancelPendingEffect()
  }, [gameState?.specialAction?.effectId, gameState?.specialAction?.expiresAt, gameState?.turn, gameState, advanceTurn, save, cancelPendingEffect])

  // ── Auto-transition de peek → draw après 7 secondes ─────────
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!gameState || phase !== 'peek') {
      if (peekTimerRef.current !== null) {
        clearTimeout(peekTimerRef.current)
        peekTimerRef.current = null
      }
      return
    }

    peekTimerRef.current = window.setTimeout(() => {
      const currentState = gameStateRef.current
      if (!currentState || currentState.phase !== 'peek') return

      const newState: GameState = {
        ...currentState,
        currentPlayerIndex: 0,
        phase: 'draw',
        msg: 'Phase de pioche — à vous de jouer.',
      }
      save(newState)
    }, 7000)

    return () => {
      if (peekTimerRef.current !== null) {
        clearTimeout(peekTimerRef.current)
        peekTimerRef.current = null
      }
    }
  }, [phase, gameState, save])

  // ════════════════════════════════════════════════════════════
  // ACTIONS
  // ════════════════════════════════════════════════════════════

  /**
   * Espionner une carte au début (phase 'peek').
   * Chaque joueur peut regarder 2 cartes.
   * Quand tous ont regardé 2 cartes → phase 'draw'.
   */
  const peekCard = useCallback(async (cardIndex: number) => {
    if (!gameState || !isMyTurn || phase !== 'peek') return

    const currentPeeks = gameState.peeksDone?.[playerId] ?? 0
    if (currentPeeks >= 2) return

    const alreadyPeeked = gameState.hands[playerId]?.peekedIndices?.includes(cardIndex)
    if (alreadyPeeked) {
      console.log('PEEK IGNORED - card already peeked', { playerId, cardIndex })
      return
    }

    const newPeekedIndices = [...(gameState.hands[playerId]?.peekedIndices ?? []), cardIndex]
    const newPeeksDone = { ...(gameState.peeksDone ?? {}) }
    newPeeksDone[playerId] = currentPeeks + 1

    const nextIndex = (gameState.currentPlayerIndex + 1) % gameState.playerOrder.length
    const allReady = gameState.playerOrder.every(pid => (newPeeksDone[pid] ?? 0) >= 2)

    const newState: GameState = {
      ...gameState,
      peeksDone: newPeeksDone,
      hands: {
        ...gameState.hands,
        [playerId]: {
          ...gameState.hands[playerId],
          peekedIndices: newPeekedIndices,
        },
      },
      currentPlayerIndex: nextIndex,
      phase: 'peek',
      msg: 'Espionnage en cours...',
    }

    await save(newState)
  }, [gameState, playerId, phase, isMyTurn, save])

  /**
   * Piocher une carte dans la pioche.
   * Disponible uniquement pendant la phase 'draw' et quand c'est ton tour.
   */
  const drawFromDeck = useCallback(async () => {
    if (!gameState || !isMyTurn || phase !== 'draw') return

    const stateWithDeck = ensureDeck(gameState)
    if (stateWithDeck.deck.length === 0) {
      setError('Plus de cartes dans la pioche !')
      return
    }

    const deck    = [...stateWithDeck.deck]
    const drawn   = deck.pop()!

    await save({
      ...stateWithDeck,
      deck,
      held:     drawn,
      heldFrom: 'deck',
      phase:    'hold',
    })
  }, [gameState, isMyTurn, phase, ensureDeck, save])

  /**
   * Prendre la carte visible de la défausse.
   * L'échange est alors obligatoire (pas de défausse possible).
   */
  const takeFromDiscard = useCallback(async () => {
    if (!gameState || !isMyTurn || phase !== 'draw') return
    if (gameState.discardPile.length === 0) return

    const discardPile = [...gameState.discardPile]
    const taken       = discardPile.pop()!

    await save({
      ...gameState,
      discardPile,
      held:     taken,
      heldFrom: 'discard',
      phase:    'hold',
    })
  }, [gameState, isMyTurn, phase, save])

  /**
   * Échanger la carte tenue avec une carte de sa main.
   * La carte remplacée part sur la défausse.
   */
  const swapWithHand = useCallback(async (cardIndex: number) => {
    if (!gameState || !isMyTurn) return
    // Allow swapping during a queen specialAction (even if held is null)
    const heldRank = gameState.held ? (gameState.held.v ?? gameState.held.rank) : null
    const isQueenSpecial = gameState.specialAction?.type === 'queen' && gameState.specialAction?.actorId === playerId
    // Handle queen specialAction when opponent card was selected first
    if (isQueenSpecial && gameState.specialAction?.firstSelection && gameState.specialAction.firstSelection.owner === 'opponent') {
      const myCards = [...gameState.hands[playerId].cards]
      const opponentId = gameState.playerOrder.find(id => id !== playerId)
      const oH = [...(opponentId ? gameState.hands[opponentId]?.cards ?? [] : [])]
      const targetIndex = gameState.specialAction.firstSelection.index
      if (targetIndex == null || targetIndex < 0 || targetIndex >= oH.length) return

      const opponentCard = oH[targetIndex]
      const replaced = myCards[cardIndex]
      myCards[cardIndex] = opponentCard
      oH[targetIndex] = replaced

      const newHands = {
        ...gameState.hands,
        [playerId]: { ...gameState.hands[playerId], cards: myCards },
      }
      if (opponentId) newHands[opponentId] = { ...gameState.hands[opponentId], cards: oH }

      const discardPile = [...gameState.discardPile]
      const newState = advanceTurn({
        ...gameState,
        hands: newHands,
        discardPile,
        held: null,
        heldFrom: null,
        specialAction: null,
      })

      console.log('QUEEN SWAP COMPLETED (opponent-first)', { playerId, targetIndex, cardIndex })
      await save(newState)
      return
    }

    if (gameState.queenSwapTarget !== null && (heldRank === 'Q' || isQueenSpecial)) {
      const myCards = [...gameState.hands[playerId].cards]
      const opponentId = gameState.playerOrder.find(id => id !== playerId)
      const oH = [...(opponentId ? gameState.hands[opponentId]?.cards ?? [] : [])]
      const targetIndex = gameState.queenSwapTarget
      if (targetIndex == null || targetIndex < 0 || targetIndex >= oH.length) return

      const opponentCard = oH[targetIndex]
      const replaced = myCards[cardIndex]
      myCards[cardIndex] = opponentCard
      oH[targetIndex] = replaced

      const newHands = {
        ...gameState.hands,
        [playerId]: { ...gameState.hands[playerId], cards: myCards },
      }
      if (opponentId) {
        newHands[opponentId] = { ...gameState.hands[opponentId], cards: oH }
      }

      const discardPile = isQueenSpecial ? [...gameState.discardPile] : [...gameState.discardPile, ...(isValidCard(gameState.held) ? [normalizeCard(gameState.held)] : [normalizeCard(gameState.held)])]
      const newState = advanceTurn({
        ...gameState,
        hands: newHands,
        discardPile,
        held: null,
        heldFrom: null,
        queenSwapTarget: null,
        specialAction: null,
      })

      await save(newState)
      return
    }

    const myCards = [...gameState.hands[playerId].cards]
    const replaced = myCards[cardIndex]
    myCards[cardIndex] = gameState.held
    const replacedRank = replaced?.v ?? replaced?.rank

    // If the replaced card (the one moved to discard) is a Queen or Jack,
    // create a specialAction window for the actor instead of advancing the turn immediately.
    if (replacedRank === 'Q' || replacedRank === 'J') {
      const specialType = replacedRank === 'Q' ? 'queen' : 'jack'
      console.log('SPECIAL ACTION STARTED FROM SWAP_WITH_HAND', specialType, { playerId, replaced })
      const newState: GameState = {
        ...gameState,
        hands: {
          ...gameState.hands,
          [playerId]: { ...gameState.hands[playerId], cards: myCards },
        },
        discardPile: [...gameState.discardPile, (isValidCard(replaced) ? normalizeCard(replaced) : normalizeCard(replaced))],
        held: null,
        heldFrom: null,
        specialAction: {
          type: specialType,
          actorId: playerId,
          expiresAt: Date.now() + 10000,
          effectId: crypto.randomUUID(),
          turn: gameState.turn,
          firstSelection: null,
        },
        msg: specialType === 'queen'
          ? `Dame sortie — sélectionnez une carte adverse, puis une carte de votre main (10s)`
          : `Valet sorti — regardez une carte (10s)`,
      }

      await save(newState)
      return
    }

    const newState = advanceTurn({
      ...gameState,
      hands: {
        ...gameState.hands,
        [playerId]: { ...gameState.hands[playerId], cards: myCards },
      },
      discardPile: [...gameState.discardPile, (isValidCard(replaced) ? normalizeCard(replaced) : normalizeCard(replaced))],
      held: null,
      heldFrom: null,
    })

    await save(newState)
  }, [gameState, isMyTurn, phase, playerId, advanceTurn, save])

  /**
   * Défausser la carte tenue (uniquement si elle vient de la pioche).
   * Si elle vient de la défausse, l'échange est obligatoire.
   */
  const discardHeld = useCallback(async () => {
    if (!gameState || !isMyTurn) return
    if (!gameState.held || gameState.heldFrom === 'discard') return

    const heldRank = gameState.held.v ?? gameState.held.rank

    // If the player discards a Queen or Jack, create a specialAction window
    if (heldRank === 'Q' || heldRank === 'J') {
      const specialType = heldRank === 'Q' ? 'queen' : 'jack'
      console.log('SPECIAL ACTION STARTED FROM DISCARD_HELD', specialType, { playerId, held: gameState.held })
      const newState: GameState = {
        ...gameState,
        discardPile: [...gameState.discardPile, (isValidCard(gameState.held) ? normalizeCard(gameState.held) : normalizeCard(gameState.held))],
        held: null,
        heldFrom: null,
        specialAction: {
          type: specialType,
          actorId: playerId,
          expiresAt: Date.now() + 10000,
          effectId: crypto.randomUUID(),
          turn: gameState.turn,
          firstSelection: null,
        },
        // reset jack usage so future Jacks work
        jackPeekUsed: specialType === 'jack' ? false : gameState.jackPeekUsed,
        msg: specialType === 'queen'
          ? `Dame jouée — sélectionnez une carte adverse, puis une carte de votre main (10s)`
          : `Valet joué — regardez une carte (10s)`,
      }

      await save(newState)
      return
    }

    const newState = advanceTurn({
      ...gameState,
      discardPile: [...gameState.discardPile, (isValidCard(gameState.held) ? normalizeCard(gameState.held) : normalizeCard(gameState.held))],
      held:     null,
      heldFrom: null,
    })

    await save(newState)
  }, [gameState, isMyTurn, phase, advanceTurn, save])

  /**
   * Annoncer Dutch !
   * Les autres joueurs ont chacun un dernier tour, puis fin de manche.
   */
  const swapWithOpponent = useCallback(async (cardIndex: number) => {
    if (!gameState || !isMyTurn) return
    const heldValue = gameState.held?.v ?? gameState.held?.rank
    const isQueenSpecial = gameState.specialAction?.type === 'queen' && gameState.specialAction?.actorId === playerId
    if (!( (gameState.held && heldValue === 'Q') || isQueenSpecial )) return
    if (gameState.queenSwapTarget !== null) return
    // Allow during held phase OR during queen specialAction
    if (phase !== 'hold' && !isQueenSpecial) return

    // If specialAction exists (queen), use firstSelection flow
    if (isQueenSpecial) {
      const sa = gameState.specialAction || { firstSelection: null }
      const newSa = { ...sa }
      // Record opponent selection if firstSelection is null or if owner differs
      if (!newSa.firstSelection) newSa.firstSelection = { owner: 'opponent', index: cardIndex }
      const newState: GameState = { ...gameState, specialAction: newSa, msg: 'Carte adverse sélectionnée — sélectionnez une carte de votre main.' }
      console.log('QUEEN FIRST CARD SELECTED (opponent)', { playerId, cardIndex })
      await save(newState)
      return
    }

    const newState: GameState = {
      ...gameState,
      queenSwapTarget: cardIndex,
      msg: 'Sélectionnez une carte de votre main pour l’échanger.',
    }

    await save(newState)
  }, [gameState, isMyTurn, phase, save])

  const peekOpponentCard = useCallback(async (cardIndex: number) => {
    if (!gameState || !isMyTurn || phase !== 'hold') return
    const heldRank = gameState.held?.v ?? gameState.held?.rank
    const isJackSpecial = gameState.specialAction?.type === 'jack' && gameState.specialAction?.actorId === playerId
    if (!( (gameState.held && heldRank === 'J') || isJackSpecial )) return
    if (gameState.jackPeekUsed) {
      console.log('JACK EFFECT BLOCKED - already used', { playerId })
      return
    }

    const discardPile = [...gameState.discardPile]
    if (gameState.held) discardPile.push(isValidCard(gameState.held) ? normalizeCard(gameState.held) : normalizeCard(gameState.held))

    const resolvedState: GameState = {
      ...gameState,
      discardPile,
      held: null,
      heldFrom: null,
      jackPeekUsed: true,
      specialAction: null,
      msg: "Au tour du joueur suivant...",
      selected: [],
    }

    const newState = advanceTurn(resolvedState)
    cancelPendingEffect()

    console.log('JACK EFFECT COMPLETED (opponent peek)', { playerId, cardIndex })
    await save(newState)
  }, [gameState, isMyTurn, phase, advanceTurn, save, clearJackTimer])

  const peekOwnCard = useCallback(async (cardIndex: number) => {
    if (!gameState || !isMyTurn || phase !== 'hold') return
    const heldRank = gameState.held?.v ?? gameState.held?.rank
    const isJackSpecial = gameState.specialAction?.type === 'jack' && gameState.specialAction?.actorId === playerId
    if (!( (gameState.held && heldRank === 'J') || isJackSpecial )) return
    if (gameState.jackPeekUsed) {
      console.log('JACK EFFECT BLOCKED - already used', { playerId })
      return
    }

    const discardPile = [...gameState.discardPile]
    if (gameState.held) discardPile.push(isValidCard(gameState.held) ? normalizeCard(gameState.held) : normalizeCard(gameState.held))

    const resolvedState: GameState = {
      ...gameState,
      discardPile,
      held: null,
      heldFrom: null,
      jackPeekUsed: true,
      specialAction: null,
      msg: "Au tour du joueur suivant...",
      selected: [],
    }

    const newState = advanceTurn(resolvedState)
    cancelPendingEffect()

    console.log('JACK EFFECT COMPLETED (own peek)', { playerId, cardIndex })
    await save(newState)
  }, [gameState, isMyTurn, phase, advanceTurn, save, clearJackTimer])

  const toggleSelectedDiscard = useCallback((cardIndex: number) => {
    if (!gameState || phase !== 'draw') return
    if (!gameState.discardPile.length) return

    const selected = gameState.selected?.includes(cardIndex)
      ? gameState.selected.filter(i => i !== cardIndex)
      : [...(gameState.selected ?? []), cardIndex]

    save({ ...gameState, selected })
  }, [gameState, phase, save])

  const validateDiscardSelection = useCallback(async () => {
    if (!gameState || phase !== 'draw' || !gameState.selected?.length || !gameState.discardPile.length) return

    const top = gameState.discardPile[gameState.discardPile.length - 1]
    const selectedCards = gameState.selected.map(i => gameState.hands[playerId].cards[i])
    const valid = selectedCards.every(c =>
      (c.v ?? c.rank) === (top.v ?? top.rank) ||
      (c.s ?? c.suit) === (top.s ?? top.suit)
    )

    let deck = [...gameState.deck]
    let discardPile = [...gameState.discardPile]
    let hand = [...gameState.hands[playerId].cards]
    let selected = [] as number[]
    let msg = valid ? 'Correspondance valide ! Au tour de l’adversaire...' : 'Correspondance erronée — pénalité appliquée.'

    if (valid) {
      const cardsToDiscard = selectedCards
      discardPile = [...discardPile, ...cardsToDiscard]
      hand = hand.filter((_, idx) => !gameState.selected.includes(idx))
    }

    if (!valid && game?.settings?.penalties) {
      const penaltyCount = game?.settings?.penaltyCards ?? 1
      for (let k = 0; k < penaltyCount; k++) {
        if (!deck.length) {
          if (discardPile.length <= 1) break
          const topSecret = discardPile.pop()
          deck = shuffle(discardPile)
          discardPile = [topSecret!]
        }
        if (deck.length) {
          hand.push(deck.pop()!)
        }
      }
    }

    const nextPhase = hand.length === 0 || (gameState.lastTurnPlayerIds.length > 0 && gameState.dutchCallerId && gameState.dutchCallerId !== playerId)
      ? 'end'
      : 'draw'

    await save({
      ...gameState,
      deck,
      discardPile,
      hands: {
        ...gameState.hands,
        [playerId]: {
          ...gameState.hands[playerId],
          cards: hand,
        },
      },
      phase: nextPhase as GamePhase,
      msg: nextPhase === 'end' ? 'Vous avez vidé votre main ! Révélation des cartes...' : msg,
      selected,
    })
  }, [gameState, phase, playerId, save, game])

  const callDutch = useCallback(async () => {
    if (!gameState || !isMyTurn || phase !== 'draw') return
    if (gameState.dutchCallerId) return   // Dutch déjà annoncé

    const lastTurnPlayers = gameState.playerOrder.filter(pid => pid !== playerId)

    const newState = advanceTurn({
      ...gameState,
      dutchCallerId:     playerId,
      lastTurnPlayerIds: lastTurnPlayers,
      phase:             'dutch_last',
    })

    await save({ ...newState, phase: newState.phase === 'draw' ? 'draw' : newState.phase })
  }, [gameState, isMyTurn, phase, playerId, advanceTurn, save])

  // ── Ce que le joueur peut voir ───────────────────────────────
  const opponentInfo = players
    .filter(p => p.id !== playerId)
    .map(p => ({
      id:        p.id,
      name:      p.name,
      cardCount: gameState?.hands[p.id]?.cards.length ?? 0,
      isCurrentPlayer: p.id === currentPlayerId,
    }))

  const canDutch = !!gameState && phase === 'draw' && !gameState.dutchCallerId

  return {
    // État
    game,
    players,
    gameState,
    phase,
    isMyTurn,
    currentPlayerId,
    myHand,
    myPeeksUsed,
    opponentInfo,
    error,
    // Actions
    peekCard,
    drawFromDeck,
    takeFromDiscard,
    swapWithHand,
    discardHeld,
    callDutch,
    swapWithOpponent,
    peekOpponentCard,
    peekOwnCard,
    toggleSelectedDiscard,
    validateDiscardSelection,
    // État dérivé
    canDutch,
  }
}
