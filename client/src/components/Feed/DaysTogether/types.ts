// Типы для компонента DaysTogether

export interface DaysTogetherProps {
  daysCount: number | null;
  relationshipStartDate: string | null;
  onAddPhoto: (file: File) => void;
  onAddSignature: (signatureDataUrl: string) => void;
  photo?: string;
  signature?: string; // Для обратной совместимости
  signatures?: {
    user?: string;
    partner?: string;
  };
}

export interface Milestone {
  id: string;
  days: number;
  title: string;
  icon: string;
  description: string;
  achieved: boolean;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  date?: Date;
}

