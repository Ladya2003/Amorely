export const HOME_SCREEN_NEWS_QUERY = 'home-screen';

const HOME_SCREEN_NEWS_TITLES = new Set([
  'Добавьте Amorely на главный экран',
  'Add Amorely to your home screen',
  'Añade Amorely a la pantalla de inicio',
  'Додайте Amorely на головний екран',
]);

export const isHomeScreenNewsItem = (title: string) =>
  HOME_SCREEN_NEWS_TITLES.has(title.trim());

export const getHomeScreenNewsPath = () => `/news?article=${HOME_SCREEN_NEWS_QUERY}`;
