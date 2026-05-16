/**
 * App.jsx — Navigation centrale.
 * Corrections : écran d'erreur si initError, bouton reset, logs de navigation.
 */
import { useState, useEffect }  from 'react'
import { useAuth, resetAuth }   from './hooks/useAuth'
import StatusBar                from './components/ui/StatusBar'
import SettingsModal            from './components/modals/SettingsModal'
import AuthScreen, { Avatar }   from './components/screens/AuthScreen'
import HomeScreen               from './components/screens/HomeScreen'
import ProfileScreen            from './components/screens/ProfileScreen'
import CreateGameScreen         from './components/screens/CreateGameScreen'
import JoinGameScreen           from './components/screens/JoinGameScreen'
import WaitingRoomScreen        from './components/screens/WaitingRoomScreen'
import GameScreen               from './components/screens/GameScreen'
import ScoreScreen              from './components/screens/ScoreScreen'
import { DEFAULT_RULES }        from './constants/game'
import { getPlayers, startGame } from './services/gameService'

export default function App() {
  const {
    profile, loading, initError, isAuthenticated,
    signInAnonymously, sendMagicLink, updateProfile,
    recordGameResult, signOut,
  } = useAuth()

  const [screen,       setScreen]       = useState('home')
  const [gameData,     setGameData]     = useState(null)
  const [gameResult,   setGameResult]   = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [rules,        setRules]        = useState(DEFAULT_RULES)
  const [gameKey,      setGameKey]      = useState(0)
  const [inviteCode,   setInviteCode]   = useState('')

  // Lire le code d'invitation dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      setInviteCode(code.toUpperCase())
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && inviteCode && screen === 'home') setScreen('join')
  }, [isAuthenticated, inviteCode])

  const goHome = () => { setScreen('home'); setGameData(null); setGameResult(null) }

  const handleProfileCreated = async (name, color) => {
    await signInAnonymously(name, color); setScreen('home')
  }

  const handleGameCreated = ({ game, player }) => {
    setGameData({ game, player }); setScreen('waiting')
  }

  const handleGameJoined = ({ game, player }) => {
    setGameData({ game, player })
    if (game.status === 'playing') { setGameKey(k => k+1); setScreen('game') }
    else setScreen('waiting')
  }

  const handleGameStarted = (updatedGame) => {
    console.log('[APP] GAME STATUS CHANGED TO PLAYING')
    if (!updatedGame) return

    setGameData(prev => {
      if (!prev) return prev

      if (updatedGame.id) {
        console.log('[APP] NAVIGATING TO GAME SCREEN', { gameId: updatedGame.id })
        return { ...prev, game: updatedGame }
      }

      console.log('[APP] MERGING GAME STATE INTO EXISTING GAME RECORD')
      return {
        ...prev,
        game: {
          ...prev.game,
          status: 'playing',
          game_state: updatedGame,
        },
      }
    })

    setGameKey(k => k+1)
    setScreen('game')
  }

  const handleGameEnd = async (result) => {
    setGameResult(result); setScreen('score')
    if (result && profile) await recordGameResult(result.playerWon ?? false).catch(() => {})
  }

  const handleReplay = () => {
    // If multiplayer and current player is host, restart the game on the server
    if (gameData?.game && gameData?.player) {
      const isHost = gameData.player.is_host || gameData.player.isHost
      if (!isHost) { goHome(); return }

      (async () => {
        try {
          const players = await getPlayers(gameData.game.id)
          const gameState = await startGame(gameData.game.id, players, gameData.game.settings)
          handleGameStarted(gameState)
        } catch (e) {
          console.error('[APP] replay start failed', e)
          goHome()
        }
      })()
      setGameResult(null)
      return
    }

    // Solo / local replay
    setGameKey(k => k+1)
    setScreen('game')
    setGameResult(null)
  }

  // ── Écran de chargement ──────────────────────────────────────
  if (loading) return (
    <PhoneFrame>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div style={{ fontSize:40, color:'#d4a853' }}>♦</div>
        <div style={{ color:'rgba(240,235,224,.5)', fontFamily:'"DM Sans",sans-serif', fontSize:14 }}>
          Chargement...
        </div>
      </div>
    </PhoneFrame>
  )

  // ── Écran d'erreur (Supabase inaccessible, session corrompue) ─
  if (initError) return (
    <PhoneFrame>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:'0 28px' }}>
        <div style={{ fontSize:40 }}>⚠️</div>
        <div style={{ color:'#f0ebe0', fontFamily:'"Cormorant Garamond",serif', fontSize:20, fontWeight:700, textAlign:'center' }}>
          Erreur au démarrage
        </div>
        <div style={{ color:'rgba(240,235,224,.45)', fontFamily:'"DM Sans",sans-serif', fontSize:13, textAlign:'center', lineHeight:1.5 }}>
          {initError}
        </div>
        <button onClick={resetAuth} style={{
          padding:'14px 24px', borderRadius:13, border:'none', cursor:'pointer',
          background:'linear-gradient(135deg,#d4a853,#f0cb72)', color:'#080d14',
          fontSize:14, fontWeight:700, fontFamily:'"DM Sans",sans-serif',
        }}>
          Réinitialiser et recommencer
        </button>
      </div>
    </PhoneFrame>
  )

  return (
    <PhoneFrame>
      {!isAuthenticated ? (
        <AuthScreen onProfileCreated={handleProfileCreated} />
      ) : (
        <>
          {/* Bouton profil sur l'accueil */}
          {screen === 'home' && profile && (
            <button onClick={() => setScreen('profile')} style={{
              position:'absolute', top:54, right:16, zIndex:10,
              background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)',
              borderRadius:20, padding:'6px 12px 6px 6px',
              display:'flex', alignItems:'center', gap:8, cursor:'pointer',
            }}>
              <Avatar name={profile.display_name} color={profile.avatar_color} size={28} />
              <span style={{ color:'#f0ebe0', fontSize:13, fontFamily:'"DM Sans",sans-serif',
                             fontWeight:600, maxWidth:80, overflow:'hidden',
                             textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {profile.display_name}
              </span>
            </button>
          )}

          {screen === 'home'    && <HomeScreen onNew={() => setScreen('create')} onJoin={() => setScreen('join')} onSettings={() => setSettingsOpen(true)} />}
          {screen === 'profile' && <ProfileScreen profile={profile} onUpdate={updateProfile} onSendMagicLink={sendMagicLink} onSignOut={async () => { await signOut(); setScreen('home') }} onBack={() => setScreen('home')} />}
          {screen === 'create'  && <CreateGameScreen playerName={profile?.display_name ?? ''} onGameCreated={handleGameCreated} onBack={goHome} />}
          {screen === 'join'    && <JoinGameScreen initialCode={inviteCode} playerName={profile?.display_name ?? ''} onGameJoined={handleGameJoined} onBack={goHome} />}
          {screen === 'waiting' && gameData && <WaitingRoomScreen game={gameData.game} player={gameData.player} onGameStarted={handleGameStarted} onBack={goHome} />}
          {screen === 'game'    && gameData && <GameScreen key={gameKey} rules={rules} playerName={gameData.player.name} diff="normal" onEnd={handleGameEnd} onHome={goHome} gameId={gameData.game.id} playerId={gameData.player.id} isHost={gameData.player.is_host} />}
          {screen === 'score'   && gameResult && <ScoreScreen pHand={gameResult.pH} oHand={gameResult.oH} dutch={gameResult.dutch} playerName={profile?.display_name ?? 'Joueur'} rules={rules} onReplay={handleReplay} onHome={goHome} />}
          {screen === 'home'    && settingsOpen && <SettingsModal rules={rules} onChange={setRules} onClose={() => setSettingsOpen(false)} />}
        </>
      )}
      <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', width:120, height:4, borderRadius:2, background:'rgba(255,255,255,.18)', pointerEvents:'none' }} />
    </PhoneFrame>
  )
}

function PhoneFrame({ children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#020408', padding:'20px 0' }}>
      <div style={{ width:390, height:844, borderRadius:50, background:'#060912', overflow:'hidden', position:'relative', display:'flex', flexDirection:'column', boxShadow:'0 50px 100px rgba(0,0,0,.8), 0 0 0 8px rgba(255,255,255,.038)' }}>
        <StatusBar />
        {children}
      </div>
    </div>
  )
}
