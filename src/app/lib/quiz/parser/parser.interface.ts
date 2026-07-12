import type { QuestionParts } from "@/app/lib/quiz/parser/parser.types.ts";

interface ISplitQuestionService {
  parse: (question: string) => QuestionParts;
}

export type { ISplitQuestionService };
