/**
 * Dev-only: serve public/{lang}/index.html for /en, /uk, … so Ctrl+U matches
 * production locale landings (CRA SPA fallback would otherwise return root HTML).
 */
const fs = require('fs');
const path = require('path');

const LANDING_LOCALES = ['en', 'ru', 'uk', 'de', 'es', 'fr', 'pt'];

module.exports = function setupProxy(app) {
  for (const lang of LANDING_LOCALES) {
    const filePath = path.join(__dirname, '..', 'public', lang, 'index.html');
    const handler = (_req, res, next) => {
      if (!fs.existsSync(filePath)) {
        next();
        return;
      }
      res.setHeader('Cache-Control', 'no-store');
      res.sendFile(filePath);
    };
    app.get(`/${lang}`, handler);
    app.get(`/${lang}/`, handler);
  }
};
