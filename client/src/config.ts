const stripTrailingSlash = (url: string) => url.replace(/\/$/, '');

// Базовый URL для API (Render)
export const API_URL = stripTrailingSlash(
  process.env.REACT_APP_API_URL || 'http://localhost:8082'
); 