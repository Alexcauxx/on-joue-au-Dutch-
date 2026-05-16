import { G, ff } from '../../constants/theme.js'

/**
 * StatusBar — Barre de statut simulée style iPhone.
 * Affiche l'heure (fixe), les barres de signal, Wi-Fi et batterie.
 */
export default function StatusBar() {
  return (
    <div
      style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        padding:        '14px 28px 0',
        height:          44,
        flexShrink:      0,
        position:       'relative',
      }}
    >
      {/* Heure */}
      <span style={{ color: G.text, fontSize: 12, fontWeight: 700, fontFamily: ff(), zIndex: 1 }}>
        9:41
      </span>

      {/* Dynamic Island (encoche centrale) */}
      <div
        style={{
          width:        116,
          height:       28,
          borderRadius: 20,
          background:  '#000',
          position:    'absolute',
          left:        '50%',
          transform:   'translateX(-50%)',
        }}
      />

      {/* Icônes à droite */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', zIndex: 1 }}>
        {/* Barres réseau */}
        <svg width="16" height="12" viewBox="0 0 16 12">
          <rect x="0"   y="5" width="3" height="7" fill={G.text} rx="1" />
          <rect x="4.5" y="3" width="3" height="9" fill={G.text} rx="1" />
          <rect x="9"   y="1" width="3" height="11" fill={G.text} rx="1" />
        </svg>

        {/* Wi-Fi */}
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path d="M8 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill={G.text} />
          <path d="M4.5 7C5.6 5.8 6.7 5.2 8 5.2s2.4.6 3.5 1.8" stroke={G.text} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M1.5 4.5C3.2 2.6 5.4 1.5 8 1.5s4.8 1.1 6.5 3" stroke={G.text} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>

        {/* Batterie */}
        <div
          style={{
            width:        23,
            height:       11,
            borderRadius: 3,
            border:       `1.5px solid ${G.text}`,
            position:    'relative',
            display:     'flex',
            alignItems:  'center',
            padding:     '0 2px',
          }}
        >
          <div style={{ width: '75%', height: 7, borderRadius: 1.5, background: G.ok }} />
          {/* Petit bout de la batterie */}
          <div
            style={{
              width:        2.5,
              height:       5,
              background:   G.text,
              borderRadius: 1,
              position:    'absolute',
              right:        -3.5,
            }}
          />
        </div>
      </div>
    </div>
  )
}
