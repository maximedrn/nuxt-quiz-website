/**
 * HTTP status codes used across the API.
 */
const HttpStatus = {
  badRequest: 400,
  conflict: 409,
  internal: 500,
  notFound: 404,
  ok: 200,
  tooManyRequests: 429,
  unauthorized: 401,
} as const satisfies Record<string, number>;

type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];

export { HttpStatus };
