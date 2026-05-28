/** Полный пул категорий; на поле каждый день — 5 случайных. */
export const QUIZ_CATEGORIES = [
  { id: 'love', name: 'Любовь' },
  { id: 'cinema', name: 'Кино' },
  { id: 'travel', name: 'Путешествия' },
  { id: 'general', name: 'Общее' },
  { id: 'music', name: 'Музыка' },
  { id: 'food', name: 'Еда и кухня' },
  { id: 'nature', name: 'Природа и животные' },
  { id: 'holidays', name: 'Праздники и традиции' },
  { id: 'loveLanguages', name: 'Языки любви' },
  { id: 'tech', name: 'Технологии и интернет' },
  { id: 'sport', name: 'Спорт' },
  { id: 'art', name: 'Искусство и литература' },
  { id: 'home', name: 'Дом и быт' },
];

import { QUIZ_QUESTIONS_EXTRA } from './quizGameContentExtra';
import { QUIZ_QUESTIONS_EXTRA_2 } from './quizGameContentExtra2';

const QUIZ_QUESTIONS_BASE = [
  // Любовь
  {
    id: 'love-1',
    categoryId: 'love',
    text: 'Как называется праздник 14 февраля?',
    answers: ['день святого валентина', 'валентин', 'день влюбленных', '14 февраля'],
  },
  {
    id: 'love-2',
    categoryId: 'love',
    text: 'Какой цвет чаще всего ассоциируют с романтикой?',
    answers: ['красный', 'красный цвет'],
  },
  {
    id: 'love-3',
    categoryId: 'love',
    text: 'Какой город называют «городом влюблённых»?',
    answers: ['париж'],
  },
  {
    id: 'love-4',
    categoryId: 'love',
    text: 'Как называется годовщина 50 лет брака?',
    answers: ['золотая свадьба', 'золотая'],
  },
  {
    id: 'love-5',
    categoryId: 'love',
    text: 'Какой символ чаще дарят на День святого Валентина в виде сладости?',
    answers: ['сердце', 'сердечко', 'шоколадное сердце'],
  },
  // Кино
  {
    id: 'cinema-1',
    categoryId: 'cinema',
    text: 'Как зовут главного героя «Титаника» (имя)?',
    answers: ['джек', 'jack'],
  },
  {
    id: 'cinema-2',
    categoryId: 'cinema',
    text: 'В каком фильме герой говорит «Я твой отец»?',
    answers: ['звездные войны', 'империя наносит ответный удар', 'star wars'],
  },
  {
    id: 'cinema-3',
    categoryId: 'cinema',
    text: 'Как называется главная кинопремия США?',
    answers: ['оскар', 'oscar', 'оскары'],
  },
  {
    id: 'cinema-4',
    categoryId: 'cinema',
    text: 'Кто режиссёр фильма «Тёмный рыцарь» (2008)?',
    answers: ['кристофер нолан', 'нолан', 'christopher nolan'],
  },
  {
    id: 'cinema-5',
    categoryId: 'cinema',
    text: 'В каком году вышел первый фильм о Гарри Поттере в кино?',
    answers: ['2001'],
  },
  // Путешествия
  {
    id: 'travel-1',
    categoryId: 'travel',
    text: 'Столица Франции?',
    answers: ['париж'],
  },
  {
    id: 'travel-2',
    categoryId: 'travel',
    text: 'На каком континенте находится Египет?',
    answers: ['африка', 'африканский'],
  },
  {
    id: 'travel-3',
    categoryId: 'travel',
    text: 'В какой стране находится Эйфелева башня?',
    answers: ['франция', 'франции'],
  },
  {
    id: 'travel-4',
    categoryId: 'travel',
    text: 'Столица Австралии?',
    answers: ['канберра'],
  },
  {
    id: 'travel-5',
    categoryId: 'travel',
    text: 'В какой стране находится Мачу-Пикчу?',
    answers: ['перу'],
  },
  // Общее
  {
    id: 'general-1',
    categoryId: 'general',
    text: 'Сколько дней в високосном году?',
    answers: ['366', 'триста шестьдесят шесть'],
  },
  {
    id: 'general-2',
    categoryId: 'general',
    text: 'Какой газ необходим для дыхания?',
    answers: ['кислород', 'o2'],
  },
  {
    id: 'general-3',
    categoryId: 'general',
    text: 'Какая планета ближе всего к Солнцу?',
    answers: ['меркурий'],
  },
  {
    id: 'general-4',
    categoryId: 'general',
    text: 'Сколько минут в одном часе?',
    answers: ['60', 'шестьдесят'],
  },
  {
    id: 'general-5',
    categoryId: 'general',
    text: 'Какой химический элемент обозначается Au?',
    answers: ['золото'],
  },
  // Музыка
  {
    id: 'music-1',
    categoryId: 'music',
    text: 'Сколько струн у стандартной гитары?',
    answers: ['6', 'шесть'],
  },
  {
    id: 'music-2',
    categoryId: 'music',
    text: 'Как называется инструмент с клавишами, на котором играют пианисты?',
    answers: ['фортепиано', 'пианино', 'рояль'],
  },
  {
    id: 'music-3',
    categoryId: 'music',
    text: 'Кого называют King of Pop?',
    answers: ['майкл джексон', 'джексон', 'michael jackson'],
  },
  {
    id: 'music-4',
    categoryId: 'music',
    text: 'Сколько нот в музыкальной октаве (до–си)?',
    answers: ['7', 'семь'],
  },
  {
    id: 'music-5',
    categoryId: 'music',
    text: 'Какая страна родина фламенко?',
    answers: ['испания', 'испании'],
  },
  // Еда и кухня
  {
    id: 'food-1',
    categoryId: 'food',
    text: 'Из какой страны происходит пицца?',
    answers: ['италия', 'италии'],
  },
  {
    id: 'food-2',
    categoryId: 'food',
    text: 'Какой овощ — основа классического картофеля фри?',
    answers: ['картофель', 'картошка'],
  },
  {
    id: 'food-3',
    categoryId: 'food',
    text: 'Какой сыр традиционно используют в тирамису?',
    answers: ['маскарпоне'],
  },
  {
    id: 'food-4',
    categoryId: 'food',
    text: 'Как называется японское блюдо из риса и рыбы?',
    answers: ['суши', 'роллы'],
  },
  {
    id: 'food-5',
    categoryId: 'food',
    text: 'Из какой страны родом шампанское как регион?',
    answers: ['франция', 'франции'],
  },
  // Природа и животные
  {
    id: 'nature-1',
    categoryId: 'nature',
    text: 'Какое млекопитающее самое быстрое на суше?',
    answers: ['гепард', 'гепарда'],
  },
  {
    id: 'nature-2',
    categoryId: 'nature',
    text: 'Что производят пчёлы?',
    answers: ['мед', 'воск', 'прополис'],
  },
  {
    id: 'nature-3',
    categoryId: 'nature',
    text: 'Сколько ног у паука?',
    answers: ['8', 'восемь'],
  },
  {
    id: 'nature-4',
    categoryId: 'nature',
    text: 'Какое самое большое животное на Земле?',
    answers: ['синий кит', 'кит', 'синий кит'],
  },
  {
    id: 'nature-5',
    categoryId: 'nature',
    text: 'Какой газ выделяют растения при фотосинтезе?',
    answers: ['кислород', 'o2'],
  },
  // Праздники и традиции
  {
    id: 'holidays-1',
    categoryId: 'holidays',
    text: 'В какой день отмечают Новый год?',
    answers: ['1 января', 'первое января', '1 января'],
  },
  {
    id: 'holidays-2',
    categoryId: 'holidays',
    text: 'Какой праздник отмечают 8 марта?',
    answers: ['женский день', 'международный женский день', '8 марта'],
  },
  {
    id: 'holidays-3',
    categoryId: 'holidays',
    text: 'Какое дерево традиционно украшают на Новый год?',
    answers: ['ель', 'ёлка', 'елка', 'новогодняя елка'],
  },
  {
    id: 'holidays-4',
    categoryId: 'holidays',
    text: 'В какой месяце традиционно отмечают Хэллоуин?',
    answers: ['октябрь', 'октябре'],
  },
  {
    id: 'holidays-5',
    categoryId: 'holidays',
    text: 'Как называется праздник 31 декабря?',
    answers: ['новый год', 'канун нового года'],
  },
  // Языки любви
  {
    id: 'loveLanguages-1',
    categoryId: 'loveLanguages',
    text: 'Сколько «языков любви» в популярной модели Гэри Чепмена?',
    answers: ['5', 'пять'],
  },
  {
    id: 'loveLanguages-2',
    categoryId: 'loveLanguages',
    text: 'Какой язык любви связан с подарками? (на англ.)',
    answers: ['receiving gifts', 'подарки', 'получение подарков'],
  },
  {
    id: 'loveLanguages-3',
    categoryId: 'loveLanguages',
    text: 'Какой язык любви связан с прикосновениями? (на англ.)',
    answers: ['physical touch', 'физическое прикосновение', 'прикосновения'],
  },
  {
    id: 'loveLanguages-4',
    categoryId: 'loveLanguages',
    text: 'Какой язык любви — совместное время без отвлечений? (на англ.)',
    answers: ['quality time', 'качественное время', 'время вместе'],
  },
  {
    id: 'loveLanguages-5',
    categoryId: 'loveLanguages',
    text: 'Какой язык любви — слова поддержки и похвалы? (на англ.)',
    answers: ['words of affirmation', 'слова поддержки', 'слова похвалы'],
  },
  // Технологии и интернет
  {
    id: 'tech-1',
    categoryId: 'tech',
    text: 'Какая компания создала iPhone?',
    answers: ['apple', 'эпл', 'эппл'],
  },
  {
    id: 'tech-2',
    categoryId: 'tech',
    text: 'Что означает аббревиатура WWW?',
    answers: ['world wide web', 'всемирная паутина', 'всемирная сеть'],
  },
  {
    id: 'tech-3',
    categoryId: 'tech',
    text: 'Как называется первая криптовалюта?',
    answers: ['биткоин', 'bitcoin', 'btc'],
  },
  {
    id: 'tech-4',
    categoryId: 'tech',
    text: 'Как называется браузер от Google?',
    answers: ['chrome', 'google chrome', 'хром', 'гугл хром'],
  },
  {
    id: 'tech-5',
    categoryId: 'tech',
    text: 'Как называется операционная система от Microsoft для ПК?',
    answers: ['windows', 'виндовс', 'уиндовс'],
  },
  // Спорт
  {
    id: 'sport-1',
    categoryId: 'sport',
    text: 'Сколько игроков одной команды на поле в футболе?',
    answers: ['11', 'одиннадцать'],
  },
  {
    id: 'sport-2',
    categoryId: 'sport',
    text: 'Сколько колец на олимпийском флаге?',
    answers: ['5', 'пять'],
  },
  {
    id: 'sport-3',
    categoryId: 'sport',
    text: 'В каком виде спорта разыгрывают Уимблдон?',
    answers: ['теннис', 'большой теннис'],
  },
  {
    id: 'sport-4',
    categoryId: 'sport',
    text: 'В какой игре используют шайбу?',
    answers: ['хоккей', 'хоккей с шайбой'],
  },
  {
    id: 'sport-5',
    categoryId: 'sport',
    text: 'В какой лиге играют команды NBA?',
    answers: ['баскетбол', 'basketball'],
  },
  // Искусство и литература
  {
    id: 'art-1',
    categoryId: 'art',
    text: 'Кто написал роман «Война и мир»?',
    answers: ['толстой', 'лев толстой', 'л. н. толстой'],
  },
  {
    id: 'art-2',
    categoryId: 'art',
    text: 'Кто написал «Мону Лизу»?',
    answers: ['да винчи', 'леонардо', 'леонардо да винчи'],
  },
  {
    id: 'art-3',
    categoryId: 'art',
    text: 'Кто написал балет «Лебединое озеро»?',
    answers: ['чайковский', 'п. и. чайковский', 'петр чайковский'],
  },
  {
    id: 'art-4',
    categoryId: 'art',
    text: 'В каком городе находится Эрмитаж?',
    answers: ['санкт-петербург', 'петербург', 'спб', 'питер'],
  },
  {
    id: 'art-5',
    categoryId: 'art',
    text: 'Кто написал «Подсолнухи»?',
    answers: ['ван гог', 'винсент ван гог', 'van gogh'],
  },
  // Дом и быт
  {
    id: 'home-1',
    categoryId: 'home',
    text: 'При какой температуре (°C) закипает вода на уровне моря?',
    answers: ['100', 'сто'],
  },
  {
    id: 'home-2',
    categoryId: 'home',
    text: 'Какой прибор стирает одежду?',
    answers: ['стиральная машина', 'стиралка', 'машинка'],
  },
  {
    id: 'home-3',
    categoryId: 'home',
    text: 'Где обычно хранят продукты, чтобы они не портились?',
    answers: ['холодильник', 'холодильнике', 'морозилка'],
  },
  {
    id: 'home-4',
    categoryId: 'home',
    text: 'Как называется комната для сна?',
    answers: ['спальня', 'спальне'],
  },
  {
    id: 'home-5',
    categoryId: 'home',
    text: 'Чем зашивают ткань?',
    answers: ['игла', 'иглой', 'нитка и игла'],
  },
];

/** 40 вопросов на категорию; на поле каждый день — 3 случайных (100 / 200 / 300). */
export const QUIZ_QUESTIONS = [
  ...QUIZ_QUESTIONS_BASE,
  ...QUIZ_QUESTIONS_EXTRA,
  ...QUIZ_QUESTIONS_EXTRA_2,
];
