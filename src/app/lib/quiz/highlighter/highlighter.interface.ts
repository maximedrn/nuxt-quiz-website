import type { HighlightConfig } from "@/app/lib/quiz/highlighter/highlighter.types.ts";

/**
 * Public contract for the highlight service. Consumers type against this, never
 * a concrete implementation.
 */
interface IHighlightService {
  readonly config: HighlightConfig;
  /**
   * Renders `code` as syntax-highlighted HTML.
   *
   * @param {string} code - Raw source code.
   *
   * @returns {Promise<string>} Highlighted HTML.
   */
  highlight: (code: string, lang?: string) => Promise<string>;
}

export type { IHighlightService };
