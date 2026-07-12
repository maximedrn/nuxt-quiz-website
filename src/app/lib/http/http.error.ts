import type { HttpStatus } from "@/app/lib/http/http.status.ts";

/**
 * Contract every domain tagged error satisfies so the HTTP boundary can map it.
 */
interface AppError {
  readonly _tag: string;
  readonly message: string;
  readonly status: HttpStatus;
}

export type { AppError };
