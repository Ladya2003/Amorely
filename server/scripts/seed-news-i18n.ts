/**
 * Adds English (and other) translations to main seeded news articles.
 * Run: npx ts-node scripts/seed-news-i18n.ts
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import News from '../src/models/news';
import { normalizeNewsTranslations, syncLegacyNewsFields } from '../src/i18n/newsContent';

dotenv.config();

const NEWS_I18N_BY_RU_TITLE: Record<
  string,
  {
    en: { title: string; content: string };
    es?: { title: string; content: string };
    de?: { title: string; content: string };
    fr?: { title: string; content: string };
    pt?: { title: string; content: string };
    uk?: { title: string; content: string };
  }
> = {
  'Игры для пар уже в Amorely!': {
    en: {
      title: 'Couple games are now in Amorely!',
      content: `We've added a Games section in chat — four activities you can play with your partner, earn points, and climb the couples leaderboard.

• Tap Together — tap the block together and complete rounds
• Guess the Location — mark on the map where the place in the photo is
• Guess the Drawing — one draws, the other guesses
• Your Own Game — a category board with questions, like a TV quiz show

Open Chat → Games tab and pick where to start!`,
    },
    es: {
      title: '¡Los juegos para parejas ya están en Amorely!',
      content: `Hemos añadido la sección «Juegos» en el chat: cuatro actividades para jugar en pareja, ganar puntos y subir en el ranking.

• Tap juntos — tocad el bloque juntos y completad rondas
• Adivina la ubicación — marcáis en el mapa dónde está el lugar de la foto
• Adivina el dibujo — uno dibuja, el otro adivina
• Tu propio juego — tablero con categorías y preguntas, como un concurso de TV

¡Abrid Chat → Juegos y elegid por dónde empezar!`,
    },
    uk: {
      title: 'Ігри для пар уже в Amorely!',
      content: `Ми додали розділ «Ігри» в чаті — чотири активності, які можна проходити разом із партнером, заробляти очки та потрапляти в рейтинг пар.

• Тицялка — тисніть на блок разом і проходьте раунди
• Вгадай локацію — відмітьте на карті, де знаходиться місце на фото
• Вгадай малюнок — один малює, інший вгадує
• Своя гра — поле з категоріями та питаннями, як у телевікторині

Відкрийте Чат → вкладку «Ігри» та оберіть, з чого почати!`,
    },
  },
  'Добавьте Amorely на главный экран': {
    en: {
      title: 'Add Amorely to your home screen',
      content: `We recommend installing Amorely on your home screen — the interface is more convenient there, the app opens in one tap, and we won't lose touch with each other :)

Below is a step-by-step guide for iPhone in Safari. In Chrome, Firefox, and on Android the steps are similar: use Share or the browser menu and choose "Add to Home Screen" or "Install app".`,
    },
    es: {
      title: 'Añade Amorely a la pantalla de inicio',
      content: `Recomendamos instalar Amorely en la pantalla de inicio: la interfaz es más cómoda, la app se abre con un toque y no nos perderemos :)

Abajo hay una guía paso a paso para iPhone en Safari. En Chrome, Firefox y Android los pasos son similares: Compartir o el menú del navegador → «Añadir a pantalla de inicio» o «Instalar aplicación».`,
    },
    uk: {
      title: 'Додайте Amorely на головний екран',
      content: `Рекомендуємо встановити Amorely на домашній екран — інтерфейс там зручніший, застосунок відкривається одним дотиком, і ми точно не загубимось один без одного :)

Нижче покрокова інструкція для iPhone в Safari. У Chrome, Firefox та на Android кроки схожі: через «Поділитися» або меню браузера оберіть «На екран Додому» або «Встановити застосунок».`,
    },
  },
  'Бета-тестирование Amorely — приглашаем попробовать!': {
    en: {
      title: 'Amorely beta — we invite you to try it!',
      content: `Amorely is currently in beta. We're actively improving the app and would love you to try it: chat, calendar, feed, and other features.

If something is inconvenient, doesn't work, or you'd like to change or add something — message me in Chat. You can find me via chat search at vlad@gmail.com.

Thank you for helping us make Amorely better for couples!`,
    },
    es: {
      title: 'Beta de Amorely — ¡te invitamos a probarla!',
      content: `Amorely está en fase beta. Seguimos mejorando la app y nos encantaría que la probaras: chat, calendario, feed y más.

Si algo no te convence, no funciona o quieres cambiar o añadir algo — escríbeme en Chat. Puedes encontrarme en la búsqueda del chat: vlad@gmail.com.

¡Gracias por ayudarnos a hacer Amorely mejor para las parejas!`,
    },
    uk: {
      title: 'Бета-тестування Amorely — запрошуємо спробувати!',
      content: `Amorely зараз у режимі бета-тестування. Ми активно доопрацьовуємо застосунок і будемо раді, якщо ви його спробуєте: чат, календар, стрічку та інші функції.

Якщо щось незручно, не працює або хочеться щось змінити чи додати — напишіть мені в Чат. Мене можна знайти через пошук у чаті за адресою vlad@gmail.com.

Дякуємо, що допомагаєте нам робити Amorely кращим для пар!`,
    },
  },
};

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/amorely';
  await mongoose.connect(uri);

  let updated = 0;

  for (const item of await News.find()) {
    const translations = normalizeNewsTranslations(item);
    const ruTitle = translations.ru?.title?.trim() || item.title?.trim() || '';
    const pack = NEWS_I18N_BY_RU_TITLE[ruTitle];
    if (!pack) {
      continue;
    }

    const nextTranslations = {
      ...translations,
      ...Object.fromEntries(
        Object.entries(pack).map(([locale, value]) => [locale, value])
      ),
    };

    item.set('translations', nextTranslations);
    syncLegacyNewsFields(item);
    await item.save();
    updated += 1;
    console.log('Updated:', ruTitle);
  }

  console.log(`Done. Updated ${updated} articles.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
