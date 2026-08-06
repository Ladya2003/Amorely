/**
 * Primary front-end base URL for links in emails (verification, etc.).
 * Uses the first entry from CLIENT_URL (comma-separated list allowed).
 */
export const getPrimaryClientBaseUrl = (): string => {
  const clientUrl = process.env.CLIENT_URL?.trim();
  if (clientUrl) {
    const first = clientUrl.split(',')[0]?.trim();
    if (first) {
      try {
        const url = new URL(first);
        const basePath = (process.env.APP_BASE_PATH || '').replace(/\/$/, '');
        const pathPrefix = basePath && !url.pathname.startsWith(basePath) ? basePath : '';
        // Prefer origin + optional APP_BASE_PATH when CLIENT_URL is origin-only
        if (url.pathname === '/' || url.pathname === '') {
          return `${url.origin}${pathPrefix}`;
        }
        return `${url.origin}${url.pathname.replace(/\/$/, '')}`;
      } catch {
        return first.replace(/\/$/, '');
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  return 'https://amorely.love';
};
