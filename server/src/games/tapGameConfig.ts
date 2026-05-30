export const TAP_INITIAL_TARGET = 5;
export const TAP_TARGET_MULTIPLIER = 3;
/** Доля от цели раунда, которую пара получает бонусом за его прохождение. */
export const TAP_ROUND_BONUS_TARGET_MULTIPLIER = 1.5;

export const getTapRoundCompletionBonus = (completedRound: number): number => {
  if (completedRound < 1) {
    return 0;
  }

  const roundTarget = TAP_INITIAL_TARGET * TAP_TARGET_MULTIPLIER ** (completedRound - 1);
  return Math.round(roundTarget * TAP_ROUND_BONUS_TARGET_MULTIPLIER);
};

export const TAP_BLOCKS = [
  {
    id: 'block-1',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967489/block1_jdjoy2.jpg',
    label: 'Блок 1',
    color: '#FF4B8D',
  },
  {
    id: 'block-2',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967489/block2_md8g24.jpg',
    label: 'Блок 2',
    color: '#FF8FAB',
  },
  {
    id: 'block-3',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967490/block3_kmhmec.png',
    label: 'Блок 3',
    color: '#FFB3C6',
  },
  {
    id: 'block-4',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967489/block4_vioqtl.jpg',
    label: 'Блок 4',
    color: '#C9184A',
  },
  {
    id: 'block-5',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967489/block5_wiy4jj.jpg',
    label: 'Блок 5',
    color: '#FF758F',
  },
  {
    id: 'block-6',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967490/block6_uja19v.jpg',
    label: 'Блок 6',
    color: '#F28482',
  },
  {
    id: 'block-7',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967490/block7_ax6mtt.jpg',
    label: 'Блок 7',
    color: '#E5989B',
  },
  {
    id: 'block-8',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967490/block8_ly9oam.jpg',
    label: 'Блок 8',
    color: '#FF4B8D',
  },
];

export interface TapShopItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  cost: number;
  multiplier: number;
  uses: number;
  /** Минимальный номер раунда, с которого предмет доступен в магазине. */
  minRound: number;
}

export const TAP_SHOP_ITEMS: TapShopItem[] = [
  {
    id: 'double_tap',
    name: 'Двойной тык',
    description: 'Следующие 5 нажатий засчитываются как ×2 балла.',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967132/double-touch-tikalka_z0fuun.jpg',
    cost: 30,
    multiplier: 2,
    uses: 5,
    minRound: 1,
  },
  {
    id: 'triple_tap',
    name: 'Четверной тык',
    description: 'Следующие 15 нажатий засчитываются как ×4 балла.',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967133/quadro-touch-tikalka_pxht7m.jpg',
    cost: 80,
    multiplier: 4,
    uses: 15,
    minRound: 6,
  },
  {
    id: 'mega_tap',
    name: 'Мега-тык',
    description: 'Следующие 15 нажатий засчитываются как ×10 баллов.',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967133/ten-touch-tikalka_twbh3g.jpg',
    cost: 200,
    multiplier: 10,
    uses: 15,
    minRound: 6,
  },
];

export const getTapShopItem = (itemId: string): TapShopItem | undefined =>
  TAP_SHOP_ITEMS.find((item) => item.id === itemId);
