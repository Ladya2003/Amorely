export const QUIZ_OPTION_IDS = ['a', 'b', 'c', 'd'] as const;

export type QuizOptionId = (typeof QUIZ_OPTION_IDS)[number];

export interface QuizQuestionOption {
  id: QuizOptionId;
  text: string;
}

export interface QuizQuestion {
  id: string;
  categoryId: string;
  text: string;
  correctId: QuizOptionId;
  options: QuizQuestionOption[];
}

export interface QuizQuestionSourceOption extends QuizQuestionOption {
  textEn: string;
}

export interface QuizQuestionSource extends QuizQuestion {
  textEn: string;
  options: QuizQuestionSourceOption[];
}

export const toRuntimeQuizQuestion = (source: QuizQuestionSource): QuizQuestion => ({
  id: source.id,
  categoryId: source.categoryId,
  text: source.text,
  correctId: source.correctId,
  options: source.options.map((option) => ({
    id: option.id,
    text: option.text,
  })),
});
