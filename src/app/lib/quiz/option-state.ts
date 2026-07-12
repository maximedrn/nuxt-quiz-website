const AnswerOutcome = {
  correct: "correct",
  incorrect: "incorrect",
} as const satisfies Record<string, string>;

type AnswerOutcome = (typeof AnswerOutcome)[keyof typeof AnswerOutcome];

type ProgressResult = AnswerOutcome | null;

const OptionButtonState = {
  correct: "correct",
  default: "default",
  incorrect: "incorrect",
  muted: "muted",
} as const satisfies Record<string, string>;

type OptionButtonState =
  (typeof OptionButtonState)[keyof typeof OptionButtonState];

export type { ProgressResult };
export { AnswerOutcome, OptionButtonState };
