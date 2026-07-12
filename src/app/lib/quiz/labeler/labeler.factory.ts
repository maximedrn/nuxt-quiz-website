import type { IAnswerLetterService } from "@/app/lib/quiz/labeler/labeler.interface.ts";
import { AnswerLetterService } from "@/app/lib/quiz/labeler/labeler.service.ts";

const createAnswerLetter: () => IAnswerLetterService =
  (): IAnswerLetterService => new AnswerLetterService();

export { createAnswerLetter };
