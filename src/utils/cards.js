import { SUITS, VALUES, PTS, KING_POINTS } from '../constants/game'

/**
 * Construit un jeu de 52 cartes mélangé.
 * Chaque carte est un objet : { s: couleur, v: valeur, p: points }
 *
 * @param {boolean} kingZero - si la règle kingZero est activée (rois rouges 0, noirs 10)
 */
export function buildDeck(kingZero = false) {
  const deck = []
  SUITS.forEach(s => VALUES.forEach(v => {
    const point = v === 'K'
      ? (kingZero ? KING_POINTS[s] : 0)
      : PTS[v]
    deck.push({ s, v, p: point })
  }))
  return shuffle(deck)
}

/**
 * Mélange un tableau (algorithme Fisher-Yates).
 * Ne modifie pas le tableau original — retourne une copie mélangée.
 */
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Calcule le score total d'une main (tableau de cartes).
 * Exemple : [{p:1}, {p:7}, {p:0}, {p:3}] → 11
 */
export function totalScore(hand = []) {
  return hand.reduce((total, card) => total + (card?.p ?? 0), 0)
}

/** Paramètres par défaut d'une partie */
export const DEFAULT_SETTINGS = {
  cardsPerPlayer:      4,
  numDecks:            2,
  maxPlayers:          10,
  specialCards:        true,
  queenEffect:         true,
  jackEffect:          true,
  aceEffect:           true,
  matchCards:          true,
  matchTimeout:        5,
  penalties:           true,
  penaltyCards:        1,
  dutchEnabled:        true,
  dutchLastTurnForAll: true,
}
