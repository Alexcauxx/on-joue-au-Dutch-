import { useState, useEffect } from 'react'
import { joinGame } from '../../services/gameService'

export default function JoinGameScreen({ initialCode = '', playerName = '', onGameJoined, onBack }) {
  const [code,    setCode]    = useState(initialCode)
  const [name,    setName]    = useState(playerName)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => { if (initialCode) setCode(initialCode) }, [initialCode])

  const handleJoin = async () => {
    if (!code.trim()) { setError('Entre le code de la partie.'); return }
    if (!name.trim()) { setError('Entre ton pseudo.'); return }
    setLoading(true); setError('')
    try {
      const result = await joinGame(code.trim(), name.trim())
      onGameJoined(result)
    } catch (e) {
      setError(e.message || 'Impossible de rejoindre.')
      setLoading(false)
    }
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column',
      background:'radial-gradient(ellipse at 50% 20%, #0c2a1c, #060912 70%)',
      padding:'0 24px 40px', overflowY:'auto' }}>

      <div style={{ display:'flex', alignItems:'center', padding:'16px 0 28px' }}>
        <button onClick={onBack} style={{ background:'none', border:'none',
          color:'rgba(240,235,224,.4)', fontSize:24, cursor:'pointer', marginRight:12 }}>‹</button>
        <h2 style={{ fontFamily:'"Cormorant Garamond",serif', color:'#f0ebe0',
          fontSize:22, fontWeight:700, letterSpacing:3 }}>REJOINDRE</h2>
      </div>

      <div style={{ marginBottom:24 }}>
        <Label>CODE DE LA PARTIE</Label>
        <input
          id="game-code"
          name="game-code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="Ex : ABK4Z2"
          maxLength={6}
          autoComplete="off"
          style={{ ...inputStyle, fontSize:26, letterSpacing:6,
            textAlign:'center', fontFamily:'"Cormorant Garamond",serif', fontWeight:700 }}
        />
      </div>

      <div style={{ marginBottom:32 }}>
        <Label>TON PSEUDO</Label>
        <input
          id="player-name"
          name="player-name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          maxLength={20}
          placeholder="Ex : Marie"
          autoComplete="nickname"
          style={inputStyle}
        />
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      <button onClick={handleJoin} disabled={loading} style={{
        padding:'16px', borderRadius:14, border:'none',
        background: loading ? 'rgba(255,255,255,.08)' : 'linear-gradient(135deg,#d4a853,#f0cb72,#d4a853)',
        color: loading ? '#f0ebe0' : '#080d14',
        fontSize:16, fontWeight:700, fontFamily:'"DM Sans",sans-serif',
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? .7 : 1,
      }}>
        {loading ? '⏳ Connexion...' : 'Rejoindre →'}
      </button>
    </div>
  )
}

function Label({ children }) {
  return <div style={{ color:'rgba(240,235,224,.4)', fontSize:10, letterSpacing:2,
    fontFamily:'"DM Sans",sans-serif', fontWeight:600, marginBottom:10 }}>{children}</div>
}
function ErrorBox({ children }) {
  return <div style={{ background:'rgba(224,96,96,.12)', border:'1px solid rgba(224,96,96,.3)',
    borderRadius:10, padding:'10px 14px', marginBottom:16,
    color:'#e06060', fontSize:13, fontFamily:'"DM Sans",sans-serif' }}>⚠️ {children}</div>
}
const inputStyle = {
  width:'100%', padding:'14px 16px', borderRadius:12,
  background:'rgba(255,255,255,.05)', border:'1.5px solid rgba(255,255,255,.1)',
  color:'#f0ebe0', fontSize:16, fontFamily:'"DM Sans",sans-serif', outline:'none',
}
