import type { GeoLocation } from '../games/geoGameConfig';
import {
  GEO_CITY_I18N,
  GEO_CONTINENT_I18N,
  GEO_COUNTRY_I18N,
  GEO_LOCATION_I18N,
} from './generated/geoLocationsI18n';
import { AppLocale, DEFAULT_LOCALE, GameContentLocale, getGameContentLocale } from './locales';

const getLocalizedField = (
  map: Record<string, Partial<Record<GameContentLocale, string>>>,
  ruValue: string,
  contentLocale: GameContentLocale
): string => {
  const localized = map[ruValue]?.[contentLocale];
  if (localized) {
    return localized;
  }

  if (contentLocale === 'ru') {
    return ruValue;
  }

  return map[ruValue]?.en ?? ruValue;
};

export const getGeoContinentLabel = (continentRu: string, locale: AppLocale): string => {
  const contentLocale = getGameContentLocale(locale);
  return getLocalizedField(GEO_CONTINENT_I18N, continentRu, contentLocale);
};

export const getGeoCountryLabel = (countryRu: string, locale: AppLocale): string => {
  const contentLocale = getGameContentLocale(locale);
  return getLocalizedField(GEO_COUNTRY_I18N, countryRu, contentLocale);
};

export const getGeoCityLabel = (cityRu: string, locale: AppLocale): string => {
  const contentLocale = getGameContentLocale(locale);
  return getLocalizedField(GEO_CITY_I18N, cityRu, contentLocale);
};

export const getGeoLocationName = (location: GeoLocation, locale: AppLocale): string => {
  const contentLocale = getGameContentLocale(locale);
  const localized = GEO_LOCATION_I18N[location.id]?.[contentLocale];
  if (localized?.name) {
    return localized.name;
  }

  if (contentLocale === 'ru') {
    return location.name;
  }

  return (
    GEO_LOCATION_I18N[location.id]?.en?.name ??
    `${getGeoCityLabel(location.city, locale)}, ${getGeoCountryLabel(location.country, locale)}`
  );
};

export const localizeGeoLocation = (location: GeoLocation, locale: AppLocale) => {
  const contentLocale = getGameContentLocale(locale);
  const localized = GEO_LOCATION_I18N[location.id]?.[contentLocale];

  if (contentLocale === 'ru' && !localized) {
    return {
      name: location.name,
      continent: location.continent,
      country: location.country,
      city: location.city,
    };
  }

  if (localized) {
    return {
      name: localized.name,
      continent: localized.continent,
      country: localized.country,
      city: localized.city,
    };
  }

  const fallback = GEO_LOCATION_I18N[location.id]?.en;
  if (fallback) {
    return fallback;
  }

  return {
    name: getGeoLocationName(location, locale),
    continent: getGeoContinentLabel(location.continent, locale),
    country: getGeoCountryLabel(location.country, locale),
    city: getGeoCityLabel(location.city, locale),
  };
};

export const resolveGeoLocale = (locale?: AppLocale | null): AppLocale => locale ?? DEFAULT_LOCALE;
