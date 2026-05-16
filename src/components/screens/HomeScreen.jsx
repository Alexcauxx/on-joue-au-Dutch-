import { SUITS } from '../../constants/game.js'
import { G, ff } from '../../constants/theme.js'
import Button from '../ui/Button.jsx'

/**
 * HomeScreen — Écran d'accueil de l'application.
 *
 * Props :
 *  onNew      fn — créer une partie
 *  onJoin     fn — rejoindre une partie
 *  onSettings fn — ouvrir les paramètres
 */
export default function HomeScreen({ onNew, onJoin, onSettings }) {
  return (
    <div
      style={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '0 28px',
        background:     `radial-gradient(ellipse at 50% 28%, #0c2a1c, ${G.bg} 65%)`,
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 52, textAlign: 'center' }}>
        <div
          style={{
            width:        92,
            height:       92,
            borderRadius: 24,
            margin:      '0 auto 22px',
            background:  `linear-gradient(145deg, ${G.navy}, ${G.navyL})`,
            border:      `2px solid rgba(212,168,83,.42)`,
            display:     'flex',
            alignItems:  'center',
            justifyContent: 'center',
            fontSize:     40,
            color:        G.gold,
            boxShadow:   `0 14px 44px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06)`,
          }}
        >
          ♦
        </div>

        <h1
          style={{
            fontFamily:    ff(true),
            fontSize:      54,
            fontWeight:    700,
            letterSpacing: 12,
            color:         G.text,
            margin:         0,
            textShadow:   `0 2px 32px rgba(212,168,83,.22)`,
          }}
        >
          DUTCH
        </h1>

        <p
          style={{
            fontFamily:    ff(),
            color:         G.goldDim,
            fontSize:      11,
            letterSpacing: 4,
            marginTop:     8,
          }}
        >
          JEU DE CARTES
        </p>
      </div>

      {/* Boutons */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button variant="gold"    onClick={onNew}>Créer une partie</Button>
        <Button variant="outline" onClick={onJoin}>Rejoindre une partie</Button>
        <Button variant="ghost"   onClick={onSettings}>⚙  Paramètres</Button>
      </div>

      {/* Couleurs décoratives en bas */}
      <div style={{ position: 'absolute', bottom: 38, display: 'flex', gap: 14, opacity: .065 }}>
        {SUITS.map(s => (
          <span key={s} style={{ fontSize: 26, color: G.text }}>{s}</span>
        ))}
      </div>
    </div>
  )
}
