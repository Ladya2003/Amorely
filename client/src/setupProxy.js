/**
 * Dev-only: serve public/{lang}/index.html for /en, /uk, … so Ctrl+U matches
 * production locale landings (CRA SPA fallback would otherwise return root HTML).
 */
const fs = require('fs');
const path = require('path');

const LANDING_LOCALES = ['en', 'ru', 'uk', 'de', 'es', 'fr', 'pt'];

module.exports = function setupProxy(app) {
  // Google Identity Services popup needs COOP that still allows opener communication.
  // FedCM avoids most of this; the header is a belt-and-suspenders for local CRA.
  app.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  for (const lang of LANDING_LOCALES) {
    const filePath = path.join(__dirname, '..', 'public', lang, 'index.html');
    const handler = (_req, res, next) => {
      if (!fs.existsSync(filePath)) {
        next();
        return;
      }
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
      res.sendFile(filePath);
    };
    app.get(`/${lang}`, handler);
    app.get(`/${lang}/`, handler);
  }
};
