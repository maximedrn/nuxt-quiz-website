import { createAnswerLetter } from "@/app/lib/quiz/labeler/labeler.factory.ts";
import type { IAnswerLetterService } from "@/app/lib/quiz/labeler/labeler.interface.ts";

let _answerLetter: IAnswerLetterService | undefined;

const useAnswerLetter: () => IAnswerLetterService =
  (): IAnswerLetterService => {
    if (!_answerLetter) {
      _answerLetter = createAnswerLetter();
    }
    return _answerLetter;
  };

export { useAnswerLetter };
