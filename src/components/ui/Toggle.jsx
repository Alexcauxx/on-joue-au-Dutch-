import { G } from '../../constants/theme'

/**
 * Toggle — Interrupteur ON/OFF (switch iOS-style).
 *
 * Props :
 *  on       boolean — état actuel
 *  onToggle function — appelé au clic
 */
export default function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width:      44,
        height:     24,
        borderRadius: 12,
        cursor:     'pointer',
        background: on ? G.gold : 'rgba(255,255,255,.1)',
        position:   'relative',
        transition: 'background .2s',
        flexShrink:  0,
      }}
    >
      <div
        style={{
          position:     'absolute',
          top:           3,
          width:         18,
          height:        18,
          borderRadius:  9,
          background:   '#fff',
          boxShadow:    '0 1px 4px rgba(0,0,0,.3)',
          left:          on ? 23 : 3,
          transition:   'left .2s',
        }}
      />
    </div>
  )
}
