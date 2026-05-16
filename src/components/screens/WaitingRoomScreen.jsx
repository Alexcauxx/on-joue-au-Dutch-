/**
 * WaitingRoomScreen — Version finale corrigée.
 *
 * Changements clés :
 * - startGame() retourne le gameState
 * - Navigation IMMÉDIATE sans attendre Supabase Realtime
 * - Logs complets pour diagnostiquer en console
 * - catch bloque toujours le loading si erreur
 */
import { useState, useEffect } from 'react'
import { subscribeToGame, startGame, getPlayers } from '../../services/gameService'

export default function WaitingRoomScreen({ game, player, onGameStarted, onBack }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [copied,  setCopied]  = useState(false)

  const inviteLink = `${window.location.origin}?code=${game.code}`

  useEffect(() => {
    getPlayers(game.id).then(list => {
      console.log('[GAME] PLAYERS LOADED', list.map(p => p.name))
      setPlayers(list)
    })
  }, [game.id])

  // Realtime : pour que les joueurs non-hôtes voient le lancement
  useEffect(() => {
    const unsub = subscribeToGame(
      game.id,
      (updatedGame) => {
        if (updatedGame.status === 'playing') {
          console.log('[APP] GAME STATUS CHANGED TO PLAYING via Realtime')
          console.log('[APP] NAVIGATING TO GAME SCREEN')
          onGameStarted(updatedGame)
        }
      },
      (list) => setPlayers(list)
    )
    return unsub
  }, [game.id])

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => { alert('Lien : ' + inviteLink) })
  }

  const handleStart = async () => {
    console.log('[GAME] START GAME CLICKED')
    console.log('[GAME] HOST CHECK RESULT', player.is_host)
    console.log('[GAME] CURRENT PLAYER', player.name, player.id)
    console.log('[GAME] PLAYERS LOADED', players.map(p => p.name))

    if (!player.is_host) {
      setError("Seul l'hôte peut lancer la partie.")
      return
    }
    if (players.length < 2) {
      setError('Il faut au moins 2 joueurs.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const gameState = await startGame(game.id, players, game.settings)

      console.log('[APP] NAVIGATING TO GAME SCREEN')

      // Navigation immédiate — sans attendre Supabase Realtime
      onGameStarted({
        ...game,
        status:     'playing',
        game_state:  gameState,
      })

    } catch (e) {
      console.error('[GAME] START GAME ERROR', e)
      setError(e.message || 'Impossible de lancer la partie. Vérifie la console.')
      setLoading(false)  // TOUJOURS débloquer si erreur
    }
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(ellipse at 50% 0%, #0c2a1c, #060912 65%)',
      padding: '0 20px 40px', overflowY: 'auto',
    }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', padding:'16px 0 20px' }}>
        <button onClick={onBack} style={{ background:'none', border:'none',
          color:'rgba(240,235,224,.4)', fontSize:24, cursor:'pointer', marginRight:12 }}>‹</button>
        <div>
          <h2 style={{ fontFamily:'"Cormorant Garamond",serif', color:'#f0ebe0',
            fontSize:20, fontWeight:700, letterSpacing:3, margin:0 }}>SALLE D'ATTENTE</h2>
          <div style={{ color:'rgba(212,168,83,.6)', fontSize:11,
            fontFamily:'"DM Sans",sans-serif', letterSpacing:1 }}>
            {player.is_host ? "Vous êtes l'hôte" : 'En attente du lancement...'}
          </div>
        </div>
      </div>

      {/* Code de partie */}
      <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)',
        borderRadius:16, padding:'18px', marginBottom:16, textAlign:'center' }}>
        <div style={{ color:'rgba(240,235,224,.4)', fontSize:10, letterSpacing:2,
          fontFamily:'"DM Sans",sans-serif', marginBottom:8 }}>CODE DE LA PARTIE</div>
        <div style={{ fontFamily:'"Cormorant Garamond",serif', fontSize:38, fontWeight:700,
          color:'#d4a853', letterSpacing:10, marginBottom:14 }}>{game.code}</div>
        <button onClick={handleCopy} style={{
          width:'100%', padding:'12px', borderRadius:10,
          background: copied ? 'rgba(91,201,123,.15)' : 'rgba(212,168,83,.1)',
          border:`1px solid ${copied ? 'rgba(91,201,123,.3)' : 'rgba(212,168,83,.25)'}`,
          color: copied ? '#5bc97b' : '#d4a853',
          fontSize:13, fontFamily:'"DM Sans",sans-serif', fontWeight:600,
          cursor:'pointer', transition:'all .2s',
        }}>
          {copied ? '✓ Lien copié !' : "📋 Copier le lien d'invitation"}
        </button>
      </div>

      {/* Liste joueurs */}
      <div style={{ marginBottom:16 }}>
        <div style={{ color:'rgba(240,235,224,.4)', fontSize:10, letterSpacing:2,
          fontFamily:'"DM Sans",sans-serif', marginBottom:12 }}>
          JOUEURS ({players.length}/{game.settings?.maxPlayers ?? 10})
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {players.map(p => <PlayerRow key={p.id} playerData={p} isMe={p.id === player.id} />)}
          {players.length < 2 && <EmptySlot />}
        </div>
      </div>

      {/* Règles */}
      <div style={{ background:'rgba(255,255,255,.03)', borderRadius:12,
        padding:'12px 16px', marginBottom:16, border:'1px solid rgba(255,255,255,.05)' }}>
        <div style={{ color:'rgba(240,235,224,.4)', fontSize:10, letterSpacing:2,
          fontFamily:'"DM Sans",sans-serif', marginBottom:8 }}>RÈGLES</div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <Rule label="Cartes"           value={`${game.settings?.cardsPerPlayer ?? 4} / joueur`} />
          <Rule label="Paquets"          value={game.settings?.numDecks ?? 2} />
          <Rule label="Max joueurs"      value={game.settings?.maxPlayers ?? 10} />
          <Rule label="Cartes spéciales" value={game.settings?.specialCards ? 'Oui' : 'Non'} />
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ background:'rgba(224,96,96,.1)', border:'1px solid rgba(224,96,96,.25)',
          borderRadius:10, padding:'10px 14px', marginBottom:14,
          color:'#e06060', fontSize:13, fontFamily:'"DM Sans",sans-serif' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Bouton lancer / attente */}
      {player.is_host ? (
        <button onClick={handleStart} disabled={loading || players.length < 2} style={{
          padding:'16px', borderRadius:14, border:'none',
          background: (!loading && players.length >= 2)
            ? 'linear-gradient(135deg,#d4a853,#f0cb72,#d4a853)'
            : 'rgba(255,255,255,.06)',
          color: (!loading && players.length >= 2) ? '#080d14' : 'rgba(240,235,224,.3)',
          fontSize:16, fontWeight:700, fontFamily:'"DM Sans",sans-serif',
          cursor: (!loading && players.length >= 2) ? 'pointer' : 'not-allowed',
          transition:'all .2s',
        }}>
          {loading
            ? '⏳ Lancement en cours...'
            : players.length < 2
              ? "En attente d'un autre joueur..."
              : `🃏 Lancer la partie (${players.length} joueurs)`}
        </button>
      ) : (
        <div style={{ textAlign:'center', padding:'16px', borderRadius:14,
          color:'rgba(240,235,224,.4)', fontSize:14, fontFamily:'"DM Sans",sans-serif',
          background:'rgba(255,255,255,.03)' }}>
          En attente que l'hôte lance la partie...
        </div>
      )}
    </div>
  )
}

