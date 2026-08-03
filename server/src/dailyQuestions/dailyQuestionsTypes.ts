export type DailyQuestionType = 'text' | 'choice' | 'image';

export interface DailyQuestionChoice {
  id: string;
  label: string;
}

export interface DailyQuestionImageOption {
  id: string;
  label: string;
  url: string;
}

export interface DailyQuestion {
  id: string;
  type: DailyQuestionType;
  text: string;
  options?: DailyQuestionChoice[];
  images?: DailyQuestionImageOption[];
}

export interface DailyQuestionCategory {
  id: string;
  emoji: string;
  title: string;
  questions: DailyQuestion[];
}
