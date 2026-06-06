/**
 * Generates English display answers for quiz questions.
 * Run: npx ts-node scripts/generate-quiz-answers-en.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { QUIZ_QUESTIONS } from '../src/games/quizGameContent';

const isPrimarilyLatin = (value: string) => {
  const cyrillic = (value.match(/[а-яё]/gi) || []).length;
  const latin = (value.match(/[a-z]/gi) || []).length;
  return latin > cyrillic;
};

const formatAnswerDisplay = (answer: string) => {
  const trimmed = answer.trim();
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/** Russian canonical answer -> English display label */
const ANSWER_RU_EN: Record<string, string> = {
  '0': '0',
  '1': '1',
  '1 января': 'January 1',
  '100': '100',
  '1000': '1000',
  '11': '11',
  '12': '12',
  '15': '15',
  '1969': '1969',
  '2': '2',
  '2001': '2001',
  '206': '206',
  '24': '24',
  '25 декабря': 'December 25',
  '28': '28',
  '3': '3',
  '31 октября': 'October 31',
  '32': '32',
  '33': '33',
  '366': '366',
  '4': '4',
  '42': '42',
  '5': '5',
  '6': '6',
  '6 декабря': 'December 6',
  '60': '60',
  '7': '7',
  '8': '8',
  '88': '88',
  '90': '90',
  австралия: 'Australia',
  антарктида: 'Antarctica',
  африка: 'Africa',
  бамбук: 'Bamboo',
  барабан: 'Drum',
  безымянный: 'Ring finger',
  белый: 'White',
  'белый медведь': 'Polar bear',
  бемоль: 'Flat',
  бокс: 'Boxing',
  брак: 'Marriage',
  бронза: 'Bronze',
  'букет невесты': "Bride's bouquet",
  булгаков: 'Bulgakov',
  ванной: 'Bathroom',
  васнецов: 'Vasnetsov',
  ведро: 'Bucket',
  велосипед: 'Bicycle',
  'вито корлеоне': 'Vito Corleone',
  влюбленные: 'Lovers',
  вода: 'Water',
  водой: 'Water',
  волге: 'Volga',
  вторичный: 'Secondary',
  гепард: 'Cheetah',
  гоголь: 'Gogol',
  гончаров: 'Goncharov',
  'да винчи': 'da Vinci',
  'день всех святых': "All Saints' Day",
  'день святого валентина': "Valentine's Day",
  диван: 'Sofa',
  дирижер: 'Conductor',
  достоевский: 'Dostoevsky',
  дрожжи: 'Yeast',
  духовка: 'Oven',
  душ: 'Shower',
  египет: 'Egypt',
  еды: 'Food',
  ель: 'Spruce',
  железо: 'Iron',
  'женский день': "Women's Day",
  жираф: 'Giraffe',
  зеленый: 'Green',
  зимний: 'Winter',
  змея: 'Snake',
  знакомство: 'Meeting',
  'золотая свадьба': 'Golden wedding anniversary',
  золото: 'Gold',
  игла: 'Needle',
  ильф: 'Ilf',
  индия: 'India',
  испания: 'Spain',
  италия: 'Italy',
  йогурт: 'Yogurt',
  какао: 'Cocoa',
  канада: 'Canada',
  канберра: 'Canberra',
  капуста: 'Cabbage',
  карнавал: 'Carnival',
  картофель: 'Potato',
  кастрюля: 'Pot',
  'качественное время': 'Quality time',
  квартет: 'Quartet',
  кедровый: 'Cedar',
  'кипячения воды': 'Boiling water',
  китай: 'China',
  ключ: 'Key',
  клятва: 'Vow',
  коврик: 'Rug',
  кольцо: 'Ring',
  кондиционер: 'Air conditioner',
  короб: 'Box',
  крамской: 'Kramskoy',
  красный: 'Red',
  кровать: 'Bed',
  купидон: 'Cupid',
  легкие: 'Lungs',
  лермонтов: 'Lermontov',
  'летучая мышь': 'Bat',
  лимон: 'Lemon',
  лирика: 'Lyrics',
  литавры: 'Timpani',
  личный: 'Personal',
  лошадь: 'Horse',
  'луковый суп': 'Onion soup',
  луна: 'Moon',
  'любовное письмо': 'Love letter',
  макароны: 'Pasta',
  'марианская впадина': 'Mariana Trench',
  маскарпоне: 'Mascarpone',
  мед: 'Honey',
  'медовый месяц': 'Honeymoon',
  медь: 'Copper',
  меркурий: 'Mercury',
  метан: 'Methane',
  микроволновка: 'Microwave',
  млекопитающее: 'Mammal',
  натрий: 'Sodium',
  'новый год': 'New Year',
  нож: 'Knife',
  обеты: 'Vows',
  общение: 'Communication',
  октябрь: 'October',
  оливки: 'Olives',
  омела: 'Mistletoe',
  островский: 'Ostrovsky',
  отец: 'Father',
  пальма: 'Palm tree',
  париж: 'Paris',
  пастернак: 'Pasternak',
  пасха: 'Easter',
  'пасхальное яйцо': 'Easter egg',
  'первый танец': 'First dance',
  перу: 'Peru',
  пластинка: 'Vinyl record',
  подарки: 'Gifts',
  подметания: 'Sweeping',
  подсолнух: 'Sunflower',
  полотенце: 'Towel',
  помолвка: 'Engagement',
  посуду: 'Dishes',
  поцелуй: 'Kiss',
  поэт: 'Poet',
  пригласительное: 'Invitation',
  прикосновения: 'Physical touch',
  прихожая: 'Hallway',
  простыня: 'Sheet',
  пушкин: 'Pushkin',
  пчелы: 'Bees',
  пылесос: 'Vacuum cleaner',
  рамен: 'Ramen',
  расставание: 'Breakup',
  ритм: 'Rhythm',
  риф: 'Reef',
  роза: 'Rose',
  'романтический отпуск': 'Romantic getaway',
  'романтический ужин': 'Romantic dinner',
  росянка: 'Sundew',
  рублев: 'Rublev',
  саксофон: 'Saxophone',
  'санкт-петербург': 'Saint Petersburg',
  сатурн: 'Saturn',
  'свадебный танец': 'Wedding dance',
  свекла: 'Beetroot',
  свет: 'Light',
  'северное сияние': 'Northern lights',
  сердце: 'Heart',
  серебро: 'Silver',
  'серебряная свадьба': 'Silver wedding anniversary',
  серов: 'Serov',
  'синий кит': 'Blue whale',
  'ситцевая свадьба': 'Calico wedding anniversary',
  скатерть: 'Tablecloth',
  скрипка: 'Violin',
  служение: 'Acts of service',
  снег: 'Snow',
  сова: 'Owl',
  сожители: 'Cohabitants',
  спальня: 'Bedroom',
  спорт: 'Sport',
  'стиральная машина': 'Washing machine',
  суши: 'Sushi',
  сушилка: 'Dryer',
  теннис: 'Tennis',
  тигр: 'Tiger',
  толстой: 'Tolstoy',
  трио: 'Trio',
  тромбон: 'Trombone',
  увлажнитель: 'Humidifier',
  улитка: 'Snail',
  утюг: 'Iron',
  уха: 'Fish soup',
  флейта: 'Flute',
  фонарик: 'Lantern',
  фортепиано: 'Piano',
  франция: 'France',
  футбол: 'Soccer',
  хамелеон: 'Chameleon',
  хачапури: 'Khachapuri',
  хоккей: 'Hockey',
  холодильник: 'Refrigerator',
  хор: 'Choir',
  чай: 'Tea',
  чайковский: 'Tchaikovsky',
  чехов: 'Chekhov',
  шахматы: 'Chess',
  шварценеггер: 'Schwarzenegger',
  шекспир: 'Shakespeare',
  шелкопряд: 'Silkworm',
  шишкин: 'Shishkin',
  шкаф: 'Wardrobe',
  шолохов: 'Sholokhov',
  шторка: 'Shower curtain',
  шторы: 'Curtains',
  электромобили: 'Electric cars',
  'языках любви': 'love languages',
  япония: 'Japan',
};

