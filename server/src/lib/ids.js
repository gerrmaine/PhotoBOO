import crypto from 'node:crypto'

export const uuid = () => crypto.randomUUID()

// Omits I, L, O, 0 and 1 - the characters people misread when typing a code
// off someone else's screen.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // 31 chars -> 31^6 ~= 887M
const SLUG_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

/** Rejection sampling keeps the distribution uniform (plain % is biased). */
function pick(alphabet, len) {
  const out = []
  while (out.length < len) {
    for (const b of crypto.randomBytes(len * 2)) {
      if (b < 256 - (256 % alphabet.length)) {
        out.push(alphabet[b % alphabet.length])
        if (out.length === len) break
      }
    }
  }
  return out.join('')
}

export const generateJoinCode = (len = 6) => pick(CODE_ALPHABET, len)

/** Public share IDs are unguessable so strips can't be enumerated. */
export const generateShareSlug = (len = 10) => pick(SLUG_ALPHABET, len)

/** Returns { token, hash }. Only the hash is ever stored. */
export function generateToken() {
  const token = crypto.randomBytes(32).toString('base64url')
  return { token, hash: hashToken(token) }
}

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')
