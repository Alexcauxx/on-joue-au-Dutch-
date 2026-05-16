import { G } from '../../constants/theme.js'

/**
 * BackCard — Carte retournée (cachée), face arrière.
 *
 * Props :
 *  w / h     — dimensions en px (défaut 62×90)
 *  glow      — surbrillance dorée (ex : carte cliquable)
 *  dim       — opacité réduite (ex : ce n'est pas ton tour)
 *  onClick   — handler de clic
 */
export default function BackCard({ w = 62, h = 90, glow, dim, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width:        w,
        height:       h,
        borderRadius: 10,
        flexShrink:   0,
        background:   `linear-gradient(145deg, ${G.navy}, ${G.navyL}, ${G.navy})`,
        border: glow
          ? `2px solid ${G.gold}`
          : '1.5px solid rgba(212,168,83,.25)',
        boxShadow: glow
          ? `0 0 0 3px rgba(212,168,83,.28), 0 6px 20px rgba(0,0,0,.5)`
          : '0 3px 10px rgba(0,0,0,.35)',
        opacity:   dim ? 0.38 : 1,
        cursor:    onClick ? 'pointer' : 'default',
        position:  'relative',
        overflow:  'hidden',
        transition: 'all .15s ease',
      }}
    >
      {/* Motif losange répétitif */}
      <div
        style={{
          position:        'absolute',
          inset:            5,
          borderRadius:     6,
          border:          '1px solid rgba(212,168,83,.28)',
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(212,168,83,.06) 4px, rgba(212,168,83,.06) 5px)',
        }}
      />

      {/* Symbole central */}
      <div
        style={{
          position:       'absolute',
          inset:           0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:        18,
          color:          'rgba(212,168,83,.45)',
        }}
      >
        ♦
      </div>
    </div>
  )
}
