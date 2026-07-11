import { Data, Effect } from 'effect'
import { describe, expect, it, vi } from 'vitest'
import { HttpStatus } from '@/server/lib/http/http.status'
import { runOrThrow } from '@/server/lib/http/http.run'

class SampleError extends Data.TaggedError('SampleError')<{
  readonly message: string
  readonly status: HttpStatus
}> {}

// Mock createError (Nitro global only available in server context)
vi.stubGlobal('createError', (config: { statusCode: number; statusMessage: string }) => {
  const error = new Error(config.statusMessage)
  Object.assign(error, config)
  throw error
})

describe('runOrThrow', () => {
  /** A succeeding effect resolves to its value — the happy path handlers rely on. */
  it('Resolves the success value.', async () => {
    const value = await runOrThrow(Effect.succeed(42))
    expect(value).toBe(42)
  })

  /** A failing tagged error becomes an H3 error carrying its status + message. */
  it('Throws an H3 error with the tagged error status.', async () => {
    const effect = Effect.fail(new SampleError({ message: 'nope', status: HttpStatus.NOT_FOUND }))
    await expect(runOrThrow(effect)).rejects.toMatchObject({ statusCode: 404, statusMessage: 'nope' })
  })
})
