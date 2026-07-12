/**
 * Default Shiki config applied when no explicit config is provided.
 */
const HighlightDefaults = {
  lang: "plaintext",
  theme: "one-dark-pro",
} as const satisfies Record<string, string>;

export { HighlightDefaults };
