export function isValidCard(c) {
  if (!c || typeof c !== 'object') return false
  // common fields: id, v or rank, s or suit, p or value
  const hasId = typeof c.id === 'string' && c.id.length > 0
  const hasRank = typeof (c.v ?? c.rank) === 'string' && (c.v ?? c.rank).length > 0
  const hasSuit = typeof (c.s ?? c.suit) === 'string' && (c.s ?? c.suit).length > 0
  const hasValue = typeof (c.p ?? c.value) === 'number'
  return hasId && hasRank && hasSuit && hasValue
}

export function normalizeCard(c, fallback = {}) {
  if (!c || typeof c !== 'object') return { id: `invalid_${Date.now()}`, rank: '?', suit: '?', value: 0, v: '?', s: '?', p: 0, _invalid: true, ...fallback }
  const id = c.id ?? `${c.v ?? c.rank}${c.s ?? c.suit ?? ''}_${Date.now()}`
  const rank = c.v ?? c.rank ?? '?'
  const suit = c.s ?? c.suit ?? '?'
  const value = (c.p ?? c.value) ?? 0
  return { ...c, id, rank, suit, value, v: rank, s: suit, p: value }
}

export function assertValidCard(c, context = '') {
  if (!isValidCard(c)) {
    console.error('INVALID CARD DETECTED', context, c)
    return false
  }
  return true
}
