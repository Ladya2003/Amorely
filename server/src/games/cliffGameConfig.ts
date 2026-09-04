export const CLIFF_HUB_ALTITUDE = 10;
export const CLIFF_BRIDGE_ALTITUDE = 80;
export const CLIFF_LIFT_ALTITUDE = 100;
export const CLIFF_LIFT_RAISED_ALTITUDE = 130;
export const CLIFF_ROPES_ALTITUDE = 140;
export const CLIFF_ROPES_CHECKPOINT_ALTITUDE = 145;
export const CLIFF_ROPES_END_ALTITUDE = 148;
export const CLIFF_BALLS_ALTITUDE = 160;
export const CLIFF_CAVES_ALTITUDE = 170;
export const CLIFF_GUIDES_ALTITUDE = 190;
export const CLIFF_WORDS_ALTITUDE = 220;
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

export type CliffScene =
  | 'hub'
  | 'bridge'
  | 'lift'
  | 'ropes'
  | 'balls'
  | 'caves'
  | 'guides'
  | 'words'
  | 'finished';
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

export const CLIFF_GUIDE_PET_MIN_LEVEL = CLIFF_LIFT_PET_MIN_LEVEL;
export const CLIFF_GUIDE_RUN_MAX_CELLS = 8;
export const CLIFF_GUIDE_RUN_MAX_FORKS = 2;
export const CLIFF_GUIDE_TRAIL_MS = 5_000;
export const CLIFF_GUIDE_PET_STEP_MS = 80;
export const CLIFF_GUIDE_PET_LEVEL_MAX = 5;

export type CliffGuideDir = 'up' | 'down' | 'left' | 'right';
export type CliffGuideCellKind = 'wall' | 'path' | 'trap' | 'start' | 'exit';

export interface CliffGuidePoint {
  x: number;
  y: number;
}

export interface CliffGuideMap {
  width: number;
  height: number;
  start: CliffGuidePoint;
  exit: CliffGuidePoint;
  path: CliffGuidePoint[];
  forks: CliffGuidePoint[];
  cells: CliffGuideCellKind[][];
}

const OWNER_GUIDE_ROWS = [
  '#############',
  '#S....T######',
  '#####.#######',
  '#.....#######',
  '#.###########',
  '#......######',
  '######.######',
  '##.....#...##',
  '##.#####.#.##',
  '##.......#.##',
  '##.#######.##',
  '##T#######..E',
  '#############',
] as const;

const PARTNER_GUIDE_ROWS = [
  '#############',
  'E..#####T####',
  '##.#####.####',
  '##.##....####',
  '##.##.##.####',
  '##.##.##.####',
  '##....##....#',
  '###########.#',
  '###########.#',
  '#######.....#',
  '#######.#####',
  '#####T.....S#',
  '#############',
] as const;

const GUIDE_DIR_DELTA: Record<CliffGuideDir, CliffGuidePoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const parseGuideKind = (ch: string): CliffGuideCellKind => {
  switch (ch) {
    case '#':
      return 'wall';
    case '.':
      return 'path';
    case 'T':
      return 'trap';
    case 'S':
      return 'start';
    case 'E':
      return 'exit';
    default:
      throw new Error(`Unknown guide cell "${ch}"`);
  }
};

const guidePointKey = (point: CliffGuidePoint) => `${point.x},${point.y}`;

const neighborsOf = (point: CliffGuidePoint): CliffGuidePoint[] => [
  { x: point.x, y: point.y - 1 },
  { x: point.x, y: point.y + 1 },
  { x: point.x - 1, y: point.y },
  { x: point.x + 1, y: point.y },
];

const findGuideChar = (rows: readonly string[], ch: string): CliffGuidePoint => {
  for (let y = 0; y < rows.length; y += 1) {
    const x = rows[y].indexOf(ch);
    if (x >= 0) {
      return { x, y };
    }
  }
  throw new Error(`Guide map is missing ${ch}`);
};

const walkableKinds: readonly CliffGuideCellKind[] = ['path', 'start', 'exit'];

