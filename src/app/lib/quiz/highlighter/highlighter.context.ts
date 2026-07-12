import { createHighlighter } from "@/app/lib/quiz/highlighter/highlighter.factory.ts";
import type { IHighlightService } from "@/app/lib/quiz/highlighter/highlighter.interface.ts";

let _highlighter: IHighlightService | undefined;

/**
 * Lazily-built, process-wide highlight service.
 *
 * @returns {IHighlightService} The highlight service.
 */
const useHighlight: () => IHighlightService = (): IHighlightService => {
  if (!_highlighter) {
    _highlighter = createHighlighter();
  }
  return _highlighter;
};

export { useHighlight };
