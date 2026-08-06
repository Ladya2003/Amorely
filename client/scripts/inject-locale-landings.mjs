/**
 * After CRA build: clone build/index.html into build/{lang}/index.html
 * with locale-specific meta, JSON-LD, and SEO bootstrap (for GitHub Pages Ctrl+U).
 *
 * Usage: node scripts/inject-locale-landings.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, '..');
const buildDir = path.join(clientRoot, 'build');
const payloadsPath = path.join(__dirname, 'seo-locale-payloads.json');

const replaceBetween = (source, startMark, endMark, replacement) => {
  const start = source.indexOf(startMark);
  const end = source.indexOf(endMark);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Missing markers ${startMark} / ${endMark}`);
  }
  return (
    source.slice(0, start + startMark.length) +
    '\n' +
    replacement +
    '\n    ' +
    source.slice(end)
  );
};

if (!fs.existsSync(buildDir)) {
  throw new Error('build/ not found — run react-scripts build first');
}
if (!fs.existsSync(payloadsPath)) {
  throw new Error('seo-locale-payloads.json missing — run seo:landing first');
}

const rootHtml = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');
const payloads = JSON.parse(fs.readFileSync(payloadsPath, 'utf8'));

for (const [lang, payload] of Object.entries(payloads)) {
  let html = rootHtml;
  html = html.replace(/<html\s+lang="[^"]*"/i, `<html lang="${payload.htmlLang}"`);
  // <!--! ... --> survives CRA html-minifier (removeComments keeps /^!/ comments)
  html = replaceBetween(html, '<!--! SEO_META_START -->', '<!--! SEO_META_END -->', payload.metaHtml);
  html = replaceBetween(
    html,
    '<!--! SEO_JSONLD_START -->',
    '<!--! SEO_JSONLD_END -->',
    payload.jsonLdHtml
  );
  html = replaceBetween(
    html,
    '<!--! SEO_BOOTSTRAP_START -->',
    '<!--! SEO_BOOTSTRAP_END -->',
    payload.bootstrapHtml
  );

  const outDir = path.join(buildDir, lang);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  console.log(`Wrote build/${lang}/index.html`);
}

console.log(`Injected locale landings: ${Object.keys(payloads).join(', ')}`);
