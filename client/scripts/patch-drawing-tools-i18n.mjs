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
    fill: 'Заливка',
    color: 'Цвет',
    size: 'Размер: {{size}}px',
    colorAria: 'Цвет {{color}}',
    customColor: 'Свой цвет',
    undo: 'Назад',
    redo: 'Вперёд',
    clearAll: 'Стереть всё',
    clearAllConfirmTitle: 'Стереть весь рисунок?',
    clearAllConfirmBody: 'Все штрихи на холсте будут удалены. Это действие нельзя отменить.',
  },
  en: {
    tool: 'Tool',
    brush: 'Brush',
    eraser: 'Eraser',
    fill: 'Fill',
    color: 'Color',
    size: 'Size: {{size}}px',
    colorAria: 'Color {{color}}',
    customColor: 'Custom color',
    undo: 'Undo',
    redo: 'Redo',
    clearAll: 'Clear all',
    clearAllConfirmTitle: 'Clear the entire drawing?',
    clearAllConfirmBody: 'All strokes on the canvas will be removed. This action cannot be undone.',
  },
  es: {
    tool: 'Herramienta',
    brush: 'Pincel',
    eraser: 'Borrador',
    fill: 'Relleno',
    color: 'Color',
    size: 'Tamaño: {{size}}px',
    colorAria: 'Color {{color}}',
    customColor: 'Color personalizado',
    undo: 'Deshacer',
    redo: 'Rehacer',
    clearAll: 'Borrar todo',
    clearAllConfirmTitle: '¿Borrar todo el dibujo?',
    clearAllConfirmBody: 'Se eliminarán todos los trazos del lienzo. Esta acción no se puede deshacer.',
  },
  de: {
    tool: 'Werkzeug',
    brush: 'Pinsel',
    eraser: 'Radierer',
    fill: 'Füllen',
    color: 'Farbe',
    size: 'Größe: {{size}}px',
    colorAria: 'Farbe {{color}}',
    customColor: 'Eigene Farbe',
    undo: 'Rückgängig',
    redo: 'Wiederholen',
    clearAll: 'Alles löschen',
    clearAllConfirmTitle: 'Gesamte Zeichnung löschen?',
    clearAllConfirmBody: 'Alle Striche auf der Leinwand werden entfernt. Diese Aktion kann nicht rückgängig gemacht werden.',
  },
  fr: {
    tool: 'Outil',
    brush: 'Pinceau',
    eraser: 'Gomme',
    fill: 'Remplissage',
    color: 'Couleur',
    size: 'Taille : {{size}}px',
    colorAria: 'Couleur {{color}}',
    customColor: 'Couleur personnalisée',
    undo: 'Annuler',
    redo: 'Rétablir',
    clearAll: 'Tout effacer',
    clearAllConfirmTitle: 'Effacer tout le dessin ?',
    clearAllConfirmBody: 'Tous les traits sur le canvas seront supprimés. Cette action est irréversible.',
  },
  pt: {
    tool: 'Ferramenta',
    brush: 'Pincel',
    eraser: 'Borracha',
    fill: 'Preencher',
    color: 'Cor',
    size: 'Tamanho: {{size}}px',
    colorAria: 'Cor {{color}}',
    customColor: 'Cor personalizada',
    undo: 'Desfazer',
    redo: 'Refazer',
    clearAll: 'Apagar tudo',
    clearAllConfirmTitle: 'Apagar todo o desenho?',
    clearAllConfirmBody: 'Todos os traços no canvas serão removidos. Esta ação não pode ser desfeita.',
  },
  uk: {
    tool: 'Інструмент',
    brush: 'Пензель',
    eraser: 'Гумка',
    fill: 'Заливка',
    color: 'Колір',
    size: 'Розмір: {{size}}px',
    colorAria: 'Колір {{color}}',
    customColor: 'Свій колір',
    undo: 'Назад',
    redo: 'Вперед',
    clearAll: 'Стерти все',
    clearAllConfirmTitle: 'Стерти весь малюнок?',
    clearAllConfirmBody: 'Усі штрихи на полотні буде видалено. Цю дію не можна скасувати.',
  },
};

for (const locale of Object.keys(drawingTools)) {
  const filePath = path.join(localesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  data.drawingTools = drawingTools[locale];
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Updated ${locale}.json`);
}
