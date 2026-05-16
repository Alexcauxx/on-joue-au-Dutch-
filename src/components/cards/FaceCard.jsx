import { RED_SUITS } from '../../constants/game.js'
import { G, ff } from '../../constants/theme.js'

/**
 * FaceCard — Carte retournée (visible), face avant.
 *
 * Props :
 *  card    {s, v, p}  — la carte à afficher
 *  w / h              — dimensions en px (défaut 62×90)
 *  glow               — surbrillance dorée (ex : carte cliquable)
 *  lift               — carte légèrement soulevée (ex : carte en main)
 *  peek               — fond jaune pâle (espionnage)
 *  onClick            — handler de clic
 */
export default function FaceCard({ card, w = 62, h = 90, glow, lift, peek, selected, onClick }) {
  if (!card) {
    return (
      <div style={{ width: w, height: h, borderRadius: 10, background: 'linear-gradient(145deg, #fffef9, #ece7d5)', border: '1.5px solid rgba(0,0,0,.06)' }} />
    )
  }

  const suit = card.s ?? card.suit
  const value = card.v ?? card.rank
  const red = RED_SUITS.has(suit)
  const col = red ? '#c0392b' : '#1a1a2e'

  return (
    <div
      onClick={onClick}
      style={{
        width:       w,
        height:      h,
        borderRadius: 10,
        flexShrink:  0,
        userSelect:  'none',
        background:  peek
          ? 'linear-gradient(145deg, #fffde7, #fff8c0)'
          : 'linear-gradient(145deg, #fffef9, #ece7d5)',
        border: selected
          ? '2px solid #4ade80'
          : glow
            ? `2px solid ${G.gold}`
            : '1.5px solid rgba(0,0,0,.12)',
        boxShadow: selected
          ? '0 0 0 4px rgba(74,222,128,.25)'
          : glow
            ? `0 0 0 3px rgba(212,168,83,.28), 0 8px 24px rgba(0,0,0,.5)`
            : '0 3px 10px rgba(0,0,0,.3)',
        transform: lift
          ? 'translateY(-12px) scale(1.04)'
          : glow && !lift
            ? 'translateY(-5px)'
            : 'none',
        transition:     'all .22s cubic-bezier(.34,1.56,.64,1)',
        cursor:         onClick ? 'pointer' : 'default',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'space-between',
        padding:        w < 52 ? '3px 4px' : '5px 6px',
      }}
    >
      {/* Coin supérieur gauche */}
      <div style={{ color: col, fontSize: w < 52 ? 9 : 11, fontWeight: 700, lineHeight: 1.2, fontFamily: ff() }}>
        <div>{value}</div>
        <div style={{ opacity: .65, fontSize: w < 52 ? 8 : 9 }}>{suit}</div>
      </div>

      {/* Symbole central */}
      <div style={{ color: col, fontSize: w < 52 ? 17 : 24, textAlign: 'center', lineHeight: 1 }}>
        {suit}
      </div>

      {/* Coin inférieur droit (retourné) */}
      <div style={{ color: col, fontSize: w < 52 ? 9 : 11, fontWeight: 700, lineHeight: 1.2, textAlign: 'right', transform: 'rotate(180deg)', fontFamily: ff() }}>
        <div>{value}</div>
        <div style={{ opacity: .65, fontSize: w < 52 ? 8 : 9 }}>{suit}</div>
      </div>
    </div>
  )
}