const buildGuideMap = (rows: readonly string[]): CliffGuideMap => {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const cells = rows.map((row) => Array.from(row, parseGuideKind));
  const start = findGuideChar(rows, 'S');
  const exit = findGuideChar(rows, 'E');
  const visited = new Set<string>([guidePointKey(start)]);
  const prev = new Map<string, string>();
  const queue: CliffGuidePoint[] = [start];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    if (current.x === exit.x && current.y === exit.y) {
      break;
    }
    for (const next of neighborsOf(current)) {
      const kind = cells[next.y]?.[next.x];
      if (!kind || !walkableKinds.includes(kind)) {
        continue;
      }
      const key = guidePointKey(next);
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);
      prev.set(key, guidePointKey(current));
      queue.push(next);
    }
  }

  const path: CliffGuidePoint[] = [];
  let cursor: string | undefined = guidePointKey(exit);
  while (cursor) {
    const [x, y] = cursor.split(',').map(Number);
    path.push({ x, y });
    cursor = prev.get(cursor);
  }
  path.reverse();
  if (path.length === 0 || path[0].x !== start.x || path[0].y !== start.y) {
    throw new Error('Guide map has no path from start to exit');
  }

  const forks = path.filter((point) =>
    neighborsOf(point).some((next) => cells[next.y]?.[next.x] === 'trap')
  );

  return { width, height, start, exit, path, forks, cells };
};

export const CLIFF_GUIDE_MAPS: Record<CliffCaveSide, CliffGuideMap> = {
  owner: buildGuideMap(OWNER_GUIDE_ROWS),
  partner: buildGuideMap(PARTNER_GUIDE_ROWS),
};

export const guideMapOf = (role: CliffCaveSide) => CLIFF_GUIDE_MAPS[role];

export const guideCellOf = (map: CliffGuideMap, point: CliffGuidePoint): CliffGuideCellKind | null =>
  map.cells[point.y]?.[point.x] ?? null;

export const isGuideFork = (map: CliffGuideMap, point: CliffGuidePoint) =>
  map.forks.some((fork) => fork.x === point.x && fork.y === point.y);

export const shiftGuidePoint = (point: CliffGuidePoint, dir: CliffGuideDir): CliffGuidePoint => {
  const delta = GUIDE_DIR_DELTA[dir];
  return { x: point.x + delta.x, y: point.y + delta.y };
};

export const isCliffGuideDir = (value: unknown): value is CliffGuideDir =>
  value === 'up' || value === 'down' || value === 'left' || value === 'right';

export const clampGuidePetRuns = (level: number) =>
  Math.min(CLIFF_GUIDE_PET_LEVEL_MAX, Math.max(CLIFF_GUIDE_PET_MIN_LEVEL, Math.round(level)));

export const nextGuideScoutRun = (
  map: CliffGuideMap,
  scoutIndex: number
): { cells: CliffGuidePoint[]; nextIndex: number } => {
  const start = Math.max(0, Math.min(scoutIndex, map.path.length - 1));
  const cells: CliffGuidePoint[] = [];
  let forks = 0;
  let index = start;
  while (index < map.path.length && cells.length < CLIFF_GUIDE_RUN_MAX_CELLS) {
    const point = map.path[index];
    cells.push(point);
    if (index > start && isGuideFork(map, point)) {
      forks += 1;
      if (forks >= CLIFF_GUIDE_RUN_MAX_FORKS) {
        return { cells, nextIndex: index + 1 };
      }
    }
    index += 1;
  }
  return { cells, nextIndex: index };
};

export const guidePathFrom = (map: CliffGuideMap, from: CliffGuidePoint): CliffGuidePoint[] => {
  const startKind = guideCellOf(map, from);
  const start = startKind && walkableKinds.includes(startKind) ? from : map.start;
  if (start.x === map.exit.x && start.y === map.exit.y) {
    return [start];
  }

  const visited = new Set<string>([guidePointKey(start)]);
  const prev = new Map<string, string>();
  const queue: CliffGuidePoint[] = [start];
  let reached = false;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    if (current.x === map.exit.x && current.y === map.exit.y) {
      reached = true;
      break;
    }
    for (const next of neighborsOf(current)) {
      const kind = map.cells[next.y]?.[next.x];
      if (!kind || !walkableKinds.includes(kind)) {
        continue;
      }
      const key = guidePointKey(next);
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);
      prev.set(key, guidePointKey(current));
      queue.push(next);
    }
  }

  if (!reached) {
    return [];
  }

  const path: CliffGuidePoint[] = [];
  let cursor: string | undefined = guidePointKey(map.exit);
  while (cursor) {
    const [x, y] = cursor.split(',').map(Number);
    path.push({ x, y });
    cursor = prev.get(cursor);
  }
  path.reverse();
  return path;
};

