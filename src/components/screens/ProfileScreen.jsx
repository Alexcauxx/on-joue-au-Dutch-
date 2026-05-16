/**
 * ProfileScreen — Voir et modifier son profil joueur.
 *
 * Fonctionnalités :
 * - Voir son prénom, sa couleur, ses statistiques
 * - Modifier son prénom et sa couleur
 * - Ajouter un email pour jouer sur plusieurs appareils
 * - Se déconnecter
 */

import { useState } from 'react'
import { Avatar } from './AuthScreen'

const AVATAR_COLORS = [
  '#d4a853','#5bc97b','#e06060','#60a0e0',
  '#c060e0','#e0a060','#60e0d4','#e060a0',
]

export default function ProfileScreen({ profile, onUpdate, onSendMagicLink, onSignOut, onBack }) {
  const [editing,    setEditing]    = useState(false)
  const [name,       setName]       = useState(profile.display_name)
  const [color,      setColor]      = useState(profile.avatar_color)
  const [email,      setEmail]      = useState('')
  const [showEmail,  setShowEmail]  = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [emailSent,  setEmailSent]  = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  const winRate = profile.games_played > 0
    ? Math.round((profile.games_won / profile.games_played) * 100)
    : 0

  const handleSaveProfile = async () => {
    if (!name.trim()) { setError('Le prénom ne peut pas être vide.'); return }
    setLoading(true)
    setError('')
    try {
      await onUpdate({ display_name: name.trim(), avatar_color: color })
      setEditing(false)
      setSuccess('Profil mis à jour ✓')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const handleSendLink = async () => {
    if (!email.trim()) { setError('Entre ton adresse email.'); return }
    if (!email.includes('@')) { setError('Adresse email invalide.'); return }
    setLoading(true)
    setError('')
    try {
      await onSendMagicLink(email.trim())
      setEmailSent(true)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(ellipse at 50% 0%, #0c2a1c, #060912 65%)',
      padding: '0 20px 40px', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 24px' }}>
        <button onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'rgba(240,235,224,.4)',
                   fontSize: 24, cursor: 'pointer', marginRight: 12 }}>‹</button>
        <h2 style={{ fontFamily: '"Cormorant Garamond",serif', color: '#f0ebe0',
                     fontSize: 22, fontWeight: 700, letterSpacing: 3 }}>MON PROFIL</h2>
      </div>

      {/* Avatar + nom */}
      {!editing ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 18, padding: '20px', marginBottom: 16,
        }}>
          <Avatar name={profile.display_name} color={profile.avatar_color} size={60} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#f0ebe0', fontSize: 20, fontWeight: 700,
                          fontFamily: '"DM Sans",sans-serif' }}>{profile.display_name}</div>
            <div style={{ color: 'rgba(240,235,224,.4)', fontSize: 12,
                          fontFamily: '"DM Sans",sans-serif', marginTop: 2 }}>
              Membre depuis {new Date(profile.created_at ?? Date.now()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <button onClick={() => setEditing(true)} style={{
            background: 'rgba(212,168,83,.1)', border: '1px solid rgba(212,168,83,.25)',
            borderRadius: 10, padding: '8px 14px', color: '#d4a853',
            fontSize: 13, fontFamily: '"DM Sans",sans-serif', cursor: 'pointer', fontWeight: 600,
          }}>Modifier</button>
        </div>
      ) : (
        /* Mode édition */
        <div style={{
          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(212,168,83,.2)',
          borderRadius: 18, padding: '20px', marginBottom: 16,
        }}>
          <div style={{ marginBottom: 18 }}>
            <Label>PRÉNOM</Label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={20}
              style={inputStyle} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <Label>COULEUR</Label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{
                  width: 32, height: 32, borderRadius: 16, background: c, cursor: 'pointer',
                  border: color === c ? '3px solid #fff' : '3px solid transparent',
                  boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                  transition: 'all .15s',
                }} />
              ))}
            </div>
          </div>
          {error && <ErrorBox>{error}</ErrorBox>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setEditing(false); setName(profile.display_name); setColor(profile.avatar_color) }}
              style={{ ...btnStyle, flex: 1, background: 'rgba(255,255,255,.06)', color: '#f0ebe0' }}>
              Annuler
            </button>
            <button onClick={handleSaveProfile} disabled={loading}
              style={{ ...btnStyle, flex: 2, background: 'linear-gradient(135deg,#d4a853,#f0cb72)', color: '#080d14' }}>
              {loading ? '⏳' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(91,201,123,.1)', border: '1px solid rgba(91,201,123,.25)',
                      borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                      color: '#5bc97b', fontSize: 13, fontFamily: '"DM Sans",sans-serif' }}>
          {success}
        </div>
      )}

      {/* Statistiques */}
      <div style={{
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 16, padding: '18px', marginBottom: 14,
      }}>
        <div style={{ color: 'rgba(240,235,224,.4)', fontSize: 10, letterSpacing: 2,
                      fontFamily: '"DM Sans",sans-serif', marginBottom: 14 }}>STATISTIQUES</div>
        <div style={{ display: 'flex', gap: 0 }}>
          <Stat label="Parties" value={profile.games_played} />
          <StatDivider />
          <Stat label="Victoires" value={profile.games_won} color="#5bc97b" />
          <StatDivider />
          <Stat label="Taux victoire" value={`${winRate}%`} color="#d4a853" />
        </div>
      </div>

      {/* Ajouter email pour jouer sur plusieurs appareils */}
      <div style={{
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 16, padding: '18px', marginBottom: 14,
      }}>
        <div style={{ color: 'rgba(240,235,224,.4)', fontSize: 10, letterSpacing: 2,
                      fontFamily: '"DM Sans",sans-serif', marginBottom: 10 }}>
          JOUER SUR PLUSIEURS APPAREILS
        </div>
        <div style={{ color: 'rgba(240,235,224,.45)', fontSize: 13,
                      fontFamily: '"DM Sans",sans-serif', lineHeight: 1.6 }}>
          Cette fonctionnalité n'est pas disponible dans la version locale du jeu.
          Ton profil est stocké uniquement dans le navigateur.
        </div>
      </div>

      {/* Déconnexion */}
      <button onClick={onSignOut} style={{
        background: 'transparent', border: '1px solid rgba(224,96,96,.2)',
        borderRadius: 12, padding: '13px', color: 'rgba(224,96,96,.6)',
        fontSize: 13, fontFamily: '"DM Sans",sans-serif', cursor: 'pointer',
        fontWeight: 600, width: '100%', marginTop: 4,
      }}>
        Se déconnecter
      </button>
    </div>
  )
}

