import { ref, onUnmounted } from 'vue'
import { CAPTURE_CONSTRAINTS } from '@/lib/layout.js'

/**
 * Webcam lifecycle.
 *
 * Permission denial is treated as a first-class state rather than an error,
 * because it is the single most common thing that happens to real users.
 */
export function useCamera() {
  const status = ref('idle') // idle | starting | ready | denied | missing | insecure | error
  const message = ref('')
  const videoRef = ref(null)
  let stream = null

  async function start() {
    if (status.value === 'ready') return

    // getUserMedia simply does not exist on insecure origins, which is a
    // confusing failure unless it is named explicitly.
    if (!navigator.mediaDevices?.getUserMedia) {
      status.value = 'insecure'
      message.value = window.isSecureContext
        ? 'This browser does not support camera capture.'
        : 'Cameras only work over HTTPS or on localhost.'
      return
    }

    status.value = 'starting'
    try {
      stream = await navigator.mediaDevices.getUserMedia(CAPTURE_CONSTRAINTS)
      if (videoRef.value) {
        videoRef.value.srcObject = stream
        await videoRef.value.play()
      }
      status.value = 'ready'
    } catch (err) {
      stop()
      switch (err.name) {
        case 'NotAllowedError':
        case 'SecurityError':
          status.value = 'denied'
          message.value = 'Camera access was blocked. Allow it in your browser, then try again.'
          break
        case 'NotFoundError':
        case 'OverconstrainedError':
          status.value = 'missing'
          message.value = 'No camera was found on this device.'
          break
        case 'NotReadableError':
          status.value = 'error'
          message.value = 'Another app is using the camera. Close it and try again.'
          break
        default:
          status.value = 'error'
          message.value = err.message || 'The camera could not be started.'
      }
    }
  }

  function stop() {
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    if (videoRef.value) videoRef.value.srcObject = null
    if (status.value === 'ready') status.value = 'idle'
  }

  // Without this the webcam indicator light stays on after navigating away.
  onUnmounted(stop)

  return { status, message, videoRef, start, stop }
}
