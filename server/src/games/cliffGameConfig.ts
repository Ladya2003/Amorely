export const CLIFF_HUB_ALTITUDE = 10;
export const CLIFF_BRIDGE_ALTITUDE = 80;
export const CLIFF_LIFT_ALTITUDE = 100;
export const CLIFF_LIFT_RAISED_ALTITUDE = 130;
export const CLIFF_ROPES_ALTITUDE = 140;
export const CLIFF_ROPES_CHECKPOINT_ALTITUDE = 145;
export const CLIFF_ROPES_END_ALTITUDE = 148;
export const CLIFF_BALLS_ALTITUDE = 160;
export const CLIFF_CAVES_ALTITUDE = 170;
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

export type CliffScene = 'hub' | 'bridge' | 'lift' | 'ropes' | 'balls' | 'caves' | 'finished';
export type CliffMetal = 'iron' | 'copper';
export type CliffCaveResource = 'iron' | 'copper' | 'quartz' | 'resin';
export type CliffCaveSide = 'owner' | 'partner';
export type CliffCaveItemId =
  | CliffCaveResource
  | 'wick_cup'
  | 'lens_flask'
  | 'lamp_body'
  | 'lantern';
export type CliffCaveCraftAction = 'craft' | 'gift' | 'done';

export const CLIFF_CAVE_VEIN_COUNT = 4;
export const CLIFF_CAVE_ITEMS: readonly CliffCaveItemId[] = [
  'iron',
  'copper',
  'quartz',
  'resin',
  'wick_cup',
  'lens_flask',
  'lamp_body',
  'lantern',
];

export interface CliffCaveInventory {
  iron: number;
  copper: number;
  quartz: number;
  resin: number;
  wick_cup: number;
  lens_flask: number;
  lamp_body: number;
  lantern: number;
}

export const emptyCliffCaveInventory = (): CliffCaveInventory => ({
  iron: 0,
  copper: 0,
  quartz: 0,
  resin: 0,
  wick_cup: 0,
  lens_flask: 0,
  lamp_body: 0,
  lantern: 0,
});

export interface CliffCaveCraftStep {
  step: 1 | 2 | 3 | 4;
  role: CliffCaveSide;
  result: Exclude<CliffCaveItemId, CliffCaveResource>;
  resultCount: number;
  cost: Partial<CliffCaveInventory>;
}

export const CLIFF_CAVE_CRAFT_STEPS: readonly CliffCaveCraftStep[] = [
  { step: 1, role: 'partner', result: 'wick_cup', resultCount: 1, cost: { copper: 8, resin: 6 } },
  { step: 2, role: 'owner', result: 'lens_flask', resultCount: 1, cost: { wick_cup: 1, iron: 6, quartz: 8 } },
  { step: 3, role: 'partner', result: 'lamp_body', resultCount: 1, cost: { lens_flask: 1, copper: 8, resin: 4 } },
  { step: 4, role: 'owner', result: 'lantern', resultCount: 2, cost: { lamp_body: 1, iron: 8, quartz: 6 } },
];

export const pickaxeForCaveResource = (resource: CliffCaveResource): CliffMetal => {
  switch (resource) {
    case 'iron':
    case 'quartz':
      return 'iron';
    case 'copper':
    case 'resin':
      return 'copper';
    default: {
      const exhaustive: never = resource;
      return exhaustive;
    }
  }
};

export const isCliffCaveItemId = (value: unknown): value is CliffCaveItemId =>
  typeof value === 'string' && (CLIFF_CAVE_ITEMS as readonly string[]).includes(value);

export const isCliffCaveResource = (value: unknown): value is CliffCaveResource =>
  value === 'iron' || value === 'copper' || value === 'quartz' || value === 'resin';

export interface CliffCaveBoulderSeed {
  id: string;
  resource: CliffCaveResource;
  side: CliffCaveSide;
  yield: number;
  tapsRequired: number;
  tapsDone: number;
  depleted: boolean;
}

const createCaveVeinGroup = (
  side: CliffCaveSide,
  resource: CliffCaveResource,
  count: number
): CliffCaveBoulderSeed[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `cave-${side}-${resource}-${index}`,
    resource,
    side,
    yield: randomIntInclusive(CLIFF_BOULDER_YIELD_MIN, CLIFF_BOULDER_YIELD_MAX),
    tapsRequired: randomIntInclusive(CLIFF_BOULDER_TAPS_MIN, CLIFF_BOULDER_TAPS_MAX),
    tapsDone: 0,
    depleted: false,
  }));

export const createCliffCaveBoulders = (): CliffCaveBoulderSeed[] => [
  ...createCaveVeinGroup('owner', 'iron', CLIFF_CAVE_VEIN_COUNT),
  ...createCaveVeinGroup('owner', 'quartz', CLIFF_CAVE_VEIN_COUNT),
  ...createCaveVeinGroup('partner', 'copper', CLIFF_CAVE_VEIN_COUNT),
  ...createCaveVeinGroup('partner', 'resin', CLIFF_CAVE_VEIN_COUNT),
];
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