function PlayerRow({ playerData, isMe }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12,
      background: isMe ? 'rgba(212,168,83,.08)' : 'rgba(255,255,255,.04)',
      border:`1px solid ${isMe ? 'rgba(212,168,83,.2)' : 'rgba(255,255,255,.06)'}`,
      borderRadius:12, padding:'12px 14px' }}>
      <div style={{ width:36, height:36, borderRadius:18, display:'flex',
        alignItems:'center', justifyContent:'center', fontSize:16,
        fontWeight:700, color: isMe ? '#080d14' : '#f0ebe0',
        background: isMe ? 'linear-gradient(135deg,#d4a853,#f0cb72)' : 'rgba(255,255,255,.08)' }}>
        {playerData.name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ color:'#f0ebe0', fontSize:15, fontFamily:'"DM Sans",sans-serif', fontWeight:600 }}>
          {playerData.name}
          {isMe && <span style={{ color:'#d4a853', fontSize:11, marginLeft:8 }}>( vous )</span>}
        </div>
        {playerData.is_host && (
          <div style={{ color:'rgba(212,168,83,.6)', fontSize:11, fontFamily:'"DM Sans",sans-serif' }}>Hôte</div>
        )}
      </div>
      <div style={{ width:8, height:8, borderRadius:4,
        background: playerData.is_connected ? '#5bc97b' : '#e06060' }} />
    </div>
  )
}

function EmptySlot() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12,
      background:'rgba(255,255,255,.02)', border:'1px dashed rgba(255,255,255,.06)',
      borderRadius:12, padding:'12px 14px' }}>
      <div style={{ width:36, height:36, borderRadius:18,
        border:'2px dashed rgba(255,255,255,.1)', display:'flex',
        alignItems:'center', justifyContent:'center',
        color:'rgba(255,255,255,.15)', fontSize:18 }}>+</div>
      <div style={{ color:'rgba(240,235,224,.2)', fontSize:13,
        fontFamily:'"DM Sans",sans-serif' }}>En attente d'un joueur...</div>
    </div>
  )
}

function Rule({ label, value }) {
  return (
    <div>
      <div style={{ color:'rgba(240,235,224,.35)', fontSize:10,
        fontFamily:'"DM Sans",sans-serif', letterSpacing:1 }}>{label}</div>
      <div style={{ color:'#f0ebe0', fontSize:13,
        fontFamily:'"DM Sans",sans-serif', fontWeight:600 }}>{value}</div>
    </div>
  )
}
