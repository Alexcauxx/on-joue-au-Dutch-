/**
 * useGame — Hook personnalisé qui contient toute la logique du jeu Dutch.
 *
 * En séparant la logique ici, le composant GameScreen reste lisible :
 * il s'occupe uniquement de l'affichage, pas des règles.
 *
 * @param {object}   params
 * @param {string}   params.diff    - Difficulté IA : 'facile' | 'normal' | 'expert'
 * @param {function} params.onEnd   - Callback appelé quand la partie se termine
 */

import { useState, useEffect, useRef } from 'react'
import { buildDeck, shuffle, totalScore } from '../utils/cards.js'
import { DIFF_THRESHOLD } from '../constants/game.js'

export function useGame({ diff, rules, onEnd }) {
  // ── État initial ─────────────────────────────────────────────
  const initState = () => {
    const d = buildDeck(rules?.kingZero)
    const pH = d.splice(0, 4)   // 4 cartes joueur
    const oH = d.splice(0, 4)   // 4 cartes adversaire
    const first = d.pop()       // première carte de la défausse
    return {
      deck:     d,
      disc:     [first],
      pH,                        // main du joueur
      oH,                        // main de l'adversaire
      pVis:    [false, false, false, false],  // cartes joueur visibles ?
      oVis:    [false, false, false, false],  // cartes adversaire visibles ?
      peeks:    0,               // nb de cartes espionnées au début
      selected: [],              // indices des cartes sélectionnées pour la défausse
      phase:   'peek',           // phase courante (voir ci-dessous)
      held:     null,            // carte actuellement en main
      heldFrom: null,            // 'deck' ou 'discard'
      dutch:    null,            // qui a appelé Dutch ? 'player' | 'opponent' | null
      lastTurn: false,           // dernier tour en cours ?
      queenSwapTarget: null,     // index de la carte adverse choisie pour l'échange Dame
      jackPeekUsed: false,       // si le valet tenu a déjà été utilisé pour espionner
      msg:     'Espionnez 2 de vos cartes 👀',
      turn:     1,
    }
    /*
      Phases possibles :
      'peek'   → début : le joueur choisit 2 cartes à espionner
      'p_draw' → tour joueur : piocher dans le deck ou la défausse
      'p_hold' → tour joueur : carte en main, choisir où la placer
      'opp'    → tour adversaire (IA, automatique)
      'end'    → fin de partie, toutes les cartes retournées
    */
  }

  const [gs, setGs] = useState(initState)
  const aiTimerRef = useRef(null)
  const peekTimerRef = useRef(null)

  // ── Tour de l'IA ─────────────────────────────────────────────
  useEffect(() => {
    if (gs.phase !== 'opp') return

    const delay = 1200 + Math.random() * 700  // délai naturel (1.2–1.9s)

    aiTimerRef.current = setTimeout(() => {
      setGs(g => {
        let deck = [...g.deck]
        let disc = [...g.disc]
        const oH   = [...g.oH]
        const oVis = [...g.oVis]

        // Remélangeage si le deck est vide
        if (!deck.length) {
          if (disc.length <= 1) return { ...g, phase: 'end', msg: 'Plus de cartes !' }
          const top = disc.pop()
          deck = shuffle(disc)
          disc = [top]
        }

        // L'IA décide : prendre la défausse ou piocher ?
        const top    = disc[disc.length - 1]
        const avg    = totalScore(oH) / 4
        const bias   = diff === 'facile' ? 1.3 : diff === 'expert' ? 0.65 : 1.0
        let drawn

        if (top && top.p < avg * bias * 0.75 && Math.random() > 0.35) {
          // Prendre la défausse (si elle est avantageuse)
          drawn = top
          disc  = disc.slice(0, -1)
        } else {
          // Piocher dans le deck
          drawn = deck.pop()
        }

        // L'IA décide : échanger avec la pire carte ou défausser ?
        const worstIdx = oH.reduce((mi, c, i) => c.p > oH[mi].p ? i : mi, 0)
        if (drawn.p < oH[worstIdx].p) {
          disc = [...disc, oH[worstIdx]]
          oH[worstIdx] = drawn
          oVis[worstIdx] = false
        } else {
          disc = [...disc, drawn]
        }

        // L'IA appelle-t-elle Dutch ?
        const aiScore       = totalScore(oH)
        const callThreshold = DIFF_THRESHOLD[diff] ?? 8
        const callDutch     = !g.dutch && aiScore <= callThreshold && Math.random() > (diff === 'expert' ? 0.25 : 0.55)

        // Si c'est le dernier tour (joueur a appelé Dutch) → fin
        if (g.lastTurn) {
          return { ...g, oH, oVis, deck, disc, phase: 'end', msg: 'Révélation des cartes !' }
        }

        // L'IA appelle Dutch → le joueur a un dernier tour
        if (callDutch) {
          return {
            ...g, oH, oVis, deck, disc,
            dutch: 'opponent', lastTurn: true,
            phase: 'p_draw', turn: g.turn + 1,
            msg: "L'adversaire appelle Dutch ! Votre dernier tour.",
          }
        }

        // Tour normal : passe la main au joueur
        return { ...g, oH, oVis, deck, disc, phase: 'p_draw', turn: g.turn + 1, msg: 'À vous ! Piochez ou prenez la défausse.' }
      })
    }, delay)

    return () => clearTimeout(aiTimerRef.current)
  }, [gs.phase])  // Se déclenche à chaque fois que la phase change vers 'opp'

  useEffect(() => {
    return () => clearTimeout(peekTimerRef.current)
  }, [])

  // ── Fin de partie ─────────────────────────────────────────────
  useEffect(() => {
    if (gs.phase !== 'end') return

    const { pH, oH, dutch } = gs

    // Retourner toutes les cartes visuellement
    setGs(g => ({ ...g, pVis: [true, true, true, true], oVis: [true, true, true, true] }))

    // Attendre 1.6s puis aller à l'écran de score
    const t = setTimeout(() => onEnd({ pH, oH, dutch }), 1600)
    return () => clearTimeout(t)
  }, [gs.phase])

  // ── Actions du joueur ─────────────────────────────────────────

  /** Espionner une carte au début de partie */
  const peek = (i) => {
    if (gs.phase !== 'peek' || gs.pVis[i] || gs.peeks >= 2) return

    setGs(g => {
      const pVis = [...g.pVis]
      pVis[i] = true
      const peeks = g.peeks + 1
      return {
        ...g, pVis, peeks,
        msg:   peeks < 2 ? 'Espionnez encore une carte 👀' : 'Bonne chance ! Piochez pour commencer.',
        phase: peeks >= 2 ? 'p_draw' : 'peek',
      }
    })

    // Cacher la carte après 2.4 secondes
    setTimeout(() => {
      setGs(g => {
        const pVis = [...g.pVis]
        pVis[i] = false
        return { ...g, pVis }
      })
    }, 2400)
  }

  /** Piocher une carte du deck */
  const drawDeck = () => {
    if (gs.phase !== 'p_draw') return

    setGs(g => {
      let deck = [...g.deck]
      let disc = [...g.disc]

      // Remélangeage si nécessaire
      if (!deck.length) {
        if (disc.length <= 1) return { ...g, phase: 'end', msg: 'Plus de cartes !' }
        const top = disc.pop()
        deck = shuffle(disc)
        disc = [top]
      }

      const drawn = deck.pop()
      const ability = drawn.v === 'Q' && rules?.queenSwap
        ? 'Tapez sur une carte adverse pour échanger.'
        : drawn.v === 'J' && rules?.jackPeek
          ? 'Tapez sur une carte (vous ou adversaire) pour espionner.'
          : 'Échangez ou défaussez.'
      return {
        ...g, deck, disc,
        held: drawn, heldFrom: 'deck',
        phase: 'p_hold',
        jackPeekUsed: false,
        msg: `${drawn.v}${drawn.s} piochée — ${ability}`,
        selected: [],
      }
    })
  }

  /** Prendre la carte du dessus de la défausse */
  const takeDisc = () => {
    if (gs.phase !== 'p_draw' || !gs.disc.length) return

    setGs(g => {
      const disc  = [...g.disc]
      const taken = disc.pop()
      const ability = taken.v === 'Q' && rules?.queenSwap
        ? 'Tapez sur une carte adverse pour échanger.'
        : taken.v === 'J' && rules?.jackPeek
          ? 'Tapez sur une carte (vous ou adversaire) pour espionner.'
          : 'Vous devez l’échanger.'
      return {
        ...g, disc,
        held: taken, heldFrom: 'discard',
        phase: 'p_hold',
        jackPeekUsed: false,
        msg: `${taken.v}${taken.s} prise — ${ability}`,
        selected: [],
      }
    })
  }

  /** Échanger la carte en main avec une carte de sa propre main */
  const swapCard = (i) => {
    if (gs.phase !== 'p_hold') return

    setGs(g => {
      if (
        g.queenSwapTarget !== null &&
        g.held?.v === 'Q' &&
        rules?.queenSwap
      ) {
        const pH   = [...g.pH]
        const oH   = [...g.oH]
        const oVis = [...g.oVis]
        const opponentCard = oH[g.queenSwapTarget]
        const oldCard = pH[i]

        pH[i] = opponentCard
        oH[g.queenSwapTarget] = oldCard
        oVis[g.queenSwapTarget] = false

        return {
          ...g, pH, oH, oVis,
          disc: [...g.disc, g.held],
          held: null, heldFrom: null,
          queenSwapTarget: null,
          phase: 'opp',
          msg: "Dame jouée ! Échange effectué.",
          selected: [],
        }
      }

      const pH   = [...g.pH]
      const old  = pH[i]
      pH[i]      = g.held            // la carte en main prend la place
      const pVis = [...g.pVis]
      pVis[i]    = false             // la nouvelle carte est face cachée

      const disc  = [...g.disc, old] // l'ancienne carte va à la défausse
      const next  = (g.lastTurn && g.dutch === 'opponent') ? 'end' : 'opp'

      return {
        ...g, pH, pVis, disc,
        held: null, heldFrom: null,
        phase: next,
        msg: next === 'end' ? 'Révélation !' : "Au tour de l'adversaire...",
        selected: [],
      }
    })
  }

  /** Défausser la carte en main (uniquement si elle vient du deck) */
  const discardHeld = () => {
    if (gs.phase !== 'p_hold' || gs.heldFrom === 'discard') return

    setGs(g => {
      const disc = [...g.disc, g.held]
      const next = (g.lastTurn && g.dutch === 'opponent') ? 'end' : 'opp'
      return {
        ...g, disc,
        held: null, heldFrom: null,
        phase: next,
        msg: next === 'end' ? 'Révélation !' : "Au tour de l'adversaire...",
        selected: [],
      }
    })
  }

  /** Échanger une carte adverse avec une dame tenue en main */
  const swapWithOpponent = (idx) => {
    if (gs.phase !== 'p_hold' || !rules?.queenSwap || gs.held?.v !== 'Q' || gs.queenSwapTarget !== null) return
    setGs(g => ({
      ...g,
      queenSwapTarget: idx,
      msg: 'Sélectionnez une carte de votre main pour l’échanger.',
    }))
  }

  /** Espionner une carte adverse avec un valet tenu en main */
  const peekOpponentCard = (idx) => {
    if (gs.phase !== 'p_hold' || !rules?.jackPeek || gs.held?.v !== 'J' || gs.jackPeekUsed) return
    setGs(g => {
      const oVis = [...g.oVis]
      oVis[idx] = true
      const disc = [...g.disc, g.held]
      const next = (g.lastTurn && g.dutch === 'opponent') ? 'end' : 'opp'
      return {
        ...g, oVis, disc,
        held: null, heldFrom: null,
        jackPeekUsed: true,
        phase: next,
        msg: next === 'end' ? 'Révélation !' : "Au tour de l'adversaire...",
        selected: [],
      }
    })

    clearTimeout(peekTimerRef.current)
    peekTimerRef.current = setTimeout(() => {
      setGs(g => {
        if (g.phase === 'end') return g
        const oVis = [...g.oVis]
        oVis[idx] = false
        return { ...g, oVis }
      })
    }, 2400)
  }

  /** Espionner une carte propre avec un valet tenu en main */
  const peekOwnCard = (idx) => {
    if (gs.phase !== 'p_hold' || !rules?.jackPeek || gs.held?.v !== 'J' || gs.jackPeekUsed) return
    setGs(g => {
      const pVis = [...g.pVis]
      pVis[idx] = true
      const disc = [...g.disc, g.held]
      const next = (g.lastTurn && g.dutch === 'opponent') ? 'end' : 'opp'
      return {
        ...g, pVis, disc,
        held: null, heldFrom: null,
        jackPeekUsed: true,
        phase: next,
        msg: next === 'end' ? 'Révélation !' : "Au tour de l'adversaire...",
        selected: [],
      }
    })

    clearTimeout(peekTimerRef.current)
    peekTimerRef.current = setTimeout(() => {
      setGs(g => {
        if (g.phase === 'end') return g
        const pVis = [...g.pVis]
        pVis[idx] = false
        return { ...g, pVis }
      })
    }, 2400)
  }

  /** Valider la défausse sélectionnée contre la défausse */
  const drawPenaltyCards = (deck, disc, pH, pVis, count) => {
    let newDeck = [...deck]
    let newDisc = [...disc]
    const newPH = [...pH]
    const newPVis = [...pVis]

    for (let k = 0; k < count; k++) {
      if (!newDeck.length) {
        if (newDisc.length <= 1) break
        const top = newDisc.pop()
        newDeck = shuffle(newDisc)
        newDisc = [top]
      }
      if (newDeck.length) {
        newPH.push(newDeck.pop())
        newPVis.push(false)
      }
    }

    return { deck: newDeck, disc: newDisc, pH: newPH, pVis: newPVis }
  }

  const toggleSelectedDiscard = (i) => {
    if (gs.phase !== 'p_draw' || !rules?.discardMatch) return
    setGs(g => {
      const selected = g.selected.includes(i)
        ? g.selected.filter(j => j !== i)
        : [...g.selected, i]
      return { ...g, selected }
    })
  }

  const validateDiscardSelection = () => {
    if (gs.phase !== 'p_draw' || !rules?.discardMatch || !gs.selected.length || !gs.disc.length) return

    setGs(g => {
      const top = g.disc[g.disc.length - 1]
      const selectedCards = g.selected.map(i => g.pH[i])
      const valid = selectedCards.every(c => c.v === top.v || c.s === top.s)
      let pH = g.pH.filter((_, idx) => !g.selected.includes(idx))
      let pVis = g.pVis.filter((_, idx) => !g.selected.includes(idx))
      let disc = [...g.disc, ...selectedCards]
      let deck = [...g.deck]
      let msg = valid
        ? 'Correspondance valide ! Au tour de l’adversaire...'
        : 'Correspondance erronée — pénalité appliquée.'

      if (!valid && rules?.penalty) {
        const penaltyResult = drawPenaltyCards(deck, disc, pH, pVis, 2)
        deck = penaltyResult.deck
        disc = penaltyResult.disc
        pH = penaltyResult.pH
        pVis = penaltyResult.pVis
      }

      const next = pH.length === 0 || (g.lastTurn && g.dutch === 'opponent') ? 'end' : 'opp'
      if (next === 'end' && pH.length === 0) {
        msg = 'Vous avez vidé votre main ! Révélation des cartes...'
      }

      return { ...g, deck, disc, pH, pVis, phase: next, msg, selected: [] }
    })
  }

  /** Appeler Dutch (le joueur pense avoir le meilleur score) */
  const callDutch = () => {
    if (gs.phase !== 'p_draw' || gs.dutch) return
    setGs(g => ({
      ...g,
      dutch: 'player', lastTurn: true,
      phase: 'opp',
      msg: "Dutch ! L'adversaire a un dernier tour...",
      selected: [],
    }))
  }

  // ── État dérivé (calculé depuis gs) ──────────────────────────
  const isPlayerTurn   = ['p_draw', 'p_hold', 'peek'].includes(gs.phase)
  const isOpponentTurn = gs.phase === 'opp'
  const canDraw        = gs.phase === 'p_draw'
  const canDutch       = gs.phase === 'p_draw' && !gs.dutch

  return {
    gs,
    // Actions
    peek, drawDeck, takeDisc, swapCard, discardHeld, callDutch,
    swapWithOpponent, peekOpponentCard, peekOwnCard,
    toggleSelectedDiscard, validateDiscardSelection,
    // État dérivé
    isPlayerTurn, isOpponentTurn, canDraw, canDutch,
  }
}
