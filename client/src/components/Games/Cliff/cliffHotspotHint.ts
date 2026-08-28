export type CliffHubHotspot = 'shop' | 'mine' | 'gate' | 'plate';

type HotspotHintMap = Record<CliffHubHotspot, boolean>;

const ALL_HINTS_ON: HotspotHintMap = {
  shop: true,
  mine: true,
  gate: true,
  plate: true,
};

const storageKey = (userId: string) => `amorely.cliff.hotspotHint.${userId}`;

export const readCliffHotspotHints = (userId: string): HotspotHintMap => {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return { ...ALL_HINTS_ON };
    }
    const parsed = JSON.parse(raw) as Partial<HotspotHintMap>;
    return {
      shop: parsed.shop !== false,
      mine: parsed.mine !== false,
      gate: parsed.gate !== false,
      plate: parsed.plate !== false,
    };
  } catch {
    return { ...ALL_HINTS_ON };
  }
};

export const dismissCliffHotspotHint = (userId: string, id: CliffHubHotspot): HotspotHintMap => {
  const next = { ...readCliffHotspotHints(userId), [id]: false };
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
  return next;
};
