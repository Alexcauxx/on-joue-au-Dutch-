import { G, ff } from '../../constants/theme.js'
import Button from '../ui/Button.jsx'
import Toggle from '../ui/Toggle.jsx'

/** Options de règles affichées dans le modal */
const RULE_OPTIONS = [
  {
    key:  'kingZero',
    label: 'Roi vaut 0 point',
    desc:  'Le Roi est la carte la plus précieuse',
  },
  {
    key:  'queenSwap',
    label: 'Dame = échange',
    desc:  'Échanger une carte avec l\'adversaire',
  },
  {
    key:  'jackPeek',
    label: 'Valet = espionner',
    desc:  'Regarder une carte adverse quand on joue un Valet',
  },
  {
    key:  'discardMatch',
    label: 'Défausse similaire',
    desc:  'Sélectionner une ou plusieurs cartes similaires à la défausse',
  },
  {
    key:  'penalty',
    label: 'Pénalité',
    desc:  'Appliquer une pénalité si la défausse est incorrecte',
  },
]

/**
 * SettingsModal — Panneau de paramètres (règles du jeu).
 * S'affiche en glissant depuis le bas.
 *
 * Props :
 *  rules    object  — état actuel des règles
 *  onChange fn      — appelé avec le nouvel objet rules à chaque toggle
 *  onClose  fn      — ferme le modal
 */
export default function SettingsModal({ rules, onChange, onClose }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position:       'absolute',
        inset:           0,
        zIndex:          200,
        background:     'rgba(0,0,0,.75)',
        backdropFilter: 'blur(8px)',
        display:        'flex',
        alignItems:     'flex-end',
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          width:        '100%',
          background:  'linear-gradient(180deg, #111827, #0c1118)',
          borderRadius: '22px 22px 0 0',
          border:       `1px solid ${G.border}`,
          padding:      '0 22px 44px',
        }}
      >
        {/* Poignée */}
        <div
          style={{
            width:        36,
            height:       4,
            borderRadius: 2,
            background:  'rgba(255,255,255,.18)',
            margin:      '16px auto 22px',
          }}
        />

        <h2
          style={{
            fontFamily:    ff(true),
            color:         G.text,
            fontSize:      22,
            fontWeight:    700,
            marginBottom:  20,
            letterSpacing: 2,
          }}
        >
          PARAMÈTRES
        </h2>

        {RULE_OPTIONS.map(({ key, label, desc }) => (
          <div
            key={key}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '13px 0',
              borderBottom:   `1px solid ${G.border}`,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ color: G.text, fontSize: 14, fontWeight: 600, fontFamily: ff() }}>
                {label}
              </div>
              <div style={{ color: G.dim, fontSize: 11, marginTop: 2, fontFamily: ff() }}>
                {desc}
              </div>
            </div>

            <Toggle
              on={rules[key]}
              onToggle={() => onChange({ ...rules, [key]: !rules[key] })}
            />
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          <Button variant="gold" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  )
}
