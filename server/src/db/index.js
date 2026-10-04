import { createClient } from '@supabase/supabase-js'
import { config, assertSupabaseConfig } from '../config.js'

assertSupabaseConfig()

export const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Supabase errors become thrown Errors so services can stay try/catch shaped. */
export function unwrap(result, fallbackMessage = 'Database request failed.') {
  if (result.error) {
    const err = new Error(result.error.message || fallbackMessage)
    err.code = result.error.code
    err.details = result.error.details
    throw err
  }
  return result.data
}

export const isUniqueViolation = (err) =>
  err?.code === '23505' || /duplicate key|unique constraint/i.test(err?.message ?? '')

/** jsonb columns arrive as objects; leftover TEXT rows may still be strings. */
export function asJson(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}
