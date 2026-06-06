import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/locales');
const LOCALES = ['ru', 'en', 'es', 'de', 'fr', 'pt', 'uk'];

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (isPlainObject(source[key]) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key], source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

const news = {
  ru: {
    title: 'Новости',
    empty: 'Новости не найдены',
    readMore: 'Читать полностью',
    newBadge: 'NEW',
    filter: {
      all: 'Все',
      updates: 'Обновления',
      events: 'События',
      announcements: 'Анонсы',
      byCategory: 'Фильтр по категориям:',
    },
    categories: {
      update: 'Обновление',
      event: 'Событие',
      announcement: 'Анонс',
    },
    aria: {
      back: 'Назад',
      categoryFilter: 'Фильтр категорий новостей',
      allCategories: 'Все категории',
      announcements: 'Анонсы',
      events: 'События',
      updates: 'Обновления',
    },
    errors: {
      loadFailed: 'Не удалось загрузить новости',
    },
  },
  en: {
    title: 'News',
    empty: 'No news found',
    readMore: 'Read more',
    newBadge: 'NEW',
    filter: {
      all: 'All',
      updates: 'Updates',
      events: 'Events',
      announcements: 'Announcements',
      byCategory: 'Filter by category:',
    },
    categories: {
      update: 'Update',
      event: 'Event',
      announcement: 'Announcement',
    },
    aria: {
      back: 'Back',
      categoryFilter: 'News category filter',
      allCategories: 'All categories',
      announcements: 'Announcements',
      events: 'Events',
      updates: 'Updates',
    },
    errors: {
      loadFailed: 'Could not load news',
    },
  },
  es: {
    title: 'Noticias',
    empty: 'No se encontraron noticias',
    readMore: 'Leer más',
    newBadge: 'NUEVO',
    filter: {
      all: 'Todas',
      updates: 'Actualizaciones',
      events: 'Eventos',
      announcements: 'Anuncios',
      byCategory: 'Filtrar por categoría:',
    },
    categories: {
      update: 'Actualización',
      event: 'Evento',
      announcement: 'Anuncio',
    },
    aria: {
      back: 'Atrás',
      categoryFilter: 'Filtro de categorías de noticias',
      allCategories: 'Todas las categorías',
      announcements: 'Anuncios',
      events: 'Eventos',
      updates: 'Actualizaciones',
    },
    errors: {
      loadFailed: 'No se pudieron cargar las noticias',
    },
  },
  de: {
    title: 'Neuigkeiten',
    empty: 'Keine Neuigkeiten gefunden',
    readMore: 'Mehr lesen',
    newBadge: 'NEU',
    filter: {
      all: 'Alle',
      updates: 'Updates',
      events: 'Ereignisse',
      announcements: 'Ankündigungen',
      byCategory: 'Nach Kategorie filtern:',
    },
    categories: {
      update: 'Update',
      event: 'Ereignis',
      announcement: 'Ankündigung',
    },
    aria: {
      back: 'Zurück',
      categoryFilter: 'Nachrichtenkategorien filtern',
      allCategories: 'Alle Kategorien',
      announcements: 'Ankündigungen',
      events: 'Ereignisse',
      updates: 'Updates',
    },
    errors: {
      loadFailed: 'Neuigkeiten konnten nicht geladen werden',
    },
  },
  fr: {
    title: 'Actualités',
    empty: 'Aucune actualité trouvée',
    readMore: 'Lire la suite',
    newBadge: 'NOUVEAU',
    filter: {
      all: 'Toutes',
      updates: 'Mises à jour',
      events: 'Événements',
      announcements: 'Annonces',
      byCategory: 'Filtrer par catégorie :',
    },
    categories: {
      update: 'Mise à jour',
      event: 'Événement',
      announcement: 'Annonce',
    },
    aria: {
      back: 'Retour',
      categoryFilter: 'Filtre des catégories d\'actualités',
      allCategories: 'Toutes les catégories',
      announcements: 'Annonces',
      events: 'Événements',
      updates: 'Mises à jour',
    },
    errors: {
      loadFailed: 'Impossible de charger les actualités',
    },
  },
  pt: {
    title: 'Notícias',
    empty: 'Nenhuma notícia encontrada',
    readMore: 'Ler mais',
    newBadge: 'NOVO',
    filter: {
      all: 'Todas',
      updates: 'Atualizações',
      events: 'Eventos',
      announcements: 'Anúncios',
      byCategory: 'Filtrar por categoria:',
    },
    categories: {
      update: 'Atualização',
      event: 'Evento',
      announcement: 'Anúncio',
    },
    aria: {
      back: 'Voltar',
      categoryFilter: 'Filtro de categorias de notícias',
      allCategories: 'Todas as categorias',
      announcements: 'Anúncios',
      events: 'Eventos',
      updates: 'Atualizações',
    },
    errors: {
      loadFailed: 'Não foi possível carregar as notícias',
    },
  },
  uk: {
    title: 'Новини',
    empty: 'Новини не знайдено',
    readMore: 'Читати повністю',
    newBadge: 'NEW',
    filter: {
      all: 'Усі',
      updates: 'Оновлення',
      events: 'Події',
      announcements: 'Анонси',
      byCategory: 'Фільтр за категоріями:',
    },
    categories: {
      update: 'Оновлення',
      event: 'Подія',
      announcement: 'Анонс',
    },
    aria: {
      back: 'Назад',
      categoryFilter: 'Фільтр категорій новин',
      allCategories: 'Усі категорії',
      announcements: 'Анонси',
      events: 'Події',
      updates: 'Оновлення',
    },
    errors: {
      loadFailed: 'Не вдалося завантажити новини',
    },
  },
};

for (const locale of LOCALES) {
  const filePath = path.join(localesDir, `${locale}.json`);
  const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const merged = deepMerge(existing, { news: news[locale] });
  fs.writeFileSync(filePath, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`Patched ${locale}.json`);
}

console.log('Done.');
