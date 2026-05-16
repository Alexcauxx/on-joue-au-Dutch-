import { useState, useEffect } from 'react'
import { G, ff } from '../../constants/theme'
import { useGame } from '../../hooks/useGame'
import { useMultiplayerGame } from '../../hooks/useMultiplayerGame'
import FaceCard from '../cards/FaceCard'
import BackCard from '../cards/BackCard'
import Button from '../ui/Button'
import SettingsModal from '../modals/SettingsModal'

function mapMultiplayerGameStateToScreenState(gameState, playerId, localPVis = [], localOVis = []) {
  if (!gameState) return null

  const myHand = gameState.hands[playerId]?.cards ?? []
  const opponentId = gameState.playerOrder.find(id => id !== playerId)
  const opponentHand = opponentId ? gameState.hands[opponentId]?.cards ?? [] : []
  const isEnd = gameState.phase === 'end'
  const peeks = gameState.peeksDone?.[playerId] ?? 0
  const phase = gameState.phase === 'draw'
    ? 'p_draw'
    : gameState.phase === 'hold'
      ? 'p_hold'
      : gameState.phase === 'dutch_last'
        ? 'p_draw'
        : gameState.phase

  const pVis = isEnd
    ? myHand.map(() => true)
    : myHand.map((_, index) => !!localPVis[index])

  const oVis = isEnd
    ? opponentHand.map(() => true)
    : opponentHand.map((_, index) => !!localOVis[index])

  return {
    ...gameState,
    phase,
    disc:            gameState.discardPile ?? [],
    pH:              myHand,
    oH:              opponentHand,
    pVis,
    oVis,
    selected:        gameState.selected ?? [],
    queenSwapTarget: gameState.queenSwapTarget ?? null,
    jackPeekUsed:    gameState.jackPeekUsed ?? false,
    peeks,
    msg:             gameState.msg ?? '',
    dutch:           gameState.dutchCallerId === playerId ? 'player' : gameState.dutchCallerId ? 'opponent' : null,
  }
}

/**
 * GameScreen — Table de jeu principale.
 *
 * Props :
 *  rules       object  — règles du jeu (kingZero, queenPeek…)
 *  playerName  string  — nom du joueur
 *  diff        string  — difficulté IA ('facile' | 'normal' | 'expert')
 *  onEnd       fn({pH, oH, dutch}) — appelé en fin de partie
 *  onHome      fn — retour à l'accueil
 *  gameId      string? — ID de la partie multijoueur (si présent, mode multijoueur)
 *  playerId    string? — ID du joueur (pour multijoueur)
 *  isHost      boolean? — si le joueur est hôte (pour multijoueur)
 */
