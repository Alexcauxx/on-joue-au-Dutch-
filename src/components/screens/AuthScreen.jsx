/**
 * AuthScreen — Écran de bienvenue et création de profil.
 *
 * Affiché uniquement à la première visite.
 * Le joueur choisit son prénom et une couleur d'avatar.
 * Pas de mot de passe — connexion anonyme automatique.
 */

import { useState } from 'react'

// Couleurs disponibles pour l'avatar
const AVATAR_COLORS = [
  '#d4a853', // or
  '#5bc97b', // vert
  '#e06060', // rouge
  '#60a0e0', // bleu
  '#c060e0', // violet
  '#e0a060', // orange
  '#60e0d4', // cyan
  '#e060a0', // rose
]

export default function AuthScreen({ onProfileCreated }) {
  const [name,         setName]         = useState('')
  const [avatarColor,  setAvatarColor]  = useState('#d4a853')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const handleCreate = async () => {
    if (!name.trim()) { setError('Entre ton prénom pour continuer.'); return }
    if (name.trim().length < 2) { setError('Ton prénom doit faire au moins 2 caractères.'); return }
    setLoading(true)
    setError('')
    try {
      await onProfileCreated(name.trim(), avatarColor)
    } catch (e) {
      setError(e.message || 'Erreur lors de la création du profil.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(ellipse at 50% 20%, #0c2a1c, #060912 70%)',
      padding: '0 28px 40px', justifyContent: 'center',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20, margin: '0 auto 18px',
          background: 'linear-gradient(145deg,#1a237e,#2d3f9e)',
          border: '2px solid rgba(212,168,83,.42)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34, color: '#d4a853',
          boxShadow: '0 12px 40px rgba(0,0,0,.5)',
        }}>♦</div>
        <h1 style={{
          fontFamily: '"Cormorant Garamond",serif',
          fontSize: 44, fontWeight: 700, letterSpacing: 10,
          color: '#f0ebe0', margin: 0,
        }}>DUTCH</h1>
        <p style={{
          fontFamily: '"DM Sans",sans-serif',
          color: 'rgba(212,168,83,.6)', fontSize: 12, letterSpacing: 3, marginTop: 6,
        }}>JEU DE CARTES</p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)',
        borderRadius: 20, padding: '24px 20px',
      }}>
        <h2 style={{
          fontFamily: '"Cormorant Garamond",serif', color: '#f0ebe0',
          fontSize: 20, fontWeight: 700, textAlign: 'center',
          marginBottom: 22, letterSpacing: 1,
        }}>Crée ton profil</h2>

        {/* Prénom */}
        <div style={{ marginBottom: 22 }}>
          <Label>TON PRÉNOM</Label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            maxLength={20}
            placeholder="Ex : Sophie"
            autoFocus
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.12)',
              color: '#f0ebe0', fontSize: 16, fontFamily: '"DM Sans",sans-serif', outline: 'none',
            }}
          />
        </div>

        {/* Couleur de l'avatar */}
        <div style={{ marginBottom: 24 }}>
          <Label>TA COULEUR</Label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {AVATAR_COLORS.map(color => (
              <div
                key={color}
                onClick={() => setAvatarColor(color)}
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  background: color, cursor: 'pointer',
                  border: avatarColor === color
                    ? '3px solid #fff'
                    : '3px solid transparent',
                  boxShadow: avatarColor === color
                    ? `0 0 0 2px ${color}`
                    : 'none',
                  transition: 'all .15s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Aperçu du profil */}
        {name.trim() && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,.04)', borderRadius: 12,
            padding: '10px 14px', marginBottom: 18,
          }}>
            <Avatar name={name} color={avatarColor} size={40} />
            <div>
              <div style={{ color: '#f0ebe0', fontSize: 15, fontWeight: 600,
                            fontFamily: '"DM Sans",sans-serif' }}>{name}</div>
              <div style={{ color: 'rgba(240,235,224,.4)', fontSize: 11,
                            fontFamily: '"DM Sans",sans-serif' }}>Nouveau joueur</div>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{
            background: 'rgba(224,96,96,.1)', border: '1px solid rgba(224,96,96,.25)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 14,
            color: '#e06060', fontSize: 13, fontFamily: '"DM Sans",sans-serif',
          }}>⚠️ {error}</div>
        )}

        {/* Bouton */}
        <button onClick={handleCreate} disabled={loading} style={{
          width: '100%', padding: '15px', borderRadius: 13, border: 'none',
          background: loading
            ? 'rgba(255,255,255,.08)'
            : 'linear-gradient(135deg,#d4a853,#f0cb72,#d4a853)',
          color: loading ? '#f0ebe0' : '#080d14',
          fontSize: 15, fontWeight: 700, fontFamily: '"DM Sans",sans-serif',
          cursor: loading ? 'wait' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(212,168,83,.3)',
          opacity: loading ? .7 : 1,
        }}>
          {loading ? '⏳ Création du profil...' : 'Commencer à jouer →'}
        </button>
      </div>

      <p style={{
        textAlign: 'center', color: 'rgba(240,235,224,.2)', fontSize: 11,
        fontFamily: '"DM Sans",sans-serif', marginTop: 16, lineHeight: 1.5,
      }}>
        Pas de mot de passe requis.<br/>
        Tu pourras ajouter un email depuis ton profil<br/>pour jouer sur plusieurs appareils.
      </p>
    </div>
  )
}

// ── Sous-composants ─────────────────────────────────────────

function Label({ children }) {
  return (
    <div style={{ color: 'rgba(240,235,224,.4)', fontSize: 10, letterSpacing: 2,
                  fontFamily: '"DM Sans",sans-serif', fontWeight: 600, marginBottom: 9 }}>
      {children}
    </div>
  )
}

// Composant Avatar — initiale dans un cercle coloré
export function Avatar({ name, color, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 700, color: '#080d14',
      fontFamily: '"DM Sans",sans-serif',
    }}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  )
}
