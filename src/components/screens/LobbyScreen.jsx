import { useState, useEffect } from 'react'
import { G, ff } from '../../constants/theme.js'
import Button from '../ui/Button.jsx'
import FaceCard from '../cards/FaceCard.jsx'

/** Cartes de prévisualisation affichées dans le lobby */
const PREVIEW_CARDS = [
  { s: '♠', v: 'A',  p: 1  },
  { s: '♥', v: '7',  p: 7  },
  { s: '♦', v: 'K',  p: 0  },
  { s: '♣', v: '3',  p: 3  },
]

/**
 * LobbyScreen — Configuration de la partie avant de jouer.
 *
 * Props :
 *  mode     'create' | 'join'
 *  onStart  fn({ name, diff }) — démarre la partie
 *  onBack   fn — retour à l'accueil
 */
export default function LobbyScreen({ mode, onStart, onBack }) {
  const [name,      setName]      = useState('Joueur')
  const [diff,      setDiff]      = useState('normal')
  const [searching, setSearching] = useState(mode === 'join')

  // Simulation de recherche de parties (mode "rejoindre")
  useEffect(() => {
    if (mode !== 'join') return
    const t = setTimeout(() => setSearching(false), 2200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      style={{
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        background:    `radial-gradient(ellipse at 50% 0%, #0c2a1c, ${G.bg})`,
        padding:       '0 24px 32px',
        overflowY:     'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0 28px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: G.dim,
            fontSize: 24, cursor: 'pointer', marginRight: 12,
            lineHeight: 1, padding: '4px',
          }}
        >
          ‹
        </button>
        <h2 style={{ fontFamily: ff(true), color: G.text, fontSize: 22, fontWeight: 700, letterSpacing: 3 }}>
          {mode === 'create' ? 'CRÉER UNE PARTIE' : 'REJOINDRE'}
        </h2>
      </div>

      {/* Écran de recherche */}
      {searching ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 40, color: G.gold }} className="animate-spin-slow">⟳</div>
          <div style={{ color: G.text, fontFamily: ff(), fontSize: 16 }}>Recherche de parties...</div>
          <div style={{ color: G.dim, fontFamily: ff(), fontSize: 13 }}>Mode IA activé si aucune trouvée</div>
        </div>
      ) : (
        <>
          {/* Bandeau info si mode "rejoindre" */}
          {mode === 'join' && (
            <div
              style={{
                background:   'rgba(91,201,123,.08)',
                border:       '1px solid rgba(91,201,123,.22)',
                borderRadius:  12,
                padding:      '12px 16px',
                marginBottom:  22,
              }}
            >
              <div style={{ color: G.ok, fontSize: 13, fontFamily: ff(), fontWeight: 600 }}>
                Aucune partie disponible
              </div>
              <div style={{ color: 'rgba(91,201,123,.6)', fontSize: 12, marginTop: 3, fontFamily: ff() }}>
                Vous jouerez contre l'IA en mode local
              </div>
            </div>
          )}

          {/* Champ nom */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ color: G.dim, fontSize: 10, letterSpacing: 2, fontFamily: ff(), marginBottom: 9, fontWeight: 600 }}>
              VOTRE NOM
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={16}
              placeholder="Votre nom"
              style={{
                width:        '100%',
                padding:      '14px 16px',
                borderRadius:  12,
                background:    G.surface,
                border:       `1.5px solid ${G.border}`,
                color:         G.text,
                fontSize:      16,
                fontFamily:    ff(),
              }}
            />
          </div>

          {/* Sélecteur de difficulté */}
          <div style={{ marginBottom: 30 }}>
            <div style={{ color: G.dim, fontSize: 10, letterSpacing: 2, fontFamily: ff(), marginBottom: 12, fontWeight: 600 }}>
              DIFFICULTÉ IA
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                ['facile', 'Facile 🌿'],
                ['normal', 'Normal ⚡'],
                ['expert', 'Expert 🔥'],
              ].map(([value, label]) => (
                <div
                  key={value}
                  onClick={() => setDiff(value)}
                  style={{
                    flex:          1,
                    padding:       '10px 0',
                    borderRadius:   11,
                    textAlign:     'center',
                    cursor:        'pointer',
                    background:    diff === value ? 'rgba(212,168,83,.13)' : G.surface,
                    border:       `1.5px solid ${diff === value ? 'rgba(212,168,83,.5)' : G.border}`,
                    color:         diff === value ? G.gold : G.dim,
                    fontSize:      12,
                    fontFamily:    ff(),
                    fontWeight:    600,
                    transition:   'all .15s',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Aperçu des cartes */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28, opacity: .55 }}>
            {PREVIEW_CARDS.map((card, i) => <FaceCard key={i} card={card} w={46} h={65} />)}
          </div>

          <Button variant="gold" onClick={() => onStart({ name: name.trim() || 'Joueur', diff })}>
            Commencer →
          </Button>
        </>
      )}
    </div>
  )
}
