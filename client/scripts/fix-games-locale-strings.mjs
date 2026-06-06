import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/locales');

const fixes = {
  ru: {
    list: {
      searchPlaceholder: 'Поиск по названию игры',
      notFound: 'Игры не найдены',
      emptyList: 'Нет игр в списке',
      emptyHint: 'Здесь будет список игр для вас и вашей пары',
      tryDifferentQuery: 'Попробуйте изменить запрос',
    },
    page: {
      comingSoon: 'Игра скоро появится',
      addPartner: 'Добавьте партнёра в настройках, чтобы играть вместе',
      leaderboardSubtitle: 'Глобальный рейтинг пар по общему счёту',
      geoDailyLimitHint: 'Сегодня вы угадали все {{count}} мест. Новые раунды откроются позже.',
    },
    common: {
      waitingPartner: 'Ждём партнёра…',
      readyToPlay: 'Готовы к игре?',
      startingSoon: 'Скоро начнём!',
      bothReady: 'Оба партнёра готовы — раунд начнётся одновременно.',
      pressReady: 'Нажмите «Готов», когда будете на месте. Раунд стартует, когда оба готовы.',
      partnerRequired: 'Для игры нужен партнёр. Добавьте его в настройках профиля.',
      playMore: 'Играть дальше',
      drawWord: 'нарисуй',
    },
    leaderboard: { empty: 'Пока никто не играл' },
    badge: { tooltip: 'Топ-{{rank}} · {{game}}' },
    dailyReset: {
      title: 'Таймер сброса',
      playedTodayNamed: 'Вы уже играли в «{{gameName}}» сегодня. ',
      playedTodayGeneric: 'Вы уже играли в эту игру сегодня. ',
      timerHint: 'Таймер показывает, сколько осталось до обновления дневного лимита.',
      resetHint: 'Лимит сбрасывается в 03:00 по Москве (00:00 UTC). После этого можно снова играть.',
      untilReset: 'До сброса:',
      badgeAria: 'Подробнее о таймере сброса',
    },
    geoDailyLimit: {
      title: 'На сегодня всё',
      body: 'Каждый день можно угадать не больше {{count}} мест. Вы уже прошли все раунды на сегодня.',
      nextAvailable: 'Следующие места будут доступны через',
    },
  },
  en: {
    list: {
      searchPlaceholder: 'Search by game name',
      notFound: 'No games found',
      emptyList: 'No games in the list',
      emptyHint: 'Games for you and your partner will appear here',
      tryDifferentQuery: 'Try a different search',
    },
    page: {
      comingSoon: 'This game is coming soon',
      addPartner: 'Add your partner in settings to play together',
      leaderboardSubtitle: 'Global couple leaderboard by total score',
      geoDailyLimitHint: 'You guessed all {{count}} places today. New rounds will open later.',
    },
    common: {
      waitingPartner: 'Waiting for partner…',
      readyToPlay: 'Ready to play?',
      startingSoon: 'Starting soon!',
      bothReady: 'Both partners are ready — the round will start at the same time.',
      pressReady: 'Press Ready when you are set. The round starts when both are ready.',
      partnerRequired: 'You need a partner to play. Add them in profile settings.',
      playMore: 'Keep playing',
      drawWord: 'draw',
    },
    leaderboard: { empty: 'No one has played yet' },
    badge: { tooltip: 'Top-{{rank}} · {{game}}' },
    dailyReset: {
      title: 'Reset timer',
      playedTodayNamed: 'You already played «{{gameName}}» today. ',
      playedTodayGeneric: 'You already played this game today. ',
      timerHint: 'The timer shows how long until the daily limit resets.',
      resetHint: 'The limit resets at 03:00 Moscow time (00:00 UTC). You can play again after that.',
      untilReset: 'Until reset:',
      badgeAria: 'More about the reset timer',
    },
    geoDailyLimit: {
      title: 'All done for today',
      body: 'You can guess up to {{count}} places per day. You have completed all rounds for today.',
      nextAvailable: 'New places will be available in',
    },
  },
};

const langs = ['ru', 'en', 'es', 'de', 'fr', 'pt', 'uk'];

for (const lang of langs) {
  const filePath = path.join(localesDir, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const patch = fixes[lang] ?? fixes.en;
  Object.assign(data.games.list, patch.list);
  Object.assign(data.games.page, patch.page);
  Object.assign(data.games.common, patch.common);
  data.games.leaderboard = { ...data.games.leaderboard, ...patch.leaderboard };
  data.games.badge = { ...data.games.badge, ...patch.badge };
  Object.assign(data.games.dailyReset, patch.dailyReset);
  Object.assign(data.games.geoDailyLimit, patch.geoDailyLimit);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Fixed ${lang}.json`);
}
