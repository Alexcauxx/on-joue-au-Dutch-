import { useState } from 'react'
import { createGame } from '../../services/gameService'

export default function CreateGameScreen({ playerName = '', onGameCreated, onBack }) {
  const [name,    setName]    = useState(playerName)
  const [cards,   setCards]   = useState(4)
  const [decks,   setDecks]   = useState(2)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleCreate = async () => {
    if (!name.trim()) { setError('Entre ton pseudo.'); return }
    setLoading(true); setError('')
    try {
      const result = await createGame(name.trim(), { cardsPerPlayer: cards, numDecks: decks })
      onGameCreated(result)
    } catch (e) {
      setError(e.message || 'Erreur lors de la création.')
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
          fontSize:22, fontWeight:700, letterSpacing:3 }}>CRÉER UNE PARTIE</h2>
      </div>

      <div style={{ marginBottom:24 }}>
        <Label>TON PSEUDO</Label>
        <input
          id="player-name"
          name="player-name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          maxLength={20}
          placeholder="Ex : Sophie"
          autoComplete="nickname"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom:24 }}>
        <Label>CARTES PAR JOUEUR</Label>
        <div style={{ display:'flex', gap:10 }}>
          {[4, 6].map(n => (
            <ChoiceBtn key={n} selected={cards === n} onClick={() => setCards(n)}>
              {n} cartes
            </ChoiceBtn>
          ))}
        </div>
        <Hint>4 cartes = parties courtes · 6 cartes = plus de stratégie</Hint>
      </div>

      <div style={{ marginBottom:32 }}>
        <Label>PAQUETS DE CARTES</Label>
        <div style={{ display:'flex', gap:10 }}>
          <ChoiceBtn selected={decks === 1} onClick={() => setDecks(1)}>1 paquet — 52 cartes</ChoiceBtn>
          <ChoiceBtn selected={decks === 2} onClick={() => setDecks(2)}>2 paquets — 104 cartes ★</ChoiceBtn>
        </div>
        <Hint>2 paquets recommandé pour 3+ joueurs</Hint>
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      <button onClick={handleCreate} disabled={loading} style={{
        padding:'16px', borderRadius:14, border:'none',
        background: loading ? 'rgba(255,255,255,.08)' : 'linear-gradient(135deg,#d4a853,#f0cb72,#d4a853)',
        color: loading ? '#f0ebe0' : '#080d14',
        fontSize:16, fontWeight:700, fontFamily:'"DM Sans",sans-serif',
        cursor: loading ? 'wait' : 'pointer',
        boxShadow: loading ? 'none' : '0 4px 20px rgba(212,168,83,.3)',
        opacity: loading ? .7 : 1,
      }}>
        {loading ? '⏳ Création...' : 'Créer la partie →'}
      </button>
    </div>
  )
}

function Label({ children }) {
  return <div style={{ color:'rgba(240,235,224,.4)', fontSize:10, letterSpacing:2,
    fontFamily:'"DM Sans",sans-serif', fontWeight:600, marginBottom:10 }}>{children}</div>
}
function Hint({ children }) {
  return <div style={{ color:'rgba(240,235,224,.3)', fontSize:11,
    fontFamily:'"DM Sans",sans-serif', marginTop:8, lineHeight:1.5 }}>{children}</div>
}
function ChoiceBtn({ children, selected, onClick }) {
  return (
    <div onClick={onClick} style={{ flex:1, padding:'11px 8px', borderRadius:11,
      textAlign:'center', cursor:'pointer',
      background: selected ? 'rgba(212,168,83,.15)' : 'rgba(255,255,255,.04)',
      border:`1.5px solid ${selected ? 'rgba(212,168,83,.55)' : 'rgba(255,255,255,.07)'}`,
      color: selected ? '#d4a853' : 'rgba(240,235,224,.4)',
      fontSize:13, fontFamily:'"DM Sans",sans-serif', fontWeight:600, transition:'all .15s' }}>
      {children}
    </div>
  )
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
