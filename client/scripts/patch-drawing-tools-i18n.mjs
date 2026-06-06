import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/locales');

const drawingTools = {
  ru: {
    tool: 'Инструмент',
    brush: 'Кисть',
    eraser: 'Ластик',
    color: 'Цвет',
    size: 'Размер: {{size}}px',
    colorAria: 'Цвет {{color}}',
    customColor: 'Свой цвет',
    clearAll: 'Стереть всё',
  },
  en: {
    tool: 'Tool',
    brush: 'Brush',
    eraser: 'Eraser',
    color: 'Color',
    size: 'Size: {{size}}px',
    colorAria: 'Color {{color}}',
    customColor: 'Custom color',
    clearAll: 'Clear all',
  },
  es: {
    tool: 'Herramienta',
    brush: 'Pincel',
    eraser: 'Borrador',
    color: 'Color',
    size: 'Tamaño: {{size}}px',
    colorAria: 'Color {{color}}',
    customColor: 'Color personalizado',
    clearAll: 'Borrar todo',
  },
  de: {
    tool: 'Werkzeug',
    brush: 'Pinsel',
    eraser: 'Radierer',
    color: 'Farbe',
    size: 'Größe: {{size}}px',
    colorAria: 'Farbe {{color}}',
    customColor: 'Eigene Farbe',
    clearAll: 'Alles löschen',
  },
  fr: {
    tool: 'Outil',
    brush: 'Pinceau',
    eraser: 'Gomme',
    color: 'Couleur',
    size: 'Taille : {{size}}px',
    colorAria: 'Couleur {{color}}',
    customColor: 'Couleur personnalisée',
    clearAll: 'Tout effacer',
  },
  pt: {
    tool: 'Ferramenta',
    brush: 'Pincel',
    eraser: 'Borracha',
    color: 'Cor',
    size: 'Tamanho: {{size}}px',
    colorAria: 'Cor {{color}}',
    customColor: 'Cor personalizada',
    clearAll: 'Apagar tudo',
  },
  uk: {
    tool: 'Інструмент',
    brush: 'Пензель',
    eraser: 'Гумка',
    color: 'Колір',
    size: 'Розмір: {{size}}px',
    colorAria: 'Колір {{color}}',
    customColor: 'Свій колір',
    clearAll: 'Стерти все',
  },
};

for (const locale of Object.keys(drawingTools)) {
  const filePath = path.join(localesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  data.drawingTools = drawingTools[locale];
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Updated ${locale}.json`);
}
