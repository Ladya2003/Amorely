export const PET_SPECIES = ['kitten', 'puppy', 'gecko', 'bunny', 'owlet'] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export const PET_VARIANTS: Record<PetSpecies, readonly string[]> = {
  kitten: ['orange', 'gray', 'black'],
  puppy: ['golden', 'brown', 'spotted'],
  gecko: ['green', 'blue', 'yellow'],
  bunny: ['white', 'gray', 'cream'],
  owlet: ['brown', 'gray', 'white'],
} as const;

export const PET_MAX_LEVEL = 5;
export const PET_PURCHASE_COST = 100;
export const REGISTRATION_BONUS = 100;

/** Sub-level costs within each main level, plus the gate cost to the next main level. Total 1→5: 2190. */
export const LEVEL_PROGRESSION: Record<number, { subCosts: readonly number[]; levelUpCost: number }> = {
  1: { subCosts: [20, 25], levelUpCost: 35 },
  2: { subCosts: [25, 30, 35], levelUpCost: 40 },
  3: { subCosts: [80, 80, 80, 80], levelUpCost: 420 },
  4: { subCosts: [120, 120, 120, 120, 120], levelUpCost: 640 },
};

export interface PetStats {
  affection: number;
  playfulness: number;
  charm: number;
}

/** Level-1 stats per species and color variant (always three distinct values). */
const PET_BASE_STATS: Record<PetSpecies, Record<string, PetStats>> = {
  kitten: {
    orange: { affection: 20, playfulness: 28, charm: 16 },
    gray: { affection: 26, playfulness: 18, charm: 22 },
    black: { affection: 18, playfulness: 22, charm: 27 },
  },
  puppy: {
    golden: { affection: 28, playfulness: 26, charm: 19 },
    brown: { affection: 27, playfulness: 20, charm: 21 },
    spotted: { affection: 19, playfulness: 29, charm: 23 },
  },
  gecko: {
    green: { affection: 12, playfulness: 16, charm: 18 },
    blue: { affection: 14, playfulness: 15, charm: 26 },
    yellow: { affection: 13, playfulness: 24, charm: 17 },
  },
  bunny: {
    white: { affection: 27, playfulness: 17, charm: 24 },
    gray: { affection: 21, playfulness: 19, charm: 23 },
    cream: { affection: 29, playfulness: 16, charm: 21 },
  },
  owlet: {
    brown: { affection: 18, playfulness: 12, charm: 26 },
    gray: { affection: 20, playfulness: 14, charm: 24 },
    white: { affection: 19, playfulness: 13, charm: 28 },
  },
};

/** Per-level growth by species — playful pets gain playfulness faster, etc. */
const PET_STAT_GROWTH: Record<PetSpecies, PetStats> = {
  kitten: { affection: 13, playfulness: 11, charm: 12 },
  puppy: { affection: 12, playfulness: 14, charm: 10 },
  gecko: { affection: 9, playfulness: 13, charm: 11 },
  bunny: { affection: 14, playfulness: 10, charm: 12 },
  owlet: { affection: 11, playfulness: 8, charm: 15 },
};

const clampStat = (value: number): number => Math.min(100, Math.max(1, Math.round(value)));

const getEffectiveStatSteps = (level: number, subLevel: number): number => {
  const lv = Math.min(Math.max(level, 1), PET_MAX_LEVEL);
  if (lv >= PET_MAX_LEVEL) {
    return PET_MAX_LEVEL - 1;
  }

  const config = LEVEL_PROGRESSION[lv];
  if (!config) {
    return lv - 1;
  }

  const stepsInLevel = config.subCosts.length + 1;
  return lv - 1 + subLevel / stepsInLevel;
};

export const getPetStats = (
  species: PetSpecies,
  variant: string,
  level: number,
  subLevel = 0
): PetStats => {
  const variants = PET_VARIANTS[species];
  const resolvedVariant = variants.includes(variant) ? variant : variants[0];
  const base = PET_BASE_STATS[species][resolvedVariant];
  const growth = PET_STAT_GROWTH[species];
  const steps = getEffectiveStatSteps(level, subLevel);

  return {
    affection: clampStat(base.affection + growth.affection * steps),
    playfulness: clampStat(base.playfulness + growth.playfulness * steps),
    charm: clampStat(base.charm + growth.charm * steps),
  };
};

export const isValidSpecies = (species: string): species is PetSpecies =>
  (PET_SPECIES as readonly string[]).includes(species);

export const isValidVariant = (species: PetSpecies, variant: string): boolean =>
  (PET_VARIANTS[species] as readonly string[]).includes(variant);

export const getLevelProgression = (level: number) => LEVEL_PROGRESSION[level] ?? null;

export const getSubLevelMax = (level: number): number => {
  if (level >= PET_MAX_LEVEL) return 0;
  return LEVEL_PROGRESSION[level]?.subCosts.length ?? 0;
};

export const isMainLevelUpgradeNext = (level: number, subLevel: number): boolean => {
  if (level >= PET_MAX_LEVEL) return false;
  const config = LEVEL_PROGRESSION[level];
  if (!config) return false;
  return subLevel >= config.subCosts.length;
};

export const getNextUpgradeCost = (level: number, subLevel = 0): number | null => {
  if (level >= PET_MAX_LEVEL) return null;

  const config = LEVEL_PROGRESSION[level];
  if (!config) return null;

  if (subLevel < config.subCosts.length) {
    return config.subCosts[subLevel];
  }

  if (level < PET_MAX_LEVEL) {
    return config.levelUpCost;
  }

  return null;
};

/** @deprecated Use getNextUpgradeCost(level, subLevel) */
export const getLevelUpCost = (currentLevel: number, subLevel = 0): number | null =>
  getNextUpgradeCost(currentLevel, subLevel);

export const getLevelProgressPercent = (level: number, subLevel: number): number => {
  if (level >= PET_MAX_LEVEL) return 100;

  const subLevelMax = getSubLevelMax(level);
  if (subLevelMax <= 0) return 100;

  return Math.min(100, Math.round((subLevel / subLevelMax) * 100));
};

export const applyUpgradeStep = (
  level: number,
  subLevel: number
): { level: number; subLevel: number } => {
  if (level >= PET_MAX_LEVEL) {
    return { level, subLevel };
  }

  const config = LEVEL_PROGRESSION[level];
  if (!config) {
    return { level, subLevel };
  }

  if (subLevel < config.subCosts.length) {
    return { level, subLevel: subLevel + 1 };
  }

  return { level: Math.min(level + 1, PET_MAX_LEVEL), subLevel: 0 };
};

export const getPetImagePath = (
  species: PetSpecies,
  variant: string,
  level: number
): string => `/pets/${species}/${variant}/level-${Math.min(Math.max(level, 1), PET_MAX_LEVEL)}.png`;

export const getPetEggPath = (species: PetSpecies, variant: string): string =>
  `/pets/${species}/${variant}/egg.png`;
