import { Data } from 'effect'
import type { HttpStatus } from '@/server/lib/http/http.status'

/** Tagged error for quiz domain failures. */
export class QuizError extends Data.TaggedError('QuizError')<{
  readonly message: string
  readonly status: HttpStatus
}> {}
