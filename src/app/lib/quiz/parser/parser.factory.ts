import type { ISplitQuestionService } from "@/app/lib/quiz/parser/parser.interface.ts";
import { SplitQuestionService } from "@/app/lib/quiz/parser/parser.service.ts";

const createSplitQuestion: () => ISplitQuestionService =
  (): ISplitQuestionService => new SplitQuestionService();

export { createSplitQuestion };
