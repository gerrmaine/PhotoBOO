import { onMounted, onUnmounted, ref } from 'vue'

const BASE_DELAY = 2500
const MAX_IDLE_DELAY = 15000
const MAX_ERROR_DELAY = 30000

/**
 * Revision-cursor poller.
 *
 * A plain setInterval re-fetches and re-renders the whole member list forever,
 * even in a lobby where nothing is happening. This asks "anything newer than
 * revision N?", backs off while the answer stays no, and stops entirely while
 * the tab is hidden.
 */
export function usePolling(fetcher, { onUpdate, immediate = true } = {}) {
  const active = ref(false)
  const lastError = ref(null)
  let delay = BASE_DELAY
  let timer = null
  let stopped = false

  async function tick() {
    if (stopped || document.hidden) return
    active.value = true
    try {
      const changed = await fetcher()
      lastError.value = null
      if (changed) {
        delay = BASE_DELAY // something happened - stay responsive
        onUpdate?.()
      } else {
        delay = Math.min(delay * 1.5, MAX_IDLE_DELAY) // quiet lobby - save battery
      }
    } catch (err) {
      lastError.value = err
      delay = Math.min(delay * 2, MAX_ERROR_DELAY)
    } finally {
      active.value = false
      if (!stopped) timer = setTimeout(tick, delay)
    }
  }

  function restartSoon(ms = 400) {
    clearTimeout(timer)
    delay = BASE_DELAY
    timer = setTimeout(tick, ms)
  }

  const onVisibility = () => {
    if (document.hidden) clearTimeout(timer)
    else restartSoon(0) // snap back the instant the user returns
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibility)
    if (immediate) tick()
  })

  onUnmounted(() => {
    stopped = true
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisibility)
  })

  return { active, lastError, restartSoon }
}
