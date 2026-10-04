/** Every error the API returns has the same shape, so the client needs one handler. */
export class AppError extends Error {
  constructor(code, status = 400, message = code, details = null) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
  }
}

export const notFound = (what = 'Resource') => new AppError('NOT_FOUND', 404, `${what} not found.`)

/** Express error middleware. Must be registered last. */
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    })
  }

  // zod
  if (err?.name === 'ZodError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Some fields were invalid.',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    })
  }

  // multer
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: { code: 'FILE_TOO_LARGE', message: 'That image is too large.', details: null },
    })
  }

  console.error('[unhandled]', err)
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our end.', details: null },
  })
}
