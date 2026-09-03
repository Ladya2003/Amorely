export const CLIFF_HUB_ALTITUDE = 10;
export const CLIFF_BRIDGE_ALTITUDE = 80;
export const CLIFF_LIFT_ALTITUDE = 100;
export const CLIFF_LIFT_RAISED_ALTITUDE = 130;
export const CLIFF_ROPES_ALTITUDE = 140;
export const CLIFF_ROPES_CHECKPOINT_ALTITUDE = 145;
export const CLIFF_ROPES_END_ALTITUDE = 148;
export const CLIFF_BALLS_ALTITUDE = 160;
export const CLIFF_FINISH_ALTITUDE = 150;
export const CLIFF_ROPES_FIRST = 3;
export const CLIFF_ROPES_SECOND = 5;
export const CLIFF_ROPES_TOTAL = CLIFF_ROPES_FIRST + CLIFF_ROPES_SECOND;
export const CLIFF_ROPES_CHECKPOINT = CLIFF_ROPES_FIRST;
export const CLIFF_LIFT_PET_MIN_LEVEL = 2;
export const CLIFF_LIFT_PETS_REQUIRED = 2;

export const CLIFF_BALLS_EACH = 5;
export const CLIFF_BALLS_SCORE_THRESHOLD = 170;
export const CLIFF_BALL_ZONE_SCORES = [10, 20, 30, 40] as const;
export type CliffBallZoneScore = (typeof CLIFF_BALL_ZONE_SCORES)[number] | 0;

export const CLIFF_PICKAXE_COST = 50;
export const CLIFF_AXE_IRON_COST = 20;
export const CLIFF_AXE_COPPER_COST = 20;

export const CLIFF_STONES_EACH = 20;
export const CLIFF_HOLES_REQUIRED = 3;

export const CLIFF_BOULDER_YIELD_MIN = 4;
export const CLIFF_BOULDER_YIELD_MAX = 8;
export const CLIFF_BOULDER_TAPS_MIN = 5;
export const CLIFF_BOULDER_TAPS_MAX = 20;
export const CLIFF_IRON_BOULDER_COUNT = 5;
export const CLIFF_COPPER_BOULDER_COUNT = 5;
export const CLIFF_MINE_RESET_MS = 12 * 60 * 60 * 1000;

export type CliffScene = 'hub' | 'bridge' | 'lift' | 'ropes' | 'balls' | 'finished';
export type CliffMetal = 'iron' | 'copper';
export type CliffPickaxeType = CliffMetal;
export type CliffShopItemId = 'iron_pickaxe' | 'copper_pickaxe' | 'axe';
export type CliffIntroLine = 'wow' | 'agree';

export const CLIFF_SHOP_ITEMS: Array<{
  id: CliffShopItemId;
  name: string;
  pickaxeType?: CliffPickaxeType;
  amoreCost: number;
  ironCost: number;
  copperCost: number;
}> = [
  {
    id: 'iron_pickaxe',
    name: 'Кирка железа',
    pickaxeType: 'iron',
    amoreCost: CLIFF_PICKAXE_COST,
    ironCost: 0,
    copperCost: 0,
  },
  {
    id: 'copper_pickaxe',
    name: 'Кирка меди',
    pickaxeType: 'copper',
    amoreCost: CLIFF_PICKAXE_COST,
    ironCost: 0,
    copperCost: 0,
  },
  {
    id: 'axe',
    name: 'Топор',
    amoreCost: 0,
    ironCost: CLIFF_AXE_IRON_COST,
    copperCost: CLIFF_AXE_COPPER_COST,
  },
];

export const getCliffShopItem = (itemId: string) =>
  CLIFF_SHOP_ITEMS.find((item) => item.id === itemId);

export const randomIntInclusive = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1));

export interface CliffBoulderSeed {
  id: string;
  metal: CliffMetal;
  yield: number;
  tapsRequired: number;
  tapsDone: number;
  depleted: boolean;
}

export const createCliffBoulders = (): CliffBoulderSeed[] => {
  const iron = Array.from({ length: CLIFF_IRON_BOULDER_COUNT }, (_, index) => ({
    id: `iron-${index}`,
    metal: 'iron' as const,
    yield: randomIntInclusive(CLIFF_BOULDER_YIELD_MIN, CLIFF_BOULDER_YIELD_MAX),
    tapsRequired: randomIntInclusive(CLIFF_BOULDER_TAPS_MIN, CLIFF_BOULDER_TAPS_MAX),
    tapsDone: 0,
    depleted: false,
  }));
  const copper = Array.from({ length: CLIFF_COPPER_BOULDER_COUNT }, (_, index) => ({
    id: `copper-${index}`,
    metal: 'copper' as const,
    yield: randomIntInclusive(CLIFF_BOULDER_YIELD_MIN, CLIFF_BOULDER_YIELD_MAX),
    tapsRequired: randomIntInclusive(CLIFF_BOULDER_TAPS_MIN, CLIFF_BOULDER_TAPS_MAX),
    tapsDone: 0,
    depleted: false,
  }));
  return [...iron, ...copper];
};
