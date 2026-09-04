export const CLIFF_ASSETS = {
  catalog: '/games/cliff/catalog.png',
  hubBg: '/games/cliff/hub-bg.png',
  shopStall: '/games/cliff/shop-stall.png',
  mineEntrance: '/games/cliff/mine-entrance.png',
  mineInterior: '/games/cliff/mine-interior.png',
  bodyIdle: '/games/cliff/body-idle.png',
  pickaxeIron: '/games/cliff/pickaxe-iron.png',
  pickaxeCopper: '/games/cliff/pickaxe-copper.png',
  axe: '/games/cliff/axe.png',
  boulders: '/games/cliff/boulders.png',
  boulderIron: '/games/cliff/boulder-iron.png',
  boulderCopper: '/games/cliff/boulder-copper.png',
  oresPebble: '/games/cliff/ores-pebble.png',
  climbPath: '/games/cliff/climb-path.png',
  gatesBridges: '/games/cliff/gates-bridges.png',
  gateClosed: '/games/cliff/gate-closed.png',
  bridgeRepaired: '/games/cliff/bridge-repaired.png',
  liftBg: '/games/cliff/lift-bg.png',
  pressurePlate: '/games/cliff/pressure-plate.png',
  ropesBg: '/games/cliff/ropes-bg.png',
  ropesBg2: '/games/cliff/ropes-bg-2.png',
  ballsBg: '/games/cliff/balls-bg.png',
  ballsLane: '/games/cliff/balls-lane.png',
  cavesFall: '/games/cliff/caves-fall.png',
  cavesCorridor: '/games/cliff/caves-corridor.png',
  boulderQuartz: '/games/cliff/boulder-quartz.png',
  boulderResin: '/games/cliff/boulder-resin.png',
  wickCup: '/games/cliff/item-wick-cup.png',
  lensFlask: '/games/cliff/item-lens-flask.png',
  lampBody: '/games/cliff/item-lamp-body.png',
  lantern: '/games/cliff/item-lantern.png',
} as const;

export const cliffBoulderImage = (metal: 'iron' | 'copper') => {
  switch (metal) {
    case 'iron':
      return CLIFF_ASSETS.boulderIron;
    case 'copper':
      return CLIFF_ASSETS.boulderCopper;
    default: {
      const exhaustive: never = metal;
      return exhaustive;
    }
  }
};

export const cliffCaveResourceImage = (resource: 'iron' | 'copper' | 'quartz' | 'resin') => {
  switch (resource) {
    case 'iron':
      return CLIFF_ASSETS.boulderIron;
    case 'copper':
      return CLIFF_ASSETS.boulderCopper;
    case 'quartz':
      return CLIFF_ASSETS.boulderQuartz;
    case 'resin':
      return CLIFF_ASSETS.boulderResin;
    default: {
      const exhaustive: never = resource;
      return exhaustive;
    }
  }
};

export const cliffCaveItemImage = (
  id: 'iron' | 'copper' | 'quartz' | 'resin' | 'wick_cup' | 'lens_flask' | 'lamp_body' | 'lantern'
) => {
  switch (id) {
    case 'iron':
      return CLIFF_ASSETS.boulderIron;
    case 'copper':
      return CLIFF_ASSETS.boulderCopper;
    case 'quartz':
      return CLIFF_ASSETS.boulderQuartz;
    case 'resin':
      return CLIFF_ASSETS.boulderResin;
    case 'wick_cup':
      return CLIFF_ASSETS.wickCup;
    case 'lens_flask':
      return CLIFF_ASSETS.lensFlask;
    case 'lamp_body':
      return CLIFF_ASSETS.lampBody;
    case 'lantern':
      return CLIFF_ASSETS.lantern;
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
};

export const cliffItemImage = (id: 'iron_pickaxe' | 'copper_pickaxe' | 'axe' | 'iron' | 'copper' | 'pebble') => {
  switch (id) {
    case 'iron_pickaxe':
      return CLIFF_ASSETS.pickaxeIron;
    case 'copper_pickaxe':
      return CLIFF_ASSETS.pickaxeCopper;
    case 'axe':
      return CLIFF_ASSETS.axe;
    case 'iron':
      return CLIFF_ASSETS.boulderIron;
    case 'copper':
      return CLIFF_ASSETS.boulderCopper;
    case 'pebble':
      return CLIFF_ASSETS.oresPebble;
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
};
