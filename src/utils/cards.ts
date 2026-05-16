/**
 * Utilitaires pour la création et la manipulation des cartes.
 * Compatible avec le mode solo (existant) ET le mode multijoueur.
 */

import type { Card, Rank, Suit } from '../types/game'

export const SUITS: Suit[]  = ['♠', '♥', '♦', '♣']
export const RANKS: Rank[]  = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const RED_SUITS      = new Set<Suit>(['♥', '♦'])

/** Valeur en points de chaque carte (règles Dutch standard) */
export const CARD_VALUES: Record<Rank, number> = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, J: 10, Q: 10, K: 10,
}
// Note : le Roi rouge vaut 0, le Roi noir 10.
// La valeur du Roi est ajustée selon la couleur dans getCardValue().

/** Retourne la valeur en points d'une carte (gère les Rois rouge/noir) */
export function getCardValue(card: Card): number {
  if (card.rank === 'K') return card.isRed ? 0 : 10
  return CARD_VALUES[card.rank]
}

/**
 * Crée un jeu de 52 cartes mélangé.
 * @param deckIndex - 0 pour le premier paquet, 1 pour le deuxième.
 *                    Permet d'avoir des IDs uniques avec 2 paquets.
 */
export function buildDeck(deckIndex = 0): Card[] {
  const deck: Card[] = []
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      const isRed = RED_SUITS.has(suit)
      deck.push({
        id:    `${rank}${suit}_${deckIndex}`,
        rank,
        suit,
        value: rank === 'K' ? (isRed ? 0 : 10) : CARD_VALUES[rank],
        isRed,
      })
    })
  })
  return shuffle(deck)
}

/** Mélange un tableau (algorithme Fisher-Yates) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Calcule le score total d'une main */
export function totalScore(cards: Card[]): number {
  return cards.reduce((total, card) => total + getCardValue(card), 0)
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
} as const
