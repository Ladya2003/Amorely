import type { TFunction } from 'i18next';
import { GEO_MAP_ATTRIBUTION, GEO_PHOTOS_ATTRIBUTION } from '../config/geoMapTiles';

export const formatGameWaitDuration = (t: TFunction, seconds: number): string => {
  if (seconds <= 0) {
    return t('games.waitDuration.soon');
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return t('games.waitDuration.hoursMinutes', { hours, minutes });
  }
  if (minutes > 0) {
    return t('games.waitDuration.minutes', { minutes });
  }
  return t('games.waitDuration.lessThanMinute');
};

export const getGameRules = (t: TFunction, gameId: string, fallbackRules: string[]): string[] => {
  const translated = t(`games.${gameId}.rules`, { returnObjects: true, defaultValue: [] });
  if (Array.isArray(translated) && translated.length > 0) {
    return translated as string[];
  }
  return fallbackRules;
};

export const getGeoAttributionRules = (t: TFunction): string[] => [
  t('games.geo.mapAttribution', { defaultValue: GEO_MAP_ATTRIBUTION }),
  t('games.geo.photosAttribution', { defaultValue: GEO_PHOTOS_ATTRIBUTION }),
];

export const getLocalizedGameName = (t: TFunction, gameId: string, fallback?: string): string =>
  t(`games.${gameId}.name`, { defaultValue: fallback ?? gameId });
