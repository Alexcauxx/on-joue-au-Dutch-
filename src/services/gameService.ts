/**
 * gameService.ts — Opérations Supabase pour le jeu Dutch.
 *
 * startGame corrigé :
 * - Deck construit INLINE (pas d'import externe qui peut échouer)
 * - UN SEUL appel Supabase sans .select() ni .single()
 * - Logs complets à chaque étape
 * - Retourne le gameState local (pas besoin de re-fetcher)
 */

import { supabase } from '../lib/supabase'
import type { GameRecord, PlayerRecord, GameState, GameSettings } from '../types/game'
import { normalizeCard } from '../utils/cardUtils'

// ── Session locale ────────────────────────────────────────────────
export function getSessionKey(): string {
  const KEY = 'dutch_session'
  let key = localStorage.getItem(KEY)
  if (!key) { key = crypto.randomUUID(); localStorage.setItem(KEY, key) }
  return key
}

// ── Code de partie ────────────────────────────────────────────────
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ── Mélange Fisher-Yates (inline, pas d'import) ───────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Construction du deck (inline, pas d'import) ───────────────────
function buildDeckInline(deckIndex: number) {
  const SUITS  = ['♠', '♥', '♦', '♣'] as const
  const RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'] as const
  const VALUES: Record<string, number> = {
    A:1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:10,Q:10,K:10
  }
  const cards: any[] = []
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      const isRed = suit === '♥' || suit === '♦'
      const points = rank === 'K' ? (isRed ? 0 : 10) : VALUES[rank]
      cards.push({
        id:    `${rank}${suit}_${deckIndex}`,
        rank,
        suit,
        value: points,
        isRed,
        s: suit,
        v: rank,
        p: points,
      })
    })
  })
  return cards
}

// ── CRÉER UNE PARTIE ──────────────────────────────────────────────
export async function createGame(
  playerName: string,
  settings: Partial<GameSettings> = {}
): Promise<{ game: GameRecord; player: PlayerRecord }> {
  const sessionKey = getSessionKey()
  const finalSettings = {
    cardsPerPlayer: 4, numDecks: 2, maxPlayers: 10,
    specialCards: true, queenEffect: true, jackEffect: true, aceEffect: true,
    matchCards: true, matchTimeout: 5, penalties: true, penaltyCards: 1,
    dutchEnabled: true, dutchLastTurnForAll: true,
    ...settings
  }

  let code = generateCode()
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase.from('games').select('code').eq('code', code).maybeSingle()
    if (!data) break
    code = generateCode()
  }

  const { data: game, error: gameErr } = await supabase
    .from('games').insert({ code, settings: finalSettings, status: 'waiting' }).select().single()
  if (gameErr || !game) throw new Error(`Impossible de créer la partie : ${gameErr?.message}`)

  const { data: player, error: playerErr } = await supabase
    .from('players').insert({ game_id: game.id, name: playerName.trim(), is_host: true, turn_order: 0, session_key: sessionKey }).select().single()
  if (playerErr || !player) throw new Error(`Impossible de créer le joueur : ${playerErr?.message}`)

  await supabase.from('games').update({ host_id: player.id }).eq('id', game.id)
  return { game: { ...game, host_id: player.id }, player }
}

// ── REJOINDRE UNE PARTIE ──────────────────────────────────────────
export async function joinGame(
  code: string,
  playerName: string
): Promise<{ game: GameRecord; player: PlayerRecord }> {
  const sessionKey = getSessionKey()

  const { data: game, error } = await supabase
    .from('games').select('*').eq('code', code.toUpperCase().trim()).single()
  if (error || !game) throw new Error('Partie introuvable. Vérifie le code.')
  if (game.status === 'finished') throw new Error('Cette partie est terminée.')

  const { data: existing } = await supabase
    .from('players').select('*').eq('game_id', game.id).eq('session_key', sessionKey).maybeSingle()
  if (existing) {
    await supabase.from('players').update({ is_connected: true }).eq('id', existing.id)
    return { game, player: existing }
  }

  if (game.status === 'playing') throw new Error('La partie a déjà commencé.')

  const { count } = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('game_id', game.id)
  if ((count ?? 0) >= (game.settings?.maxPlayers ?? 10)) throw new Error('La partie est complète.')

  const { data: player, error: pe } = await supabase
    .from('players').insert({ game_id: game.id, name: playerName.trim(), is_host: false, session_key: sessionKey }).select().single()
  if (pe || !player) throw new Error(`Impossible de rejoindre : ${pe?.message}`)

  return { game, player }
}

