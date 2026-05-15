/**
 * Разрешённые Origin для CORS / Socket.io.
 * Браузер в Origin не передаёт путь — только scheme + host (+ port).
 * CLIENT_URL может быть с путём (GitHub Pages: …/Amorely) — используем origin.
 */
export const getAllowedOrigins = (): string[] => {
  const origins = new Set<string>();

  const clientUrl = process.env.CLIENT_URL?.trim();
  if (clientUrl) {
    try {
      origins.add(new URL(clientUrl).origin);
    } catch {
      origins.add(clientUrl.replace(/\/$/, ''));
    }
  }

  if (process.env.NODE_ENV === 'development') {
    origins.add('http://localhost:3000');
    origins.add('http://localhost:3005');
  }

  return Array.from(origins);
};

export const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) {
    return true;
  }
  return getAllowedOrigins().includes(origin);
};
