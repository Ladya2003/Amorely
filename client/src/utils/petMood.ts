import type { Pet } from '../services/petsService';

export const SATIETY_HUNGRY_THRESHOLD = 20;
export const SATIETY_NEUTRAL_MAX = 40;
export const SATIETY_HAPPY_MIN = 40;

export type PetMood = 'angry' | 'neutral' | 'happy';

export const getPetMood = (pet: Pet): PetMood | null => {
  const satiety = pet.stats.satiety ?? 60;
  const affectionDelta = pet.affectionDelta ?? 0;

  if (satiety < SATIETY_HUNGRY_THRESHOLD) {
    return 'angry';
  }
  if (satiety > SATIETY_HAPPY_MIN && affectionDelta > 0) {
    return 'happy';
  }
  if (satiety >= SATIETY_HUNGRY_THRESHOLD && satiety < SATIETY_NEUTRAL_MAX && affectionDelta === 0) {
    return 'neutral';
  }
  return null;
};

export const getPetMoodEmoji = (mood: PetMood | null): string | null => {
  switch (mood) {
    case 'angry':
      return '😾';
    case 'neutral':
      return '😐';
    case 'happy':
      return '😊';
    default:
      return null;
  }
};
