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

export interface CategoryStatus {
  id: string;
  emoji: string;
  title: string;
  questionCount: number;
  userCompleted: boolean;
  partnerCompleted: boolean;
  bothCompleted: boolean;
  bothCompletedAt: string | null;
  userProgress: number;
  partnerProgress: number;
}

export interface DailyQuestionsState {
  hasPartner: boolean;
  roundKey?: string;
  categoryIds?: string[];
  categories?: CategoryStatus[];
  bothCompletedAllAt?: string | null;
  nextRoundAt?: string | null;
  msUntilNextRound?: number | null;
}

export interface CategoryResultItem {
  questionId: string;
  questionText: string;
  questionType: string;
  userAnswer: string;
  userAnswerLabel: string;
  partnerAnswer: string | null;
  partnerAnswerLabel: string | null;
  isMatch: boolean | null;
}

export interface CategoryResults {
  categoryId: string;
  emoji: string;
  title: string;
  similarity: number | null;
  userCompleted: boolean;
  partnerCompleted: boolean;
  bothCompleted: boolean;
  items: CategoryResultItem[];
}

export interface CategoryDetail {
  id: string;
  emoji: string;
  title: string;
  questions: DailyQuestion[];
  results: CategoryResults | null;
}

export interface HistoryEntry {
  roundKey: string;
  categoryIds: string[];
  archivedAt: string;
  bothCompletedAllAt: string | null;
  categories: {
    id: string;
    emoji: string;
    title: string;
    similarity: number | null;
    userCompleted: boolean;
    partnerCompleted: boolean;
  }[];
}
