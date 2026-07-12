import { AnswerLetterConfig } from "@/app/lib/quiz/labeler/labeler.constants.ts";
import type { IAnswerLetterService } from "@/app/lib/quiz/labeler/labeler.interface.ts";

class AnswerLetterService implements IAnswerLetterService {
  optionLabel(index: number): string {
    if (index >= 0 && index < AnswerLetterConfig.alphaSize) {
      return String.fromCharCode(AnswerLetterConfig.baseCharCode + index);
    }
    return String(index + 1);
  }
}

export { AnswerLetterService };
