/** Текст для страницы правил игры (на самой карте блок скрыт) */
export const GEO_MAP_ATTRIBUTION = 'Карта: © Esri, © OpenStreetMap contributors';

export const GEO_PHOTOS_ATTRIBUTION =
  'Фотографии: Wikimedia Commons (лицензии Creative Commons)';

export const GEO_MAP_TILES = {
  streets: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  },
} as const;

export type GeoMapTileStyle = keyof typeof GEO_MAP_TILES;

export const ACTIVE_GEO_MAP_STYLE: GeoMapTileStyle = 'streets';