const getEnglishAnswer = (question: (typeof QUIZ_QUESTIONS)[number]) => {
  const latinAnswer = question.answers.find(isPrimarilyLatin);
  if (latinAnswer) {
    return formatAnswerDisplay(latinAnswer);
  }

  const canonical = question.answers[0];
  const translated = ANSWER_RU_EN[canonical];
  if (translated) {
    return translated;
  }

  return canonical;
};

const lines = QUIZ_QUESTIONS.map((question) => {
  const en = getEnglishAnswer(question).replace(/'/g, "\\'");
  return `  '${question.id}': '${en}',`;
});

const missing = QUIZ_QUESTIONS.filter((q) => getEnglishAnswer(q) === q.answers[0] && !q.answers.some(isPrimarilyLatin));

const out = `/** Auto-generated by scripts/generate-quiz-answers-en.ts — do not edit manually. */
export const QUIZ_ANSWER_EN: Record<string, string> = {
${lines.join('\n')}
};
`;

const outDir = path.join(__dirname, '../src/i18n/generated');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'quizAnswersEn.ts'), out);
console.log(`Generated ${QUIZ_QUESTIONS.length} quiz answer translations.`);
if (missing.length > 0) {
  console.warn(`Missing translations: ${missing.length}`);
  missing.slice(0, 10).forEach((q) => console.warn(`  ${q.id}: ${q.answers[0]}`));
}
