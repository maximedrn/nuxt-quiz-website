/**
 * Static messages for the environment domain.
 */
const EnvMessage = {
  invalid: "Invalid environment configuration",
} as const satisfies Record<string, string>;

type EnvMessage = (typeof EnvMessage)[keyof typeof EnvMessage];

export { EnvMessage };
