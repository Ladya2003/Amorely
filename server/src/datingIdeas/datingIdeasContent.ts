import { AppLocale, DEFAULT_LOCALE } from '../i18n/locales';

export type DatingIdeaLocalized = {
  title: string;
  description: string;
};

export type DatingIdeaDefinition = {
  id: string;
  emoji: string;
  locales: Partial<Record<AppLocale, DatingIdeaLocalized>> & { ru: DatingIdeaLocalized; en: DatingIdeaLocalized };
};

export const DATING_IDEA_COST = 1;

/** Catalog of dating ideas. Base copy is Russian + English; other locales fall back to en/ru. */
export const DATING_IDEAS: DatingIdeaDefinition[] = [
  {
    id: 'picnic_sunset',
    emoji: '🧺',
    locales: {
      ru: { title: 'Пикник на закате', description: 'Соберите корзину с любимыми закусками, плед и найдите место с красивым закатом. Без телефонов — только вы двое.' },
      en: { title: 'Sunset picnic', description: 'Pack a basket with favorite snacks, a blanket, and find a spot with a beautiful sunset. No phones — just the two of you.' },
      uk: { title: 'Пікнік на заході сонця', description: 'Зберіть кошик з улюбленими закусками, плед і знайдіть місце з гарним заходом сонця. Без телефонів — лише ви двоє.' },
      es: { title: 'Picnic al atardecer', description: 'Preparen una cesta con snacks favoritos, una manta y busquen un lugar con un atardecer hermoso. Sin teléfonos — solo ustedes dos.' },
      de: { title: 'Picknick bei Sonnenuntergang', description: 'Packt einen Korb mit Lieblingssnacks, eine Decke und findet einen Platz mit schönem Sonnenuntergang. Ohne Handys — nur ihr zwei.' },
      fr: { title: 'Pique-nique au coucher du soleil', description: 'Préparez un panier avec vos snacks préférés, une couverture et trouvez un endroit avec un beau coucher de soleil. Sans téléphones — juste vous deux.' },
      pt: { title: 'Piquenique ao pôr do sol', description: 'Preparem uma cesta com petiscos favoritos, um cobertor e encontrem um lugar com um belo pôr do sol. Sem celulares — só vocês dois.' },
    },
  },
  {
    id: 'home_cooking',
    emoji: '👨‍🍳',
    locales: {
      ru: { title: 'Готовим вместе дома', description: 'Выберите новый рецепт, купите продукты вместе и приготовьте ужин в четыре руки. Потом ужин при свечах.' },
      en: { title: 'Cook together at home', description: 'Pick a new recipe, shop for ingredients together, and cook dinner side by side. Finish with a candlelit meal.' },
      uk: { title: 'Готуємо разом вдома', description: 'Оберіть новий рецепт, купіть продукти разом і приготуйте вечерю в чотири руки. Потім вечеря при свічках.' },
    },
  },
  {
    id: 'night_walk',
    emoji: '🌙',
    locales: {
      ru: { title: 'Ночная прогулка', description: 'Выйдите вечером без плана — просто гуляйте по знакомым улицам, разговаривайте и смотрите на огни города.' },
      en: { title: 'Night walk', description: 'Go out in the evening with no plan — wander familiar streets, talk, and watch the city lights.' },
      uk: { title: 'Нічна прогулянка', description: 'Вийдіть увечері без плану — просто гуляйте знайомими вулицями, розмовляйте і дивіться на вогні міста.' },
    },
  },
  {
    id: 'museum_date',
    emoji: '🖼️',
    locales: {
      ru: { title: 'Дата в музее или галерее', description: 'Выберите выставку, которую ещё не видели. После — обсудите любимые работы за кофе.' },
      en: { title: 'Museum or gallery date', description: 'Pick an exhibition you haven’t seen yet. Afterwards, talk about your favorite pieces over coffee.' },
    },
  },
  {
    id: 'board_games',
    emoji: '🎲',
    locales: {
      ru: { title: 'Вечер настольных игр', description: 'Устройте домашний турнир: две-три любимые игры, снеки и немного здоровой конкуренции.' },
      en: { title: 'Board game night', description: 'Host a home tournament: two or three favorite games, snacks, and a bit of friendly competition.' },
    },
  },
  {
    id: 'photo_quest',
    emoji: '📷',
    locales: {
      ru: { title: 'Фото-квест по городу', description: 'Составьте список из 8 мест или объектов и найдите их вместе, делая по кадру на каждом.' },
      en: { title: 'City photo quest', description: 'Make a list of 8 places or objects and find them together, taking a shot at each one.' },
    },
  },
  {
    id: 'breakfast_in_bed',
    emoji: '🥐',
    locales: {
      ru: { title: 'Завтрак в постель', description: 'Один готовит сюрприз-завтрак, пока второй ещё спит. Потом ленивое утро без спешки.' },
      en: { title: 'Breakfast in bed', description: 'One prepares a surprise breakfast while the other is still asleep. Then enjoy a slow morning.' },
    },
  },
  {
    id: 'stargazing',
    emoji: '✨',
    locales: {
      ru: { title: 'Смотрим на звёзды', description: 'Уезжайте чуть за город или найдите тёмную крышу/парк. Возьмите плед и тёплый чай.' },
      en: { title: 'Stargazing', description: 'Head a bit outside the city or find a dark rooftop/park. Bring a blanket and warm tea.' },
    },
  },
  {
    id: 'thrift_challenge',
    emoji: '🛍️',
    locales: {
      ru: { title: 'Челендж секонд-хенда', description: 'У каждого бюджет 500–1000. Найдите друг другу образ и устройте мини-показ дома.' },
      en: { title: 'Thrift shop challenge', description: 'Each gets a small budget. Find an outfit for each other and host a mini fashion show at home.' },
    },
  },
  {
    id: 'cinema_home',
    emoji: '🎬',
    locales: {
      ru: { title: 'Домашний кинотеатр', description: 'Выберите фильм, который оба хотели посмотреть. Попкорн, плед, свет приглушён — как в кино.' },
      en: { title: 'Home cinema', description: 'Pick a movie you’ve both wanted to watch. Popcorn, a blanket, dim lights — just like a theater.' },
    },
  },
  {
    id: 'dance_kitchen',
    emoji: '💃',
    locales: {
      ru: { title: 'Танцы на кухне', description: 'Включите плейлист из любимых песен и танцуйте 30 минут — без стеснения, только веселье.' },
      en: { title: 'Kitchen dance party', description: 'Put on a playlist of favorite songs and dance for 30 minutes — no shame, just fun.' },
    },
  },
  {
    id: 'bookstore_date',
    emoji: '📚',
    locales: {
      ru: { title: 'Дата в книжном', description: 'Каждый выбирает книгу для партнёра. Потом читайте в кафе первые главы вслух или про себя.' },
      en: { title: 'Bookstore date', description: 'Each picks a book for the other. Then read the first chapters at a café — aloud or quietly.' },
    },
  },
  {
    id: 'spa_home',
    emoji: '🛁',
    locales: {
      ru: { title: 'Домашний спа-вечер', description: 'Маски, массаж плеч, чай и спокойная музыка. Забота друг о друге — главный ритуал.' },
      en: { title: 'Home spa evening', description: 'Face masks, shoulder massage, tea, and calm music. Caring for each other is the whole ritual.' },
    },
  },
  {
    id: 'letter_exchange',
    emoji: '💌',
    locales: {
      ru: { title: 'Обмен письмами', description: 'Напишите друг другу письмо о том, за что благодарны. Прочитайте вслух за ужином.' },
      en: { title: 'Letter exchange', description: 'Write each other a letter about what you’re grateful for. Read them aloud over dinner.' },
    },
  },
  {
    id: 'bike_ride',
    emoji: '🚲',
    locales: {
      ru: { title: 'Велопрогулка', description: 'Арендуйте или возьмите велосипеды и проедьте новый маршрут. Финиш — мороженое или кофе.' },
      en: { title: 'Bike ride', description: 'Rent or grab bikes and ride a new route. Finish with ice cream or coffee.' },
    },
  },
  {
    id: 'farmers_market',
    emoji: '🥕',
    locales: {
      ru: { title: 'Утро на фермерском рынке', description: 'Прогуляйтесь по рынку, купите что-то необычное и приготовьте из этого обед.' },
      en: { title: 'Farmers market morning', description: 'Wander the market, buy something unusual, and cook lunch from it.' },
    },
  },
  {
    id: 'karaoke',
    emoji: '🎤',
    locales: {
      ru: { title: 'Караоке-вечер', description: 'Дома или в караоке-баре спойте любимые хиты — дуэты обязательны.' },
      en: { title: 'Karaoke night', description: 'At home or in a karaoke bar, sing your favorite hits — duets are mandatory.' },
    },
  },
  {
    id: 'memory_lane',
    emoji: '🗂️',
    locales: {
      ru: { title: 'Вечер воспоминаний', description: 'Достаньте старые фото и переписки. Вспоминайте первые свидания и смешные моменты.' },
      en: { title: 'Memory lane evening', description: 'Pull out old photos and chats. Relive first dates and funny moments together.' },
    },
  },
  {
    id: 'surprise_route',
    emoji: '🗺️',
    locales: {
      ru: { title: 'Сюрприз-маршрут', description: 'Один планирует 3 точки в городе и ведёт второго, не раскрывая следующий адрес.' },
      en: { title: 'Surprise route', description: 'One person plans 3 spots in the city and leads the other without revealing the next address.' },
    },
  },
  {
    id: 'pottery_or_craft',
    emoji: '🎨',
    locales: {
      ru: { title: 'Мастер-класс вдвоём', description: 'Гончарка, живопись, свечи — любой творческий воркшоп, где можно творить рядом.' },
      en: { title: 'Creative workshop for two', description: 'Pottery, painting, candles — any creative workshop where you can make something side by side.' },
    },
  },
  {
    id: 'sunrise_date',
    emoji: '🌅',
    locales: {
      ru: { title: 'Свидание на рассвете', description: 'Встаньте пораньше, возьмите термос и встретьте рассвет в красивом месте.' },
      en: { title: 'Sunrise date', description: 'Wake up early, bring a thermos, and watch the sunrise somewhere beautiful.' },
    },
  },
  {
    id: 'dessert_tour',
    emoji: '🍰',
    locales: {
      ru: { title: 'Тур по десертам', description: 'Посетите 3 места с разными сладкими специалитетами и выберите победителя.' },
      en: { title: 'Dessert crawl', description: 'Visit 3 places with different sweet specialties and pick a winner.' },
    },
  },
  {
    id: 'volunteer_together',
    emoji: '🤝',
    locales: {
      ru: { title: 'Доброе дело вместе', description: 'Пожертвуйте вещи, помогите приюту или посадите дерево — свидание с смыслом.' },
      en: { title: 'Do good together', description: 'Donate clothes, help a shelter, or plant a tree — a date with meaning.' },
    },
  },
  {
    id: 'rooftop_coffee',
    emoji: '☕',
    locales: {
      ru: { title: 'Кофе с видом', description: 'Найдите кафе с панорамой или крышу с видом на город и просто будьте рядом.' },
      en: { title: 'Coffee with a view', description: 'Find a café with a panorama or a rooftop overlooking the city and simply be together.' },
    },
  },
  {
    id: 'playlist_exchange',
    emoji: '🎧',
    locales: {
      ru: { title: 'Обмен плейлистами', description: 'Составьте друг другу плейлист «наш вечер» и слушайте его на прогулке или дома.' },
      en: { title: 'Playlist exchange', description: 'Make each other a “our evening” playlist and listen on a walk or at home.' },
    },
  },
  {
    id: 'boat_or_ferry',
    emoji: '⛵',
    locales: {
      ru: { title: 'Прогулка на воде', description: 'Катер, паром или лодка — любой водный маршрут, где можно побыть вдвоём.' },
      en: { title: 'On the water', description: 'A boat, ferry, or small craft — any water route where you can be just the two of you.' },
    },
  },
  {
    id: 'astro_cafe',
    emoji: '🪐',
    locales: {
      ru: { title: 'Тема вечера: космос', description: 'Документалка про космос, горячий шоколад и разговор «куда бы мы полетели».' },
      en: { title: 'Space-themed evening', description: 'A space documentary, hot chocolate, and a talk about where you’d travel among the stars.' },
    },
  },
  {
    id: 'slow_morning',
    emoji: '🌤️',
    locales: {
      ru: { title: 'Медленное утро', description: 'Никаких планов до обеда: кофе, музыка, объятия и разговоры ни о чём важном.' },
      en: { title: 'Slow morning', description: 'No plans until noon: coffee, music, hugs, and conversations about nothing urgent.' },
    },
  },
  {
    id: 'couple_workout',
    emoji: '🏃',
    locales: {
      ru: { title: 'Тренировка вдвоём', description: 'Йога в парке, пробежка или домашняя зарядка — а после смузи и комплименты.' },
      en: { title: 'Workout for two', description: 'Park yoga, a run, or a home workout — then smoothies and compliments.' },
    },
  },
  {
    id: 'restaurant_blind',
    emoji: '🍽️',
    locales: {
      ru: { title: 'Ресторан вслепую', description: 'Один выбирает место, второй не знает куда идёте до последнего момента.' },
      en: { title: 'Blind restaurant pick', description: 'One chooses the place; the other doesn’t know where you’re going until the last moment.' },
    },
  },
];

export const getDatingIdeaLocalized = (
  idea: DatingIdeaDefinition,
  locale: AppLocale
): DatingIdeaLocalized & { id: string; emoji: string } => {
  const copy =
    idea.locales[locale] ||
    idea.locales.en ||
    idea.locales.ru ||
    idea.locales[DEFAULT_LOCALE];

  return {
    id: idea.id,
    emoji: idea.emoji,
    title: copy.title,
    description: copy.description,
  };
};

export const getDatingIdeaById = (id: string): DatingIdeaDefinition | undefined =>
  DATING_IDEAS.find((idea) => idea.id === id);

export const pickRandomDatingIdea = (excludeIds: string[] = []): DatingIdeaDefinition => {
  const available = DATING_IDEAS.filter((idea) => !excludeIds.includes(idea.id));
  const pool = available.length > 0 ? available : DATING_IDEAS;
  return pool[Math.floor(Math.random() * pool.length)];
};