// ── Sous-composants ─────────────────────────────────────────

function Label({ children }) {
  return <div style={{ color: 'rgba(240,235,224,.4)', fontSize: 10, letterSpacing: 2,
                       fontFamily: '"DM Sans",sans-serif', fontWeight: 600, marginBottom: 9 }}>{children}</div>
}

function Stat({ label, value, color = '#f0ebe0' }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: 26,
                    fontWeight: 700, color }}>{value}</div>
      <div style={{ color: 'rgba(240,235,224,.4)', fontSize: 10,
                    fontFamily: '"DM Sans",sans-serif', letterSpacing: 1, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function StatDivider() {
  return <div style={{ width: 1, background: 'rgba(255,255,255,.08)', margin: '0 4px' }} />
}

function ErrorBox({ children }) {
  return (
    <div style={{ background: 'rgba(224,96,96,.1)', border: '1px solid rgba(224,96,96,.25)',
                  borderRadius: 8, padding: '8px 12px', marginBottom: 10,
                  color: '#e06060', fontSize: 12, fontFamily: '"DM Sans",sans-serif' }}>
      ⚠️ {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.1)',
  color: '#f0ebe0', fontSize: 15, fontFamily: '"DM Sans",sans-serif', outline: 'none',
}

const btnStyle = {
  padding: '12px 16px', borderRadius: 11, border: 'none',
  fontSize: 14, fontFamily: '"DM Sans",sans-serif', fontWeight: 600,
  cursor: 'pointer', textAlign: 'center',
}
