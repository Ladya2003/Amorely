export type FortuneWheelData = {
  title: string;
  tasks: string[];
  updatedAt: string | null;
};

export type FortuneWheelDraft = {
  title: string;
  tasksText: string;
};

export const tasksToText = (tasks: string[]): string => tasks.join('\n');

export const textToTasks = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
