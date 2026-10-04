import { session, stripTokens } from '@/api/client.js'

/**
 * A strip can be edited or deleted by its author, by the host of the world it
 * lives in, or by whoever still holds the one-time edit token minted at create.
 */
export function canManageStrip(strip, { isHost = false, worldId = null } = {}) {
  if (!strip) return false
  if (stripTokens.get(strip.id)) return true
  if (session.memberId && strip.memberId === session.memberId) return true
  if (isHost && worldId && strip.worldId === worldId) return true
  return false
}
