import { createSplitQuestion } from "@/app/lib/quiz/parser/parser.factory.ts";
import type { ISplitQuestionService } from "@/app/lib/quiz/parser/parser.interface.ts";

let _splitQuestion: ISplitQuestionService | undefined;

const useSplitQuestion: () => ISplitQuestionService =
  (): ISplitQuestionService => {
    if (!_splitQuestion) {
      _splitQuestion = createSplitQuestion();
    }
    return _splitQuestion;
  };

export { useSplitQuestion };