export default function GameScreen({ rules, playerName, diff, onEnd, onHome, gameId, playerId, isHost }) {
  const [showSettings, setShowSettings] = useState(false)
  const [localRules, setLocalRules]     = useState(rules)
  const [localPVis, setLocalPVis]       = useState([])
  const [localOVis, setLocalOVis]       = useState([])
  const [nowTick, setNowTick] = useState(Date.now())

  // Choisir le hook selon le mode
  const isMultiplayer = Boolean(gameId && playerId)
  const gameHook = isMultiplayer
    ? useMultiplayerGame({ gameId, playerId, onGameEnd: onEnd })
    : useGame({ diff, rules: localRules, onEnd })

  // Mapper les actions pour compatibilité
  const multiplayerGameState = isMultiplayer
    ? mapMultiplayerGameStateToScreenState(gameHook.gameState, playerId, localPVis, localOVis)
    : null

  const {
    gs,
    peek, drawDeck, takeDisc, swapCard, discardHeld, callDutch,
    swapWithOpponent, peekOpponentCard, peekOwnCard,
    toggleSelectedDiscard, validateDiscardSelection,
    isPlayerTurn, isOpponentTurn, canDraw, canDutch,
  } = isMultiplayer ? {
    gs: multiplayerGameState,
    peek: gameHook.peekCard,
    drawDeck: gameHook.drawFromDeck,
    takeDisc: gameHook.takeFromDiscard,
    swapCard: gameHook.swapWithHand,
    discardHeld: gameHook.discardHeld,
    callDutch: gameHook.callDutch,
    swapWithOpponent: gameHook.swapWithOpponent,
    peekOpponentCard: gameHook.peekOpponentCard,
    peekOwnCard: gameHook.peekOwnCard,
    toggleSelectedDiscard: gameHook.toggleSelectedDiscard,
    validateDiscardSelection: gameHook.validateDiscardSelection,
    isPlayerTurn: gameHook.isMyTurn,
    isOpponentTurn: !gameHook.isMyTurn && gameHook.phase !== 'end',
    canDraw: gameHook.phase === 'draw' && gameHook.isMyTurn,
    canDutch: gameHook.canDutch,
  } : gameHook

  const revealTempVisibility = (setter, index) => {
    setter(prev => {
      const next = [...(prev || [])]
      next[index] = true
      return next
    })
    setTimeout(() => setter(prev => {
      const next = [...(prev || [])]
      next[index] = false
      return next
    }), 2400)
  }

  const handlePeek = (index) => {
    const alreadyPeeked = Boolean(playerId && gs?.hands?.[playerId]?.peekedIndices?.includes(index))
    console.log('INITIAL_PEEK_PHASE_ACTIVE', { phase: gs?.phase, playerId })
    console.log('CARD_CLICK_ATTEMPT', { index, playerId, phase: gs?.phase, peeks: gs?.peeks, alreadyPeeked })

    if (!peek || gs?.phase !== 'peek' || localPVis[index] || gs?.peeks >= 2 || alreadyPeeked) {
      console.log('CARD_CLICK_BLOCKED', {
        index,
        playerId,
        phase: gs?.phase,
        reason: !peek ? 'NO_PEEK_ACTION'
          : gs?.phase !== 'peek' ? 'NOT_PEEK_PHASE'
          : localPVis[index] ? 'ALREADY_VISIBLE'
          : gs?.peeks >= 2 ? 'MAX_PEEKS_REACHED'
          : alreadyPeeked ? 'ALREADY_PEEKED' : 'UNKNOWN',
      })
      return
    }

    console.log('CARD_CLICK_ALLOWED', { index, playerId, phase: gs?.phase, peeks: gs?.peeks })
    revealTempVisibility(setLocalPVis, index)
    peek(index)
  }

  const handlePeekOwnCard = (index) => {
    if (!isPlayerTurn || !peekOwnCard) return
    revealTempVisibility(setLocalPVis, index)
    peekOwnCard(index)
  }

  const handlePeekOpponentCard = (index) => {
    if (!isPlayerTurn || !peekOpponentCard) return
    revealTempVisibility(setLocalOVis, index)
    peekOpponentCard(index)
  }

  // Tick to update specialAction countdown in UI
  useEffect(() => {
    if (!gs || !gs.specialAction) return
    const t = setInterval(() => setNowTick(Date.now()), 500)
    return () => clearInterval(t)
  }, [gs?.specialAction])

  if (!gs) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: G.bg, color: G.text }}>
        Chargement de la partie...
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: G.bg, overflow: 'hidden' }}>

      {/* ── En-tête ─────────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '8px 16px',
          borderBottom:   `1px solid ${G.border}`,
          flexShrink:      0,
        }}
      >
        <button
          onClick={onHome}
          style={{ background: 'none', border: 'none', color: G.dim, fontSize: 24, cursor: 'pointer', padding: '4px 6px', lineHeight: 1 }}
        >
          ‹
        </button>

        <div style={{ fontFamily: ff(true), color: G.text, fontSize: 17, letterSpacing: 3, fontWeight: 600 }}>
          DUTCH
        </div>

        <button
          onClick={() => setShowSettings(true)}
          style={{ background: 'none', border: 'none', color: G.dim, fontSize: 15, cursor: 'pointer', padding: '4px 6px' }}
        >
          ⚙
        </button>
      </div>

      {/* ── Contenu principal ────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 14px', minHeight: 0 }}>

        {/* Zone adversaire */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '12px 0 10px', flexShrink: 0 }}>
          <div
            style={{
              color:         isOpponentTurn ? G.gold : G.dim,
              fontSize:      10,
              fontFamily:    ff(),
              letterSpacing: 2,
              fontWeight:    600,
              transition:   'color .3s',
              display:      'flex',
              alignItems:   'center',
              gap:           6,
            }}
          >
            {isOpponentTurn && (
              <span
                className="animate-pulse-dot"
                style={{ width: 6, height: 6, borderRadius: 3, background: G.gold, display: 'inline-block' }}
              />
            )}
            ADVERSAIRE{isOpponentTurn ? ' · réfléchit...' : ''}
          </div>

          <div style={{ display: 'flex', gap: 7 }}>
            {(gs.oH ?? []).map((card, i) => {
              const special = gs.specialAction
              const isSpecialActor = special && special.actorId === playerId
              const canTargetOpponent = isPlayerTurn && ((gs.phase === 'p_hold' && gs.held && (
                (gs.held.v === 'Q' && localRules.queenSwap) ||
                (gs.held.v === 'J' && localRules.jackPeek && !gs.jackPeekUsed)
              )) || (isSpecialActor && special?.type === 'queen') || (isSpecialActor && special?.type === 'jack' && localRules.jackPeek && !gs.jackPeekUsed))
              const isSelectedOpponent = gs.queenSwapTarget === i

              return gs.oVis?.[i]
                ? <FaceCard
                    key={i}
                    card={card}
                    w={57}
                    h={81}
                    glow={canTargetOpponent || isSelectedOpponent}
                    onClick={canTargetOpponent ? () => {
                      if ((gs.held && (gs.held.v === 'Q')) || (isSpecialActor && special?.type === 'queen')) swapWithOpponent(i)
                      if ((gs.held && (gs.held.v === 'J')) || (isSpecialActor && special?.type === 'jack')) peekOpponentCard(i)
                    } : undefined}
                  />
                : <BackCard
                    key={i}
                    w={57}
                    h={81}
                    dim={isPlayerTurn && gs.phase !== 'peek'}
                    glow={canTargetOpponent || isSelectedOpponent}
                    onClick={canTargetOpponent ? () => {
                      if ((gs.held && (gs.held.v === 'Q')) || (isSpecialActor && special?.type === 'queen')) swapWithOpponent(i)
                      if ((gs.held && (gs.held.v === 'J')) || (isSpecialActor && special?.type === 'jack')) handlePeekOpponentCard(i)
                    } : undefined}
                  />
            })}
          </div>
        </div>

        {/* ── Tapis de jeu (felt) ─────────────────────────── */}
        <div
          style={{
            flex:           1,
            minHeight:      0,
            background:    `radial-gradient(ellipse at 50% 50%, ${G.feltR}, ${G.felt})`,
            borderRadius:   18,
            border:        `1px solid rgba(255,255,255,.05)`,
            boxShadow:     'inset 0 2px 20px rgba(0,0,0,.4)',
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            justifyContent:'center',
            gap:            10,
            padding:       '12px 16px',
            position:      'relative',
            margin:        '0 0 10px',
          }}
        >
          {/* Badge de tour */}
          <div
            style={{
              position:     'absolute',
              top:           9,
              background:  'rgba(0,0,0,.4)',
              borderRadius: 20,
              padding:     '3px 13px',
              color:       'rgba(212,168,83,.5)',
              fontSize:     10,
              fontFamily:   ff(),
              letterSpacing: 1,
            }}
          >
            Tour {gs.turn}
          </div>

          {/* Rangée des piles */}
          <div style={{ display: 'flex', gap: gs.held ? 14 : 24, alignItems: 'flex-start', justifyContent: 'center' }}>

            {/* Pioche */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ color: G.dim, fontSize: 9, letterSpacing: 2, fontFamily: ff(), fontWeight: 600 }}>PIOCHE</div>
              <BackCard w={62} h={90} glow={canDraw} onClick={canDraw ? drawDeck : undefined} />
              <div style={{ color: G.dim, fontSize: 10, fontFamily: ff() }}>{gs.deck.length}</div>
            </div>

            {/* Carte en main */}
            {gs.held && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ color: G.gold, fontSize: 9, letterSpacing: 2, fontFamily: ff(), fontWeight: 600 }}>EN MAIN</div>
                <FaceCard card={gs.held} w={62} h={90} glow lift />
                {gs.heldFrom === 'deck' ? (
                  <button
                    onClick={discardHeld}
                    style={{
                      background:   'rgba(224,96,96,.14)',
                      border:       '1px solid rgba(224,96,96,.28)',
                      borderRadius:  7,
                      padding:      '4px 11px',
                      color:         G.err,
                      fontSize:      10,
                      cursor:       'pointer',
                      fontFamily:    ff(),
                      fontWeight:    600,
                    }}
                  >
                    ↓ Défausser
                  </button>
                ) : (
                  <div style={{ color: 'rgba(212,168,83,.5)', fontSize: 9, fontFamily: ff(), textAlign: 'center', maxWidth: 66, lineHeight: 1.3 }}>
                    Échangez !
                  </div>
                )}
              </div>
            )}

            {/* Défausse */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ color: G.dim, fontSize: 9, letterSpacing: 2, fontFamily: ff(), fontWeight: 600 }}>DÉFAUSSE</div>
              {(gs.disc ?? []).length > 0 ? (
                <FaceCard
                  card={gs.disc[gs.disc.length - 1]}
                  w={62} h={90}
                  glow={canDraw}
                  onClick={canDraw ? takeDisc : undefined}
                />
              ) : (
                <div style={{ width: 62, height: 90, borderRadius: 10, border: `2px dashed rgba(255,255,255,.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.12)', fontSize: 24 }}>
                  ○
                </div>
              )}
              <div style={{ color: G.dim, fontSize: 10, fontFamily: ff() }}>{(gs.disc ?? []).length}</div>
            </div>

          </div>
        </div>

        {/* Zone joueur */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, paddingBottom: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 7 }}>
            {(gs.pH ?? []).map((card, i) => {
              const visible = gs.pVis?.[i] || gs.phase === 'end'
              const heldRank = gs.held?.v ?? gs.held?.rank
              const special = gs.specialAction
              const isSpecialActor = special && special.actorId === playerId
              const isQueenSpecialWithTarget = isSpecialActor && special?.type === 'queen' && gs.queenSwapTarget !== null
              const isJackSpecial = isSpecialActor && special?.type === 'jack' && localRules.jackPeek && !gs.jackPeekUsed && !visible
              const alreadyPeeked = Boolean(playerId && gs?.hands?.[playerId]?.peekedIndices?.includes(i))
              const canClick = (gs.phase === 'peek' && gs.peeks < 2 && !alreadyPeeked)
                || gs.phase === 'p_hold'
                || (gs.phase === 'p_draw' && localRules.discardMatch)
                || (gs.phase === 'p_hold' && heldRank === 'J' && localRules.jackPeek && !gs.jackPeekUsed && !visible)
                || isQueenSpecialWithTarget
                || isJackSpecial
              const handleClick = () => {
                if (gs.phase === 'peek') {
                  handlePeek(i)
                  return
                }
                if (gs.phase === 'p_hold') {
                  if (isJackSpecial) {
                    handlePeekOwnCard(i)
                    return
                  }
                  if (heldRank === 'J' && localRules.jackPeek && !gs.jackPeekUsed && !visible) {
                    handlePeekOwnCard(i)
                    return
                  }
                  swapCard(i)
                  return
                }
                if (gs.phase === 'p_draw' && localRules.discardMatch) {
                  toggleSelectedDiscard(i)
                  return
                }
                if (isQueenSpecialWithTarget) {
                  swapCard(i)
                  return
                }
              }
              const isSelected = gs.phase === 'p_draw' && gs.selected?.includes(i)
              const glowCard = gs.phase === 'p_hold' || (gs.phase === 'peek' && gs.peeks < 2 && !gs.pVis?.[i]) || isSelected || (gs.phase === 'p_hold' && heldRank === 'J' && localRules.jackPeek && !gs.jackPeekUsed && !visible) || isQueenSpecialWithTarget || isJackSpecial

              return visible
                ? <FaceCard key={i} card={card} w={62} h={90} glow={glowCard} selected={isSelected} peek={gs.pVis?.[i]} onClick={canClick ? handleClick : undefined} />
                : <BackCard key={i} w={62} h={90}  glow={glowCard} onClick={canClick ? handleClick : undefined} />
            })}
          </div>

          <div
            style={{
              color:         isPlayerTurn ? G.gold : G.dim,
              fontSize:      10,
              fontFamily:    ff(),
              letterSpacing: 2,
              fontWeight:    600,
              transition:   'color .3s',
              display:      'flex',
              alignItems:   'center',
              gap:           5,
            }}
          >
            {isPlayerTurn && (
              <span
                className="animate-pulse-dot"
                style={{ width: 6, height: 6, borderRadius: 3, background: G.gold, display: 'inline-block' }}
              />
            )}
            {playerName.toUpperCase()}
          </div>
        </div>

      </div>

      {/* ── Barre du bas ─────────────────────────────────────── */}
      <div
        style={{
          padding:     '8px 16px 26px',
          borderTop:   `1px solid ${G.border}`,
          flexShrink:   0,
        }}
      >
        {gs.phase === 'p_draw' && localRules.discardMatch && gs.disc.length > 0 && (
          <div style={{ color: G.dim, fontSize: 12, fontFamily: ff(), marginBottom: 10 }}>
            Sélectionnez une ou plusieurs cartes similaires à la défausse, puis validez votre choix.
          </div>
        )}

        <div
          style={{
            textAlign:     'center',
            color:          G.text,
            fontSize:       13,
            fontFamily:     ff(),
            marginBottom:   canDutch ? 10 : 0,
            minHeight:      18,
            lineHeight:     1.45,
            letterSpacing:  .2,
          }}
        >
          {gs.msg}
          {gs.specialAction && gs.specialAction.actorId === playerId && (
            <div style={{ fontSize: 12, color: G.gold, marginTop: 6 }}>
              Temps restant : {Math.max(0, Math.ceil((gs.specialAction.expiresAt - nowTick) / 1000))}s
            </div>
          )}
        </div>

        {gs.phase === 'p_draw' && localRules.discardMatch && gs.disc.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <Button
              variant="outline"
              disabled={!gs.selected.length}
              onClick={validateDiscardSelection}
            >
              Valider la défausse{gs.selected.length ? ` (${gs.selected.length})` : ''}
            </Button>
          </div>
        )}

        {canDutch && (
          <Button variant="dutch" onClick={callDutch}>🃏 DUTCH !</Button>
        )}
      </div>

      {/* Modal paramètres */}
      {showSettings && (
        <SettingsModal
          rules={localRules}
          onChange={setLocalRules}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
