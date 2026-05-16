import { G, ff } from '../../constants/theme.js'
import { totalScore } from '../../utils/cards.js'
import FaceCard from '../cards/FaceCard.jsx'
import Button from '../ui/Button.jsx'

/**
 * ScoreScreen — Affiche les résultats en fin de partie.
 *
 * Props :
 *  pHand       Card[]  — main finale du joueur
 *  oHand       Card[]  — main finale de l'adversaire
 *  dutch       string | null — qui a appelé Dutch ('player' | 'opponent' | null)
 *  playerName  string
 *  rules       object
 *  onReplay    fn — rejouer
 *  onHome      fn — retour accueil
 */
export default function ScoreScreen({ pHand, oHand, dutch, playerName, rules, onReplay, onHome }) {
  const safePHand = Array.isArray(pHand) ? pHand : []
  const safeOHand = Array.isArray(oHand) ? oHand : []
  const playerScore   = totalScore(safePHand)
  const opponentScore = totalScore(safeOHand)
  const playerWins    = playerScore <= opponentScore

  // Pénalité : le joueur a appelé Dutch mais n'a pas le meilleur score
  const dutchPenalty = rules.penalty && dutch === 'player' && !playerWins

  return (
    <div
      className="animate-fade-in"
      style={{
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        background:    `radial-gradient(ellipse at 50% 0%, #0a2016, ${G.bg})`,
        padding:       '28px 22px',
        overflowY:     'auto',
      }}
    >
      {/* Titre */}
      <h2
        style={{
          fontFamily:    ff(true),
          color:         G.text,
          fontSize:      26,
          fontWeight:    700,
          textAlign:    'center',
          letterSpacing: 4,
          marginBottom:  10,
        }}
      >
        RÉSULTATS
      </h2>

      {/* Badge Dutch */}
      {dutch && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span
            style={{
              background:    'rgba(212,168,83,.1)',
              border:       `1px solid rgba(212,168,83,.22)`,
              borderRadius:  20,
              padding:      '5px 16px',
              color:         G.goldDim,
              fontSize:      11,
              fontFamily:    ff(),
              letterSpacing: 1,
            }}
          >
            {dutch === 'player' ? `${playerName} a` : "L'adversaire a"} appelé Dutch
            {dutchPenalty ? ' — Pénalité +5 !' : ''}
          </span>
        </div>
      )}

      {/* Bannière gagnant */}
      <div
        style={{
          borderRadius: 16,
          padding:     '18px',
          textAlign:   'center',
          marginBottom: 18,
          background:   playerWins
            ? 'linear-gradient(135deg, rgba(91,201,123,.1), rgba(91,201,123,.03))'
            : 'linear-gradient(135deg, rgba(224,96,96,.1), rgba(224,96,96,.03))',
          border: `1px solid ${playerWins ? 'rgba(91,201,123,.22)' : 'rgba(224,96,96,.22)'}`,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 6 }}>{playerWins ? '🏆' : '😔'}</div>
        <div
          style={{
            fontFamily: ff(true),
            color:      playerWins ? G.ok : G.err,
            fontSize:   22,
            fontWeight: 700,
          }}
        >
          {playerWins ? `${playerName} gagne !` : "L'adversaire gagne"}
        </div>
        <div style={{ color: G.dim, fontSize: 13, fontFamily: ff(), marginTop: 4 }}>
          {playerScore} pts vs {opponentScore} pts
        </div>
      </div>

      {/* Comparaison des mains */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {[
          { label: playerName,   hand: safePHand, score: playerScore,   wins: playerWins  },
          { label: 'Adversaire', hand: safeOHand, score: opponentScore, wins: !playerWins },
        ].map(({ label, hand, score, wins }) => (
          <div
            key={label}
            style={{
              flex:         1,
              borderRadius: 14,
              padding:     '14px',
              background:   G.surface,
              border:      `1px solid ${wins ? 'rgba(91,201,123,.2)' : G.border}`,
            }}
          >
            <div
              style={{
                color:         wins ? G.ok : G.dim,
                fontSize:      10,
                letterSpacing: 1.5,
                fontFamily:    ff(),
                fontWeight:    600,
                marginBottom:  10,
              }}
            >
              {label.toUpperCase()}
            </div>

            {/* Cartes avec leur score */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 10 }}>
              {(hand || []).map((card, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <FaceCard card={card} w={42} h={60} />
                  <div style={{ textAlign: 'center', color: G.dim, fontSize: 9, fontFamily: ff() }}>
                    {(card?.p ?? 0)}pt
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                textAlign:  'center',
                fontFamily: ff(true),
                color:      wins ? G.ok : G.text,
                fontSize:   24,
                fontWeight: 700,
              }}
            >
              {score} pts
            </div>
          </div>
        ))}
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button variant="gold"    onClick={onReplay}>Rejouer</Button>
        <Button variant="outline" onClick={onHome}>Accueil</Button>
      </div>
    </div>
  )
}
