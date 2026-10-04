/**
 * Express 4 does not forward rejected promises to the error middleware, so every
 * async route handler must be wrapped or failures hang the request.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
