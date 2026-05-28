/** Текст для страницы правил игры (на самой карте блок скрыт) */
export const GEO_MAP_ATTRIBUTION =
  'Карта: © OpenStreetMap contributors, © CARTO';

export const GEO_MAP_TILES = {
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  },
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  },
} as const;

export type GeoMapTileStyle = keyof typeof GEO_MAP_TILES;

/** Переключите на 'positron' для светлой минималистичной карты */
export const ACTIVE_GEO_MAP_STYLE: GeoMapTileStyle = 'voyager';
