import type { HttpStatus } from '@/server/lib/http/http.status'

/** Contract every domain tagged error satisfies so the HTTP boundary can map it. */
export interface AppError {
  readonly _tag: string
  readonly message: string
  readonly status: HttpStatus
}
