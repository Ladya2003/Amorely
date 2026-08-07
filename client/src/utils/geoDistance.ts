export const haversineDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistanceKm = (distanceKm: number): string => {
  if (distanceKm >= 100) {
    return String(Math.round(distanceKm));
  }

  const rounded = Math.round(distanceKm * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

export const isGeolocationSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  'geolocation' in navigator &&
  window.isSecureContext;

export const requestCurrentPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('unsupported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60_000,
    });
  });

export type GeolocationErrorCode = 'unsupported' | 'denied' | 'unavailable' | 'timeout' | 'unknown';

export const mapGeolocationError = (error: unknown): GeolocationErrorCode => {
  if (error instanceof GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
      return 'denied';
    }
    if (error.code === error.TIMEOUT) {
      return 'timeout';
    }
    if (error.code === error.POSITION_UNAVAILABLE) {
      return 'unavailable';
    }
  }

  if (error instanceof Error && error.message === 'unsupported') {
    return 'unsupported';
  }

  return 'unknown';
};
