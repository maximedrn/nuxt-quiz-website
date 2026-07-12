/**
 * HTTP status codes used across the API.
 */
const HttpMessage = {
  badRequest: "Bad Request",
  conflict: "Conflict",
  internal: "Internal Server Error",
  notFound: "Not Found",
  ok: "OK",
  tooManyRequests: "Too Many Requests",
  unauthorized: "Unauthorized",
} as const satisfies Record<string, string>;

type HttpMessage = (typeof HttpMessage)[keyof typeof HttpMessage];

export { HttpMessage };
