import { SplitQuestionConfig } from "@/app/lib/quiz/parser/parser.constants.ts";
import type { ISplitQuestionService } from "@/app/lib/quiz/parser/parser.interface.ts";
import type { QuestionParts } from "@/app/lib/quiz/parser/parser.types.ts";

class SplitQuestionService implements ISplitQuestionService {
  parse(question: string): QuestionParts {
    const index: number = question.indexOf(SplitQuestionConfig.marker);
    if (index === -1) {
      return { after: "", before: question };
    }
    return {
      after: question.slice(index + SplitQuestionConfig.marker.length).trim(),
      before: question.slice(0, index).trim(),
    };
  }
}

export { SplitQuestionService };
