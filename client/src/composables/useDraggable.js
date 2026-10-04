import { ref } from 'vue'
import { toNormalized } from '@/lib/geometry.js'

/**
 * Pointer dragging that reports normalised (0..1) positions.
 *
 * Pointer events rather than mouse + touch pairs: one code path covers mouse,
 * trackpad, pen and touch, and pointer capture means a fast drag that leaves the
 * element does not strand the sticker mid-move.
 */
export function useDraggable(getContainerRect, { onMove, onStart, onEnd } = {}) {
  const dragging = ref(null)
  let offset = { x: 0, y: 0 }

  function begin(event, item) {
    event.preventDefault()
    event.target.setPointerCapture?.(event.pointerId)

    const point = toNormalized(event.clientX, event.clientY, getContainerRect())
    offset = { x: item.x - point.x, y: item.y - point.y }
    dragging.value = item.id
    onStart?.(item)

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  function move(event) {
    if (!dragging.value) return
    const point = toNormalized(event.clientX, event.clientY, getContainerRect())
    onMove?.(dragging.value, {
      x: Math.min(1, Math.max(0, point.x + offset.x)),
      y: Math.min(1, Math.max(0, point.y + offset.y)),
    })
  }

  function end() {
    if (dragging.value) onEnd?.(dragging.value)
    dragging.value = null
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
    window.removeEventListener('pointercancel', end)
  }

  return { dragging, begin }
}
