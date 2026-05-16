/** Les 4 couleurs d'un jeu standard */
export const SUITS = ['♠', '♥', '♦', '♣']

/** Les 13 valeurs d'une couleur */
export const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

/** Points de chaque carte (règles Dutch standard) */
export const PTS = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: null, // Pour les rois, utiliser KING_POINTS selon la couleur
}

/** Points des rois selon la couleur (rouges=0, noirs=10) */
export const KING_POINTS = {
  '♥': 0, // Roi de cœur (rouge) = 0 point
  '♦': 0, // Roi de carreau (rouge) = 0 point
  '♠': 10, // Roi de pique (noir) = 10 points
  '♣': 10, // Roi de trèfle (noir) = 10 points
}

/** Couleurs qui s'affichent en rouge */
export const RED_SUITS = new Set(['♥', '♦'])

/** Règles par défaut */
export const DEFAULT_RULES = {
  kingZero:    true,   // Le Roi rouge vaut 0 point, le Roi noir vaut 10
  queenSwap:   true,   // La Dame permet d'échanger avec l'adversaire
  jackPeek:    true,   // Le Valet permet d'espionner une carte
  discardMatch: true,  // Autorise la validation de cartes similaires à la défausse
  penalty:     true,   // Pénalité activée si la défausse sélectionnée est incorrecte
}

/** Seuils de difficulté pour l'IA (score max pour appeler Dutch) */
export const DIFF_THRESHOLD = {
  facile:  5,
  normal:  8,
  expert: 13,
}
