import { AppError } from './errors.js'
import { hashToken } from './ids.js'
import { asyncHandler } from './asyncHandler.js'
import { memberRepo } from '../repos/worlds.js'

/**
 * There are no accounts. The bearer token minted at create/join time IS the
 * identity - we look it up by hash, so a database dump can't be replayed.
 */
async function readMember(req) {
  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null
  if (!token) return null
  return memberRepo.findByTokenHash(hashToken(token))
}

async function attachRequiredMember(req) {
  req.member = await readMember(req)
  if (!req.member) throw new AppError('UNAUTHORIZED', 401, 'Join the world first.')
  await memberRepo.touch(req.member.id)
  return req.member
}

/** Attaches req.member when a valid token is present; never rejects. */
export const optionalMember = asyncHandler(async (req, _res, next) => {
  req.member = await readMember(req)
  next()
})

/** Requires any valid member token. */
export const requireMember = asyncHandler(async (req, _res, next) => {
  await attachRequiredMember(req)
  next()
})

/** Requires a member token belonging to the world named in the route. */
export const requireWorldMember = asyncHandler(async (req, _res, next) => {
  const member = await attachRequiredMember(req)
  if (member.worldId !== req.params.id) {
    throw new AppError('FORBIDDEN', 403, "You're not a member of this world.")
  }
  next()
})

/** Requires the host of the world named in the route. */
export const requireHost = asyncHandler(async (req, _res, next) => {
  const member = await attachRequiredMember(req)
  if (member.worldId !== req.params.id) {
    throw new AppError('FORBIDDEN', 403, "You're not a member of this world.")
  }
  if (!member.isHost) {
    throw new AppError('FORBIDDEN', 403, 'Only the host can do that.')
  }
  next()
})
