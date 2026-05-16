/**
 * Types TypeScript pour le jeu Dutch.
 * Ces interfaces décrivent la forme exacte des données
 * stockées dans Supabase et utilisées dans l'interface.
 */

// ── Cartes ──────────────────────────────────────────────────────

export type Suit = '♠' | '♥' | '♦' | '♣'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  id:    string   // identifiant unique, ex: "A♠_0" (rang + couleur + indice paquet)
  rank:  Rank     // la valeur: 'A', '2', ..., 'K'
  suit:  Suit     // la couleur: '♠', '♥', '♦', '♣'
  value: number   // points en fin de manche
  isRed: boolean  // true si ♥ ou ♦
}

// ── Joueurs ──────────────────────────────────────────────────────

/** Enregistrement d'un joueur tel que stocké dans Supabase */
export interface PlayerRecord {
  id:           string
  game_id:      string
  name:         string
  is_host:      boolean
  is_connected: boolean
  turn_order:   number | null
  session_key:  string | null
  created_at:   string
}

// ── Partie ───────────────────────────────────────────────────────

export type GameStatus = 'waiting' | 'playing' | 'finished'

/**
 * Phase de jeu courante.
 * Chaque phase détermine quelles actions sont disponibles.
 */
export type GamePhase =
  | 'peek'        // début : les joueurs regardent 2 de leurs cartes
  | 'draw'        // le joueur courant doit piocher ou prendre la défausse
  | 'hold'        // le joueur tient une carte, doit l'échanger ou la défausser
  | 'dutch_last'  // Dutch annoncé, les autres joueurs ont un dernier tour
  | 'end'         // fin de manche

/** Main d'un joueur (stockée dans game_state.hands) */
export interface PlayerHand {
  cards:        Card[]   // les cartes du joueur
  peeksUsed:    number   // nombre d'espionnages utilisés au départ
  peekedIndices?: number[] // index des cartes déjà espionnées au début
}

export interface SpecialAction {
  type: 'queen' | 'jack'
  actorId: string
  expiresAt: number
  effectId: string
  turn: number
  firstSelection?: {
    owner: 'opponent' | 'player'
    index: number
  } | null
}

/**
 * État complet du jeu.
 * Stocké comme champ JSONB dans la table games.
 * ATTENTION : contient les cartes de TOUS les joueurs.
 * Le client masque les cartes des adversaires à l'affichage.
 */
export interface GameState {
  deck:               Card[]                    // cartes restantes dans la pioche
  discardPile:        Card[]                    // défausse (la dernière est visible)
  hands:              Record<string, PlayerHand> // mains indexées par player ID
  specialAction?:     SpecialAction | null
  playerOrder:        string[]                  // IDs des joueurs dans l'ordre de jeu
  currentPlayerIndex: number                    // index du joueur dont c'est le tour
  phase:              GamePhase
  held:               Card | null               // carte actuellement tenue
  heldFrom:           'deck' | 'discard' | null // d'où vient la carte tenue
  dutchCallerId:      string | null             // qui a annoncé Dutch ?
  lastTurnPlayerIds:  string[]                  // joueurs qui ont encore un dernier tour
  peeksDone:          Record<string, number>    // espionnages par joueur
  selected?:          number[]                  // cartes sélectionnées pour la défausse
  queenSwapTarget?:   number | null             // index de la carte adverse ciblée par la Dame
  jackPeekUsed?:      boolean                   // Valet utilisé pour espionner
  msg?:               string                    // message affiché à l'écran
  turn:               number                    // compteur de tours
}

/** Paramètres de la partie (stockés dans games.settings) */
export interface GameSettings {
  cardsPerPlayer:       4 | 6
  numDecks:             1 | 2
  maxPlayers:           number
  specialCards:         boolean  // activer les effets des cartes spéciales
  queenEffect:          boolean  // Dame = échanger 2 cartes
  jackEffect:           boolean  // Valet = regarder une de ses cartes
  aceEffect:            boolean  // As = donner une carte de la pioche
  matchCards:           boolean  // cartes identiques jouables hors tour
  matchTimeout:         number   // secondes pour jouer une carte identique (0 = désactivé)
  penalties:            boolean  // activer les pénalités
  penaltyCards:         number   // nombre de cartes de pénalité
  dutchEnabled:         boolean  // autoriser l'annonce Dutch
  dutchLastTurnForAll:  boolean  // Dutch = dernier tour pour tous les autres
}

/** Enregistrement d'une partie tel que stocké dans Supabase */
export interface GameRecord {
  id:          string
  code:        string
  status:      GameStatus
  host_id:     string | null
  settings:    GameSettings
  game_state:  GameState | null
  created_at:  string
  updated_at:  string
}

// ── Contexte de navigation ────────────────────────────────────────

/**
 * Données du joueur courant, passées entre les écrans.
 * Stockées dans React state au niveau de App.jsx.
 */
export interface PlayerContext {
  gameId:     string
  playerId:   string
  playerName: string
  isHost:     boolean
  gameCode:   string
}