export const CLIFF_WORDS_FUEL_START = 12;
export const CLIFF_WORDS_FUEL_MAX = 12;
export const CLIFF_WORDS_FUEL_BOUNCE = 1;
export const CLIFF_WORDS_FUEL_PHRASE = 4;
export const CLIFF_WORDS_WORLD_WIDTH = 100;
export const CLIFF_WORDS_CAMERA_HEIGHT = 100;
export const CLIFF_WORDS_PLATFORM_COUNT = 24;
export const CLIFF_WORDS_FLOOR_Y = 16;
export const CLIFF_WORDS_PLATFORM_GAP = 22;
export const CLIFF_WORDS_PLATFORM_WIDTH = 26;
export const CLIFF_WORDS_PLAYER_WIDTH = 8;
export const CLIFF_WORDS_MAX_BOUNCE_DY = 36;
export const CLIFF_WORDS_MAX_FALL_DY = 40;
export const CLIFF_WORDS_CHECKPOINT_INDEXES = [7, 15, 21] as const;
export const CLIFF_WORDS_PHRASE_IDS = ['cheer', 'believe', 'together', 'proud'] as const;
export type CliffWordsPhraseId = (typeof CLIFF_WORDS_PHRASE_IDS)[number];

export interface CliffWordsPlatform {
  x: number;
  y: number;
  w: number;
  checkpoint: 0 | 1 | 2 | 3;
}

const wordsCheckpointOf = (index: number): 0 | 1 | 2 | 3 => {
  if (index === CLIFF_WORDS_CHECKPOINT_INDEXES[0]) {
    return 1;
  }
  if (index === CLIFF_WORDS_CHECKPOINT_INDEXES[1]) {
    return 2;
  }
  if (index === CLIFF_WORDS_CHECKPOINT_INDEXES[2]) {
    return 3;
  }
  return 0;
};

const CLIFF_WORDS_PLATFORM_X = [
  22, 38, 72, 55, 28, 16, 50, 46, 78, 64, 32, 20, 58, 84, 48, 50, 26, 70, 86, 40, 18, 52, 74, 50,
] as const;

export const CLIFF_WORDS_PLATFORMS: CliffWordsPlatform[] = Array.from(
  { length: CLIFF_WORDS_PLATFORM_COUNT },
  (_, index) => ({
    x: CLIFF_WORDS_PLATFORM_X[index] ?? 50,
    y: CLIFF_WORDS_FLOOR_Y + index * CLIFF_WORDS_PLATFORM_GAP,
    w: CLIFF_WORDS_PLATFORM_WIDTH,
    checkpoint: wordsCheckpointOf(index),
  })
);

export const CLIFF_WORDS_FINISH_Y =
  CLIFF_WORDS_FLOOR_Y + (CLIFF_WORDS_PLATFORM_COUNT - 1) * CLIFF_WORDS_PLATFORM_GAP;
export const CLIFF_WORDS_CAMERA_UNLOCK_INDEX = 2;
export const CLIFF_WORDS_CAMERA_UNLOCK_Y =
  CLIFF_WORDS_FLOOR_Y + CLIFF_WORDS_CAMERA_UNLOCK_INDEX * CLIFF_WORDS_PLATFORM_GAP;
export const CLIFF_WORDS_CAMERA_KEEP = 26;
export const CLIFF_WORDS_CAMERA_START = 0;

export const cliffWordsPlaceX = (y: number, role: CliffCaveSide) => {
  const platform =
    CLIFF_WORDS_PLATFORMS.find((item) => Math.abs(item.y - y) < 0.51) ?? CLIFF_WORDS_PLATFORMS[0];
  return platform.x + (role === 'owner' ? -4 : 4);
};

export const cliffWordsStartX = (role: CliffCaveSide) => cliffWordsPlaceX(CLIFF_WORDS_FLOOR_Y, role);

export const cliffWordsStartY = () => CLIFF_WORDS_FLOOR_Y;

export const cliffWordsCheckpointY = (checkpoint: number) => {
  if (checkpoint <= 0) {
    return CLIFF_WORDS_FLOOR_Y;
  }
  const index = CLIFF_WORDS_CHECKPOINT_INDEXES[Math.min(3, checkpoint) - 1];
  return CLIFF_WORDS_FLOOR_Y + index * CLIFF_WORDS_PLATFORM_GAP;
};

export const cliffWordsCheckpointAtY = (y: number): 0 | 1 | 2 | 3 => {
  let reached: 0 | 1 | 2 | 3 = 0;
  for (const platform of CLIFF_WORDS_PLATFORMS) {
    if (platform.checkpoint > 0 && y + 0.01 >= platform.y) {
      reached = platform.checkpoint;
    }
  }
  return reached;
};

export const isCliffWordsPhraseId = (value: unknown): value is CliffWordsPhraseId =>
  typeof value === 'string' && (CLIFF_WORDS_PHRASE_IDS as readonly string[]).includes(value);

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