// ── LANCER LA PARTIE ──────────────────────────────────────────────
export async function startGame(
  gameId:   string,
  players:  PlayerRecord[],
  settings: any   // 'any' pour éviter les erreurs de types au runtime
): Promise<GameState> {
  console.log('[GAME] START GAME CLICKED')

  if (!gameId) throw new Error('gameId manquant')
  if (players.length < 2) throw new Error('Il faut au moins 2 joueurs.')

  console.log('[GAME] PLAYERS LOADED', players.map(p => p.name))

  // Valeurs avec fallback garanti
  const cardsPerPlayer = Number(settings?.cardsPerPlayer) > 0 ? Number(settings.cardsPerPlayer) : 4
  const numDecks       = Number(settings?.numDecks)       > 0 ? Number(settings.numDecks)       : 2

  // Construire le deck INLINE (pas d'import externe)
  let deck = buildDeckInline(0)
  if (numDecks === 2) deck = [...deck, ...buildDeckInline(1)]
  deck = shuffle(deck)

  // Mélanger les joueurs
  const orderedPlayers = shuffle([...players])
  const playerOrder    = orderedPlayers.map(p => p.id)

  // Distribuer les cartes
  const hands: GameState['hands'] = {}
  orderedPlayers.forEach(p => {
    hands[p.id] = { cards: deck.splice(0, cardsPerPlayer).map(c => normalizeCard(c)), peeksUsed: 0, peekedIndices: [] }
  })

  // Première carte de la défausse
  const discardPile = deck.splice(0, 1).map(c => normalizeCard(c))

  const gameState: GameState = {
    deck,
    discardPile,
    hands,
    playerOrder,
    currentPlayerIndex: 0,
    phase:              'peek',
    held:               null,
    heldFrom:           null,
    dutchCallerId:      null,
    lastTurnPlayerIds:  [],
    peeksDone:          Object.fromEntries(orderedPlayers.map(p => [p.id, 0])),
    selected:           [],
    queenSwapTarget:    null,
    jackPeekUsed:       false,
    specialAction:      null,
    msg:                'Espionnez 2 de vos cartes 👀',
    turn:               1,
  }

  console.log('[GAME] INITIAL GAME STATE CREATED', {
    deckSize:    deck.length,
    playerCount: orderedPlayers.length,
    cardsPerPlayer,
    numDecks,
    gameId,
  })

  // ── UN SEUL appel Supabase ─────────────────────────────────────
  console.log('[GAME] SUPABASE UPDATE START', { gameId })

  const { error } = await supabase
    .from('games')
    .update({ status: 'playing', game_state: gameState })
    .eq('id', gameId)

  if (error) {
    console.error('[GAME] SUPABASE UPDATE ERROR', {
      message: error.message,
      code:    error.code,
      details: error.details,
      hint:    error.hint,
    })
    throw new Error(`Supabase a refusé la mise à jour : ${error.message}`)
  }

  console.log('[GAME] SUPABASE UPDATE SUCCESS')

  // On retourne le gameState qu'on vient de construire
  // (pas besoin de re-fetcher depuis Supabase)
  return gameState
}

// ── METTRE À JOUR L'ÉTAT DU JEU ───────────────────────────────────
export async function updateGameState(gameId: string, newState: GameState): Promise<void> {
  const { error } = await supabase.from('games').update({ game_state: newState }).eq('id', gameId)
  if (error) throw new Error(`Erreur de synchronisation : ${error.message}`)
}

// ── ABONNEMENTS REALTIME ───────────────────────────────────────────
export function subscribeToGame(
  gameId:          string,
  onGameChange:    (game: GameRecord)       => void,
  onPlayersChange: (players: PlayerRecord[]) => void
): () => void {
  const channel = supabase
    .channel(`game_room_${gameId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
      payload => {
        if (payload.new) {
          console.log('[GAME] GAME STATUS CHANGED TO', (payload.new as any).status)
          onGameChange(payload.new as GameRecord)
        }
      }
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` },
      async () => {
        const { data } = await supabase.from('players').select('*').eq('game_id', gameId).order('created_at', { ascending: true })
        if (data) onPlayersChange(data)
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ── REQUÊTES SIMPLES ───────────────────────────────────────────────
export async function getGame(gameId: string): Promise<GameRecord | null> {
  const { data } = await supabase.from('games').select('*').eq('id', gameId).single()
  return data
}

export async function getPlayers(gameId: string): Promise<PlayerRecord[]> {
  const { data } = await supabase.from('players').select('*').eq('game_id', gameId).order('created_at', { ascending: true })
  return data ?? []
}

export async function markDisconnected(playerId: string): Promise<void> {
  await supabase.from('players').update({ is_connected: false }).eq('id', playerId)
}
