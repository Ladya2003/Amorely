const STORAGE_VERSION = 1;

export const getKaifLifeGroupCollapseKey = (userId: string): string =>
  `amorely.kaifLife.groupExpanded.v${STORAGE_VERSION}.${userId}`;

export type KaifLifeGroupExpandedMap = Record<string, boolean>;

export const readKaifLifeGroupExpanded = (userId: string): KaifLifeGroupExpandedMap => {
  try {
    const raw = localStorage.getItem(getKaifLifeGroupCollapseKey(userId));
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as KaifLifeGroupExpandedMap;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return Object.entries(parsed).reduce<KaifLifeGroupExpandedMap>((acc, [groupId, expanded]) => {
      if (typeof expanded === 'boolean') {
        acc[groupId] = expanded;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
};

export const writeKaifLifeGroupExpanded = (userId: string, map: KaifLifeGroupExpandedMap) => {
  localStorage.setItem(getKaifLifeGroupCollapseKey(userId), JSON.stringify(map));
};

export const isKaifLifeGroupExpanded = (map: KaifLifeGroupExpandedMap, groupId: string): boolean =>
  map[groupId] !== false;
