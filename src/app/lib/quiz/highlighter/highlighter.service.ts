import { codeToHtml } from "shiki";
import type { IHighlightService } from "@/app/lib/quiz/highlighter/highlighter.interface.ts";
import type { HighlightConfig } from "@/app/lib/quiz/highlighter/highlighter.types.ts";

/**
 * Concrete highlight service. Delegates to Shiki's `codeToHtml`.
 *
 * Construction is done through `createHighlighter` (the factory), never
 * directly.
 */
class HighlightService implements IHighlightService {
  readonly config: HighlightConfig;

  constructor(config: HighlightConfig) {
    this.config = config;
  }

  highlight(code: string, lang?: string): Promise<string> {
    return codeToHtml(code, {
      lang: lang ?? this.config.lang,
      theme: this.config.theme,
    });
  }
}

export { HighlightService };
