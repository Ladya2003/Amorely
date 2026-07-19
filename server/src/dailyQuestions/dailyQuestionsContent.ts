export type DailyQuestionType = 'text' | 'choice' | 'image';

export interface DailyQuestionChoice {
  id: string;
  label: string;
}

export interface DailyQuestionImageOption {
  id: string;
  label: string;
  url: string;
}

export interface DailyQuestion {
  id: string;
  type: DailyQuestionType;
  text: string;
  options?: DailyQuestionChoice[];
  images?: DailyQuestionImageOption[];
}

export interface DailyQuestionCategory {
  id: string;
  emoji: string;
  title: string;
  questions: DailyQuestion[];
}

const IMG = {
  modern: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
  cozy: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
  cottage: 'https://images.unsplash.com/photo-1518780664697-55e3ad037588?w=400&h=300&fit=crop',
  loft: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
  beach: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&h=300&fit=crop',
  mountain: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=300&fit=crop',
  city: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
  garden: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
  kitchen: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=300&fit=crop',
  bedroom: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400&h=300&fit=crop',
  balcony: 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=400&h=300&fit=crop',
  fireplace: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
};

export const DAILY_QUESTION_CATEGORIES: DailyQuestionCategory[] = [
  {
    id: 'never_have_i_ever',
    emoji: '🙈',
    title: 'Я никогда не...',
    questions: [
      { id: 'n1', type: 'text', text: 'Я никогда не... (напиши свой самый смешной «грех»)' },
      {
        id: 'n2',
        type: 'choice',
        text: 'Я никогда не тайно читал(а) переписку партнёра',
        options: [
          { id: 'yes', label: 'Да, признаюсь 🙈' },
          { id: 'no', label: 'Нет, никогда!' },
          { id: 'tempted', label: 'Хотел(а), но сдержался(ась)' },
        ],
      },
      { id: 'n3', type: 'text', text: 'Я никогда не делал(а) что-то безумное ради любви. Расскажи!' },
      {
        id: 'n4',
        type: 'choice',
        text: 'Я никогда не засыпал(а) во время фильма на свидании',
        options: [
          { id: 'guilty', label: 'Виновен(на) 😴' },
          { id: 'never', label: 'Никогда!' },
          { id: 'partner', label: 'Это партнёр засыпал!' },
        ],
      },
    ],
  },
  {
    id: 'intimate_life',
    emoji: '💋',
    title: 'Интимная жизнь',
    questions: [
      {
        id: 'i1',
        type: 'choice',
        text: 'Что для тебя важнее в близости?',
        options: [
          { id: 'passion', label: 'Страсть и спонтанность' },
          { id: 'tenderness', label: 'Нежность и доверие' },
          { id: 'balance', label: 'Баланс обоих' },
        ],
      },
      { id: 'i2', type: 'text', text: 'Какой комплимент от партнёра тебя больше всего заводит?' },
      {
        id: 'i3',
        type: 'choice',
        text: 'Идеальная атмосфера для романтического вечера?',
        options: [
          { id: 'candles', label: 'Свечи и тишина' },
          { id: 'music', label: 'Музыка и танцы' },
          { id: 'surprise', label: 'Сюрприз без подготовки' },
        ],
      },
      { id: 'i4', type: 'text', text: 'О чём ты мечтаешь, но ещё не говорил(а) партнёру?' },
    ],
  },
  {
    id: 'couple_life',
    emoji: '🏠',
    title: 'Жизнь пары',
    questions: [
      {
        id: 'c1',
        type: 'choice',
        text: 'Кто обычно готовит дома?',
        options: [
          { id: 'me', label: 'Я' },
          { id: 'partner', label: 'Партнёр' },
          { id: 'together', label: 'Вместе' },
          { id: 'delivery', label: 'Доставка — наш друг' },
        ],
      },
      { id: 'c2', type: 'text', text: 'Какой бытовой момент с партнёром тебе нравится больше всего?' },
      {
        id: 'c3',
        type: 'choice',
        text: 'Как вы обычно миритесь после ссоры?',
        options: [
          { id: 'talk', label: 'Спокойный разговор' },
          { id: 'hug', label: 'Объятия без слов' },
          { id: 'time', label: 'Нужно время побыть одному' },
          { id: 'humor', label: 'Шутка и смех' },
        ],
      },
      { id: 'c4', type: 'text', text: 'Какую привычку партнёра ты бы хотел(а) перенять?' },
    ],
  },
  {
    id: 'dream_house',
    emoji: '🏡',
    title: 'Дом мечты',
    questions: [
      {
        id: 'd1',
        type: 'image',
        text: 'Какой дом тебе ближе?',
        images: [
          { id: 'modern', label: 'Современный', url: IMG.modern },
          { id: 'cozy', label: 'Уютный коттедж', url: IMG.cozy },
        ],
      },
      {
        id: 'd2',
        type: 'image',
        text: 'Где бы ты хотел(а) жить?',
        images: [
          { id: 'beach', label: 'У моря', url: IMG.beach },
          { id: 'mountain', label: 'В горах', url: IMG.mountain },
        ],
      },
      { id: 'd3', type: 'text', text: 'Какая комната в доме мечты — твоя любимая и почему?' },
      {
        id: 'd4',
        type: 'image',
        text: 'Какая кухня тебе нравится?',
        images: [
          { id: 'kitchen', label: 'Светлая и просторная', url: IMG.kitchen },
          { id: 'fireplace', label: 'С камином рядом', url: IMG.fireplace },
        ],
      },
    ],
  },
  {
    id: 'love_in_balance',
    emoji: '⚖️',
    title: 'Любовь в балансе',
    questions: [
      {
        id: 'l1',
        type: 'choice',
        text: 'Сколько личного времени тебе нужно в отношениях?',
        options: [
          { id: 'lot', label: 'Много — я introvert' },
          { id: 'some', label: 'Немного каждый день' },
          { id: 'little', label: 'Мало — хочу быть вместе' },
        ],
      },
      { id: 'l2', type: 'text', text: 'Что помогает тебе чувствовать баланс между «мы» и «я»?' },
      {
        id: 'l3',
        type: 'choice',
        text: 'Как ты реагируешь, когда партнёр занят и не отвечает?',
        options: [
          { id: 'calm', label: 'Спокойно жду' },
          { id: 'worry', label: 'Начинаю переживать' },
          { id: 'busy', label: 'Тоже занимаюсь своим' },
        ],
      },
      { id: 'l4', type: 'text', text: 'Что партнёр может сделать, чтобы ты чувствовал(а) себя в безопасности?' },
    ],
  },
  {
    id: 'holiday_habits',
    emoji: '🎄',
    title: 'Праздничные привычки',
    questions: [
      {
        id: 'h1',
        type: 'choice',
        text: 'Как ты предпочитаешь встречать Новый год?',
        options: [
          { id: 'home', label: 'Дома в уютной атмосфере' },
          { id: 'party', label: 'На большой вечеринке' },
          { id: 'travel', label: 'В путешествии' },
        ],
      },
      { id: 'h2', type: 'text', text: 'Какой праздник ты хотел(а) бы отмечать вместе особенно?' },
      {
        id: 'h3',
        type: 'choice',
        text: 'Подарки на праздники — как ты к ним относишься?',
        options: [
          { id: 'love', label: 'Обожаю дарить и получать' },
          { id: 'simple', label: 'Главное — время вместе' },
          { id: 'surprise', label: 'Люблю сюрпризы' },
        ],
      },
      { id: 'h4', type: 'text', text: 'Какая праздничная традиция из детства тебе дорога?' },
    ],
  },
  {
    id: 'first_dates',
    emoji: '💕',
    title: 'Первые свидания',
    questions: [
      { id: 'f1', type: 'text', text: 'Что ты запомнил(а) больше всего о нашем первом свидании?' },
      {
        id: 'f2',
        type: 'choice',
        text: 'Идеальное первое свидание для тебя — это...',
        options: [
          { id: 'walk', label: 'Прогулка и разговоры' },
          { id: 'dinner', label: 'Ужин в ресторане' },
          { id: 'adventure', label: 'Что-то необычное' },
        ],
      },
      { id: 'f3', type: 'text', text: 'Какой момент заставил тебя понять, что хочешь встречаться дальше?' },
      {
        id: 'f4',
        type: 'choice',
        text: 'Что ты чувствовал(а) перед первым поцелуем?',
        options: [
          { id: 'nervous', label: 'Волнение' },
          { id: 'natural', label: 'Всё было естественно' },
          { id: 'excited', label: 'Нетерпение и азарт' },
        ],
      },
    ],
  },
  {
    id: 'future_together',
    emoji: '🔮',
    title: 'Будущее вместе',
    questions: [
      { id: 'u1', type: 'text', text: 'Как ты видишь нашу жизнь через 5 лет?' },
      {
        id: 'u2',
        type: 'choice',
        text: 'Сколько детей (если вообще) ты бы хотел(а)?',
        options: [
          { id: 'zero', label: 'Без детей' },
          { id: 'one_two', label: '1–2 ребёнка' },
          { id: 'big', label: 'Большая семья' },
          { id: 'open', label: 'Посмотрим по ситуации' },
        ],
      },
      { id: 'u3', type: 'text', text: 'Какую мечту ты хочешь осуществить вместе в ближайший год?' },
      {
        id: 'u4',
        type: 'choice',
        text: 'Где бы ты хотел(а) провести золотую годовщину?',
        options: [
          { id: 'home', label: 'Дома с близкими' },
          { id: 'abroad', label: 'В далёкой стране' },
          { id: 'revisit', label: 'Там, где мы познакомились' },
        ],
      },
    ],
  },
  {
    id: 'food_romance',
    emoji: '🍷',
    title: 'Еда и романтика',
    questions: [
      {
        id: 'r1',
        type: 'choice',
        text: 'Идеальный романтический ужин — это...',
        options: [
          { id: 'cook', label: 'Готовим вместе дома' },
          { id: 'restaurant', label: 'Ресторан при свечах' },
          { id: 'picnic', label: 'Пикник на природе' },
        ],
      },
      { id: 'r2', type: 'text', text: 'Какое блюдо ассоциируется у тебя с нашими отношениями?' },
      {
        id: 'r3',
        type: 'choice',
        text: 'Как ты относишься к совместным походам за продуктами?',
        options: [
          { id: 'love', label: 'Обожаю — это свидание!' },
          { id: 'ok', label: 'Нормально, если быстро' },
          { id: 'no', label: 'Предпочитаю одному' },
        ],
      },
      { id: 'r4', type: 'text', text: 'Какой вкус или аромат напоминает тебе о нас?' },
    ],
  },
  {
    id: 'travel_dreams',
    emoji: '✈️',
    title: 'Путешествия мечты',
    questions: [
      {
        id: 't1',
        type: 'image',
        text: 'Куда поехать в следующий отпуск?',
        images: [
          { id: 'beach', label: 'Пляж и солнце', url: IMG.beach },
          { id: 'city', label: 'Город и культура', url: IMG.city },
        ],
      },
      { id: 't2', type: 'text', text: 'Какое путешествие ты мечтаешь совершить со мной?' },
      {
        id: 't3',
        type: 'choice',
        text: 'Стиль путешествий — какой твой?',
        options: [
          { id: 'plan', label: 'Всё распланировано' },
          { id: 'spontaneous', label: 'Спontanно и авантюрно' },
          { id: 'mix', label: 'Микс планов и импровизации' },
        ],
      },
      {
        id: 't4',
        type: 'image',
        text: 'Где остановиться в путешествии?',
        images: [
          { id: 'hotel', label: 'Отель с видом', url: IMG.balcony },
          { id: 'cottage', label: 'Уютный домик', url: IMG.cottage },
        ],
      },
    ],
  },
  {
    id: 'silly_moments',
    emoji: '😂',
    title: 'Весёлые секреты',
    questions: [
      { id: 's1', type: 'text', text: 'Какая наша самая смешная история, которую ты рассказываешь друзьям?' },
      {
        id: 's2',
        type: 'choice',
        text: 'Что ты делаешь, когда хочешь поднять партнёру настроение?',
        options: [
          { id: 'joke', label: 'Шучу и дурачусь' },
          { id: 'gift', label: 'Маленький сюрприз' },
          { id: 'hug', label: 'Обнимаю крепко' },
        ],
      },
      { id: 's3', type: 'text', text: 'Какой странный талант у тебя есть, о котором я могу не знать?' },
      {
        id: 's4',
        type: 'choice',
        text: 'Если бы мы были персонажами мультфильма, это был бы...',
        options: [
          { id: 'comedy', label: 'Комедия' },
          { id: 'adventure', label: 'Приключения' },
          { id: 'romance', label: 'Романтическая сказка' },
        ],
      },
    ],
  },
  {
    id: 'deep_connection',
    emoji: '💬',
    title: 'Глубокая связь',
    questions: [
      { id: 'p1', type: 'text', text: 'Когда ты последний раз чувствовал(а), что я тебя по-настоящему понимаю?' },
      {
        id: 'p2',
        type: 'choice',
        text: 'Что для тебя значит «быть услышанным»?',
        options: [
          { id: 'listen', label: 'Внимательно слушать без советов' },
          { id: 'support', label: 'Поддержать словами и делом' },
          { id: 'empathy', label: 'Почувствовать мои эмоции' },
        ],
      },
      { id: 'p3', type: 'text', text: 'О чём тебе сложнее всего говорить, но ты хочешь попробовать?' },
      {
        id: 'p4',
        type: 'choice',
        text: 'Как часто тебе нужны «глубокие» разговоры?',
        options: [
          { id: 'daily', label: 'Почти каждый день' },
          { id: 'weekly', label: 'Раз в неделю' },
          { id: 'sometimes', label: 'Иногда, но важно' },
        ],
      },
    ],
  },
  {
    id: 'music_mood',
    emoji: '🎵',
    title: 'Музыка и настроение',
    questions: [
      { id: 'm1', type: 'text', text: 'Какая песня напоминает тебе о нас?' },
      {
        id: 'm2',
        type: 'choice',
        text: 'Какую музыку ты включаешь для романтического настроения?',
        options: [
          { id: 'slow', label: 'Медленные баллады' },
          { id: 'jazz', label: 'Джazz / лоу-фай' },
          { id: 'fun', label: 'Весёлые хиты' },
        ],
      },
      { id: 'm3', type: 'text', text: 'Какой концерт или фестиваль ты хотел(а) бы посетить вместе?' },
      {
        id: 'm4',
        type: 'choice',
        text: 'Танцы дома — это...',
        options: [
          { id: 'love', label: 'Наш ритуал!' },
          { id: 'sometimes', label: 'Иногда, если настроение' },
          { id: 'shy', label: 'Смущаюсь, но попробую' },
        ],
      },
    ],
  },
  {
    id: 'morning_night',
    emoji: '🌙',
    title: 'Утро и вечер',
    questions: [
      {
        id: 'o1',
        type: 'choice',
        text: 'Ты — сова или жаворонок?',
        options: [
          { id: 'owl', label: 'Сова 🦉' },
          { id: 'lark', label: 'Жаворонок 🐦' },
          { id: 'depends', label: 'Зависит от дня' },
        ],
      },
      { id: 'o2', type: 'text', text: 'Как выглядит твоё идеальное утро вместе?' },
      {
        id: 'o3',
        type: 'choice',
        text: 'Как засыпаешь лучше всего?',
        options: [
          { id: 'cuddle', label: 'В объятиях' },
          { id: 'space', label: 'Нужно немного пространства' },
          { id: 'talk', label: 'После разговора о дне' },
        ],
      },
      {
        id: 'o4',
        type: 'image',
        text: 'Какая спальня тебе ближе?',
        images: [
          { id: 'bedroom', label: 'Минимализм и свет', url: IMG.bedroom },
          { id: 'cozy', label: 'Уют и текстиль', url: IMG.cozy },
        ],
      },
    ],
  },
  {
    id: 'gifts_surprises',
    emoji: '🎁',
    title: 'Подарки и сюрпризы',
    questions: [
      {
        id: 'g1',
        type: 'choice',
        text: 'Какой подарок тебе приятнее?',
        options: [
          { id: 'handmade', label: 'Сделанный своими руками' },
          { id: 'experience', label: 'Впечатление / поездка' },
          { id: 'thing', label: 'То, о чём давно мечтал(а)' },
        ],
      },
      { id: 'g2', type: 'text', text: 'Какой сюрприз от партнёра запомнился тебе больше всего?' },
      {
        id: 'g3',
        type: 'choice',
        text: 'Как ты относишься к публичным проявлениям любви?',
        options: [
          { id: 'love', label: 'Обожаю!' },
          { id: 'sometimes', label: 'Иногда — да' },
          { id: 'private', label: 'Лучше наедине' },
        ],
      },
      { id: 'g4', type: 'text', text: 'Какой маленький жест каждый день сделал бы тебя счастливее?' },
    ],
  },
];

export const getCategoryById = (id: string): DailyQuestionCategory | undefined =>
  DAILY_QUESTION_CATEGORIES.find((c) => c.id === id);

export const getAllCategoryIds = (): string[] =>
  DAILY_QUESTION_CATEGORIES.map((c) => c.id);

export const pickRandomCategories = (count: number, excludeIds: string[] = []): string[] => {
  const pool = DAILY_QUESTION_CATEGORIES.filter((c) => !excludeIds.includes(c.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((c) => c.id);
};
