import { HighlightDefaults } from "@/app/lib/quiz/highlighter/highlighter.constants.ts";
import type { IHighlightService } from "@/app/lib/quiz/highlighter/highlighter.interface.ts";
import { HighlightService } from "@/app/lib/quiz/highlighter/highlighter.service.ts";
import type { HighlightConfig } from "@/app/lib/quiz/highlighter/highlighter.types.ts";

/**
 * Builds a highlight service for the given config.
 *
 * @param {HighlightConfig} config - Language and theme. Defaults to Solidity +
 *   one-dark-pro.
 *
 * @returns {IHighlightService} The highlight service.
 */
const createHighlighter: (config?: HighlightConfig) => IHighlightService = (
  config: HighlightConfig = HighlightDefaults,
): IHighlightService => new HighlightService(config);

export { createHighlighter };
