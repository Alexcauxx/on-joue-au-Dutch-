import { G, ff } from '../../constants/theme.js'

/**
 * Button — Bouton réutilisable avec plusieurs variantes visuelles.
 *
 * Props :
 *  variant    'gold' | 'outline' | 'ghost' | 'dutch'  (défaut: 'outline')
 *  disabled   boolean
 *  fullWidth  boolean (défaut: true)
 *  onClick    handler
 *  style      styles supplémentaires
 */
export default function Button({
  children,
  onClick,
  variant   = 'outline',
  disabled  = false,
  fullWidth = true,
  style: extraStyle = {},
}) {
  const base = {
    fontFamily:   ff(),
    fontSize:     15,
    fontWeight:   700,
    borderRadius: 13,
    cursor:       disabled ? 'not-allowed' : 'pointer',
    opacity:      disabled ? 0.45 : 1,
    border:       'none',
    transition:   'opacity .15s',
    width:        fullWidth ? '100%' : undefined,
    letterSpacing: 0.4,
  }

  const variants = {
    gold: {
      background: `linear-gradient(135deg, ${G.gold}, ${G.goldL}, ${G.gold})`,
      color:      '#080d14',
      padding:    '15px 20px',
      boxShadow:  `0 4px 20px rgba(212,168,83,.3)`,
    },
    outline: {
      background: G.surface,
      border:     `1.5px solid ${G.border}`,
      color:      G.text,
      padding:    '15px 20px',
    },
    ghost: {
      background:   'transparent',
      color:        G.goldDim,
      padding:      '12px 20px',
      fontSize:     13,
      letterSpacing: 1,
    },
    dutch: {
      background:   'linear-gradient(135deg, #6d0000, #c0392b, #891313)',
      color:        '#fff',
      padding:      '15px 20px',
      boxShadow:    '0 4px 18px rgba(192,57,43,.35)',
      fontSize:     16,
      letterSpacing: 1.5,
    },
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...extraStyle }}
    >
      {children}
    </button>
  )
}
