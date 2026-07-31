#!/usr/bin/env node
/**
 * Generates extra daily question categories (85) and English i18n overlay.
 * Run: node scripts/generate-daily-questions-extra.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_CATEGORIES = path.join(__dirname, '../src/dailyQuestions/extraCategories.ts');
const OUT_I18N = path.join(__dirname, '../src/dailyQuestions/extraCategoriesI18n.ts');

export const NEW_IMAGE_KEYS = [
  "restaurant_candle",
  "picnic_park",
  "camping_tent",
  "roadtrip_car",
  "forest_walk",
  "lake_calm",
  "gym_couple",
  "yoga_calm",
  "cinema_date",
  "couch_movie",
  "train_travel",
  "airplane_window",
  "puppy_cuddle",
  "cat_lap",
  "boho_decor",
  "minimalist_home",
  "coffee_morning",
  "breakfast_bed",
  "rainy_window",
  "snow_couple",
  "sunset_beach",
  "party_friends",
  "wine_evening",
  "polaroid_wall",
  "city_night",
  "art_studio",
  "museum_art",
  "farmers_market",
  "stargazing",
  "vintage_room",
  "flowers_bouquet",
  "handwritten_note",
  "dance_floor",
  "wedding_dance"
];

const EXISTING_CATEGORY_IDS = new Set([
  'couple_life',
  'deep_connection',
  'dream_house',
  'first_dates',
  'food_romance',
  'future_together',
  'gifts_surprises',
  'holiday_habits',
  'intimate_life',
  'love_in_balance',
  'morning_night',
  'music_mood',
  'never_have_i_ever',
  'silly_moments',
  'travel_dreams',
]);

const CATEGORIES = [
  {
    "id": "childhood_memories",
    "emoji": "🧸",
    "title": "Детские воспоминания",
    "titleEn": "Childhood memories",
    "questions": [
      {
        "id": "ch1",
        "type": "text",
        "text": "Какое детское воспоминание ты бы хотел(а) пережить вместе со мной?",
        "textEn": "Which childhood memory would you want to relive with me?"
      },
      {
        "id": "ch2",
        "type": "choice",
        "text": "Что из детства ты сохранил(а) в себе до сих пор?",
        "textEn": "What from your childhood do you still carry with you today?",
        "options": [
          {
            "id": "playful",
            "label": "Игривость и смех",
            "labelEn": "Playfulness and laughter"
          },
          {
            "id": "curious",
            "label": "Любопытство к миру",
            "labelEn": "Curiosity about the world"
          },
          {
            "id": "sensitive",
            "label": "Чувствительность и мечтательность",
            "labelEn": "Sensitivity and dreaminess"
          }
        ]
      },
      {
        "id": "ch3",
        "type": "text",
        "text": "Какая семейная традиция из детства могла бы стать нашей?",
        "textEn": "Which family tradition from your childhood could become ours?"
      },
      {
        "id": "ch4",
        "type": "choice",
        "text": "Если бы мы встретились в детстве, чем бы занялись?",
        "textEn": "If we had met as kids, what would we do together?",
        "options": [
          {
            "id": "playground",
            "label": "Играли бы на площадке",
            "labelEn": "Play on the playground"
          },
          {
            "id": "adventure",
            "label": "Устроили бы приключение",
            "labelEn": "Go on an adventure"
          },
          {
            "id": "secret",
            "label": "Придумали бы тайный клуб",
            "labelEn": "Start a secret club"
          }
        ]
      }
    ]
  },
  {
    "id": "family_traditions",
    "emoji": "👨‍👩‍👧",
    "title": "Семейные традиции",
    "titleEn": "Family traditions",
    "questions": [
      {
        "id": "fa1",
        "type": "choice",
        "text": "Как ты относишься к семейным праздникам?",
        "textEn": "How do you feel about family holidays?",
        "options": [
          {
            "id": "love",
            "label": "Обожаю — это связь поколений",
            "labelEn": "Love them — they connect generations"
          },
          {
            "id": "selective",
            "label": "Выбираю самые близкие",
            "labelEn": "I pick the ones that matter most"
          },
          {
            "id": "create",
            "label": "Хочу создавать свои",
            "labelEn": "I want to create our own"
          }
        ]
      },
      {
        "id": "fa2",
        "type": "text",
        "text": "Какую традицию из своей семьи ты хотел(а) бы передать нашим детям?",
        "textEn": "Which tradition from your family would you pass on to our children?"
      },
      {
        "id": "fa3",
        "type": "choice",
        "text": "Как часто ты хочешь видеть родственников?",
        "textEn": "How often do you want to see relatives?",
        "options": [
          {
            "id": "often",
            "label": "Часто — семья рядом",
            "labelEn": "Often — family close by"
          },
          {
            "id": "holidays",
            "label": "На праздниках достаточно",
            "labelEn": "Holidays are enough"
          },
          {
            "id": "balance",
            "label": "Баланс — и своё пространство",
            "labelEn": "Balance — with our own space"
          }
        ]
      },
      {
        "id": "fa4",
        "type": "text",
        "text": "Какой семейный рецепт или ритуал ты хочешь сохранить?",
        "textEn": "Which family recipe or ritual do you want to keep alive?"
      }
    ]
  },
  {
    "id": "trust_foundations",
    "emoji": "🤝",
    "title": "Фундамент доверия",
    "titleEn": "Trust foundations",
    "questions": [
      {
        "id": "tr1",
        "type": "text",
        "text": "Когда ты впервые понял(а), что можешь мне доверять?",
        "textEn": "When did you first feel you could trust me?"
      },
      {
        "id": "tr2",
        "type": "choice",
        "text": "Что для тебя важнее всего в доверии?",
        "textEn": "What matters most to you in trust?",
        "options": [
          {
            "id": "honesty",
            "label": "Честность, даже когда больно",
            "labelEn": "Honesty, even when it hurts"
          },
          {
            "id": "reliability",
            "label": "Надёжность и слова на деле",
            "labelEn": "Reliability and keeping promises"
          },
          {
            "id": "transparency",
            "label": "Открытость без секретов",
            "labelEn": "Openness without secrets"
          }
        ]
      },
      {
        "id": "tr3",
        "type": "text",
        "text": "Был ли момент, когда доверие между нами стало крепче?",
        "textEn": "Was there a moment when trust between us grew stronger?"
      },
      {
        "id": "tr4",
        "type": "choice",
        "text": "Как восстановить доверие, если оно пошатнулось?",
        "textEn": "How do you rebuild trust when it's shaken?",
        "options": [
          {
            "id": "talk",
            "label": "Долгий честный разговор",
            "labelEn": "A long honest talk"
          },
          {
            "id": "time",
            "label": "Время и последовательность",
            "labelEn": "Time and consistency"
          },
          {
            "id": "actions",
            "label": "Дела, а не только слова",
            "labelEn": "Actions, not just words"
          }
        ]
      }
    ]
  },
  {
    "id": "conflict_style",
    "emoji": "⚡",
    "title": "Стиль конфликтов",
    "titleEn": "Conflict style",
    "questions": [
      {
        "id": "co1",
        "type": "choice",
        "text": "Когда мы ссоримся, ты обычно...",
        "textEn": "When we argue, you usually...",
        "options": [
          {
            "id": "withdraw",
            "label": "Замыкаешься и молчишь",
            "labelEn": "Withdraw and go quiet"
          },
          {
            "id": "express",
            "label": "Выражаешь эмоции сразу",
            "labelEn": "Express emotions right away"
          },
          {
            "id": "analyze",
            "label": "Пытаешься разобраться логически",
            "labelEn": "Try to analyze logically"
          }
        ]
      },
      {
        "id": "co2",
        "type": "text",
        "text": "О чём нам сложнее всего спорить, но важно обсудить?",
        "textEn": "What's hardest for us to argue about but important to discuss?"
      },
      {
        "id": "co3",
        "type": "choice",
        "text": "Что помогает тебе не наговорить лишнего в ссоре?",
        "textEn": "What helps you not say too much in a fight?",
        "options": [
          {
            "id": "pause",
            "label": "Пауза и выход из комнаты",
            "labelEn": "A pause and stepping away"
          },
          {
            "id": "breathe",
            "label": "Глубокое дыхание",
            "labelEn": "Deep breathing"
          },
          {
            "id": "remind",
            "label": "Напомнить себе, что мы — команда",
            "labelEn": "Remind myself we're a team"
          }
        ]
      },
      {
        "id": "co4",
        "type": "text",
        "text": "Какой урок из прошлых конфликтов помог бы нам сейчас?",
        "textEn": "What lesson from past conflicts would help us now?"
      }
    ]
  },
  {
    "id": "saying_sorry",
    "emoji": "🕊️",
    "title": "Искренние извинения",
    "titleEn": "Saying sorry",
    "questions": [
      {
        "id": "so1",
        "type": "choice",
        "text": "Как ты обычно извиняешься?",
        "textEn": "How do you usually apologize?",
        "options": [
          {
            "id": "words",
            "label": "Словами — «прости»",
            "labelEn": "With words — \"sorry\""
          },
          {
            "id": "actions",
            "label": "Делами и заботой",
            "labelEn": "Through actions and care"
          },
          {
            "id": "time",
            "label": "Нужно время, потом говорю",
            "labelEn": "Need time, then I speak"
          }
        ]
      },
      {
        "id": "so2",
        "type": "text",
        "text": "Какое извинение от меня тебе запомнилось больше всего?",
        "textEn": "Which apology from me stuck with you the most?"
      },
      {
        "id": "so3",
        "type": "choice",
        "text": "Что делает извинение настоящим для тебя?",
        "textEn": "What makes an apology feel genuine to you?",
        "options": [
          {
            "id": "acknowledge",
            "label": "Признание своей ошибки",
            "labelEn": "Acknowledging the mistake"
          },
          {
            "id": "change",
            "label": "Попытка измениться",
            "labelEn": "Trying to change"
          },
          {
            "id": "patience",
            "label": "Терпение с моими чувствами",
            "labelEn": "Patience with my feelings"
          }
        ]
      },
      {
        "id": "so4",
        "type": "text",
        "text": "За что ты хотел(а) бы извиниться передо мной прямо сейчас?",
        "textEn": "What would you like to apologize to me for right now?"
      }
    ]
  },
  {
    "id": "jealousy_talk",
    "emoji": "💚",
    "title": "Ревность и честность",
    "titleEn": "Jealousy & honesty",
    "questions": [
      {
        "id": "je1",
        "type": "choice",
        "text": "Как ты относишься к лёгкой ревности?",
        "textEn": "How do you feel about mild jealousy?",
        "options": [
          {
            "id": "normal",
            "label": "Это нормально — значит, не всё равно",
            "labelEn": "Normal — it means you care"
          },
          {
            "id": "uncomfortable",
            "label": "Некомфортно, но бывает",
            "labelEn": "Uncomfortable, but it happens"
          },
          {
            "id": "avoid",
            "label": "Стараюсь не ревновать",
            "labelEn": "I try not to be jealous"
          }
        ]
      },
      {
        "id": "je2",
        "type": "text",
        "text": "Что помогает тебе чувствовать себя уверенно в отношениях?",
        "textEn": "What helps you feel secure in our relationship?"
      },
      {
        "id": "je3",
        "type": "choice",
        "text": "Как лучше говорить о ревности?",
        "textEn": "What's the best way to talk about jealousy?",
        "options": [
          {
            "id": "direct",
            "label": "Прямо и без обвинений",
            "labelEn": "Directly, without blame"
          },
          {
            "id": "humor",
            "label": "С юмором и лёгкостью",
            "labelEn": "With humor and lightness"
          },
          {
            "id": "later",
            "label": "Когда эмоции улеглись",
            "labelEn": "When emotions have settled"
          }
        ]
      },
      {
        "id": "je4",
        "type": "text",
        "text": "Был ли момент, когда ревность научила нас чему-то важному?",
        "textEn": "Was there a moment when jealousy taught us something important?"
      }
    ]
  },
  {
    "id": "personal_space",
    "emoji": "🚪",
    "title": "Личное пространство",
    "titleEn": "Personal space",
    "questions": [
      {
        "id": "ps1",
        "type": "choice",
        "text": "Сколько времени наедине с собой тебе нужно в неделю?",
        "textEn": "How much alone time do you need per week?",
        "options": [
          {
            "id": "daily",
            "label": "Хотя бы час каждый день",
            "labelEn": "At least an hour daily"
          },
          {
            "id": "few",
            "label": "Несколько раз в неделю",
            "labelEn": "A few times a week"
          },
          {
            "id": "little",
            "label": "Мало — я энергичнее рядом с тобой",
            "labelEn": "Little — I'm energized with you"
          }
        ]
      },
      {
        "id": "ps2",
        "type": "text",
        "text": "Чем ты занимаешься, когда хочешь побыть одному(одной)?",
        "textEn": "What do you do when you want to be alone?"
      },
      {
        "id": "ps3",
        "type": "choice",
        "text": "Как ты реагируешь, когда я прошу побыть одному?",
        "textEn": "How do you react when I ask for alone time?",
        "options": [
          {
            "id": "support",
            "label": "Поддерживаю без обид",
            "labelEn": "Support without taking offense"
          },
          {
            "id": "worry",
            "label": "Немного переживаю",
            "labelEn": "Worry a little"
          },
          {
            "id": "use",
            "label": "Использую время для себя тоже",
            "labelEn": "Use the time for myself too"
          }
        ]
      },
      {
        "id": "ps4",
        "type": "text",
        "text": "Как нам найти баланс между «вместе» и «отдельно»?",
        "textEn": "How can we balance \"together\" and \"apart\"?"
      }
    ]
  },
  {
    "id": "couple_rituals",
    "emoji": "🕯️",
    "title": "Ритуалы пары",
    "titleEn": "Couple rituals",
    "questions": [
      {
        "id": "cr1",
        "type": "text",
        "text": "Какой наш ритуал ты ценишь больше всего?",
        "textEn": "Which of our rituals do you value most?"
      },
      {
        "id": "cr2",
        "type": "choice",
        "text": "Какой новый ритуал ты хотел(а) бы завести?",
        "textEn": "What new ritual would you like to start?",
        "options": [
          {
            "id": "weekly",
            "label": "Еженедельное свидание",
            "labelEn": "A weekly date night"
          },
          {
            "id": "morning",
            "label": "Утренний ритуал",
            "labelEn": "A morning ritual"
          },
          {
            "id": "goodnight",
            "label": "Вечернее «спокойной ночи»",
            "labelEn": "An evening goodnight ritual"
          }
        ]
      },
      {
        "id": "cr3",
        "type": "text",
        "text": "Есть ли ритуал, который мы потеряли и стоит вернуть?",
        "textEn": "Is there a ritual we lost that's worth bringing back?"
      },
      {
        "id": "cr4",
        "type": "choice",
        "text": "Ритуалы для тебя — это...",
        "textEn": "Rituals for you are...",
        "options": [
          {
            "id": "anchor",
            "label": "Якорь стабильности",
            "labelEn": "An anchor of stability"
          },
          {
            "id": "romance",
            "label": "Способ сохранить романтику",
            "labelEn": "A way to keep romance alive"
          },
          {
            "id": "fun",
            "label": "Повод для радости",
            "labelEn": "An excuse for joy"
          }
        ]
      }
    ]
  },
  {
    "id": "date_night_ideas",
    "emoji": "🌹",
    "title": "Идеи для свиданий",
    "titleEn": "Date night ideas",
    "questions": [
      {
        "id": "dn1",
        "type": "image",
        "text": "Какое свидание тебе ближе?",
        "textEn": "Which date feels more like you?",
        "imageKeys": [
          "restaurant_candle",
          "picnic_park"
        ],
        "imageLabels": [
          "Романтический ресторан",
          "Пикник в парке"
        ],
        "imageLabelsEn": [
          "Candlelit restaurant",
          "Picnic in the park"
        ]
      },
      {
        "id": "dn2",
        "type": "choice",
        "text": "Как часто тебе нужны «настоящие» свидания?",
        "textEn": "How often do you need real date nights?",
        "options": [
          {
            "id": "weekly",
            "label": "Раз в неделю",
            "labelEn": "Once a week"
          },
          {
            "id": "biweekly",
            "label": "Раз в две недели",
            "labelEn": "Every two weeks"
          },
          {
            "id": "monthly",
            "label": "Раз в месяц — но особенные",
            "labelEn": "Once a month — but special"
          }
        ]
      },
      {
        "id": "dn3",
        "type": "text",
        "text": "Какое свидание из наших ты бы повторил(а)?",
        "textEn": "Which of our dates would you repeat?"
      },
      {
        "id": "dn4",
        "type": "choice",
        "text": "Идеальное свидание без телефонов — это...",
        "textEn": "The perfect phone-free date is...",
        "options": [
          {
            "id": "walk",
            "label": "Долгая прогулка",
            "labelEn": "A long walk"
          },
          {
            "id": "cook",
            "label": "Готовка вместе",
            "labelEn": "Cooking together"
          },
          {
            "id": "surprise",
            "label": "Сюрприз от партнёра",
            "labelEn": "A surprise from my partner"
          }
        ]
      }
    ]
  },
  {
    "id": "weekend_vibes",
    "emoji": "🛋️",
    "title": "Выходные вдвоём",
    "titleEn": "Weekend vibes",
    "questions": [
      {
        "id": "wv1",
        "type": "choice",
        "text": "Идеальные выходные для тебя — это...",
        "textEn": "Your ideal weekend is...",
        "options": [
          {
            "id": "active",
            "label": "Активность и приключения",
            "labelEn": "Activity and adventure"
          },
          {
            "id": "lazy",
            "label": "Лень и сериалы",
            "labelEn": "Laziness and shows"
          },
          {
            "id": "mix",
            "label": "Микс отдыха и дел",
            "labelEn": "A mix of rest and errands"
          }
        ]
      },
      {
        "id": "wv2",
        "type": "text",
        "text": "Какой последний выходной с тобой запомнился особенно?",
        "textEn": "Which recent weekend with you stood out?"
      },
      {
        "id": "wv3",
        "type": "choice",
        "text": "Как ты относишься к планам на выходные?",
        "textEn": "How do you feel about weekend plans?",
        "options": [
          {
            "id": "plan",
            "label": "Люблю заранее планировать",
            "labelEn": "Love planning ahead"
          },
          {
            "id": "spontaneous",
            "label": "Спontanно — как пойдёт",
            "labelEn": "Spontaneous — see how it goes"
          },
          {
            "id": "flexible",
            "label": "Один день по плану, один — нет",
            "labelEn": "One planned day, one free"
          }
        ]
      },
      {
        "id": "wv4",
        "type": "text",
        "text": "Что бы ты хотел(а) сделать в ближайшие выходные?",
        "textEn": "What would you like to do this coming weekend?"
      }
    ]
  },
  {
    "id": "home_chores",
    "emoji": "🧹",
    "title": "Домашние дела",
    "titleEn": "Home chores",
    "questions": [
      {
        "id": "hc1",
        "type": "choice",
        "text": "Какое домашнее дело тебе нравится больше всего?",
        "textEn": "Which chore do you actually enjoy most?",
        "options": [
          {
            "id": "cooking",
            "label": "Готовка",
            "labelEn": "Cooking"
          },
          {
            "id": "cleaning",
            "label": "Уборка — терапия",
            "labelEn": "Cleaning — it's therapeutic"
          },
          {
            "id": "none",
            "label": "Ни одно 😅",
            "labelEn": "None of them 😅"
          }
        ]
      },
      {
        "id": "hc2",
        "type": "text",
        "text": "Как мы можем честнее делить обязанности дома?",
        "textEn": "How can we split household duties more fairly?"
      },
      {
        "id": "hc3",
        "type": "choice",
        "text": "Когда партнёр делает дела без напоминания, ты...",
        "textEn": "When your partner does chores without being asked, you...",
        "options": [
          {
            "id": "grateful",
            "label": "Безмерно благодарен(на)",
            "labelEn": "Feel incredibly grateful"
          },
          {
            "id": "noticed",
            "label": "Замечаю и ценю",
            "labelEn": "Notice and appreciate it"
          },
          {
            "id": "expected",
            "label": "Это норма в паре",
            "labelEn": "It's normal in a couple"
          }
        ]
      },
      {
        "id": "hc4",
        "type": "text",
        "text": "Какой бытовой лайфхак ты хочешь внедрить вместе?",
        "textEn": "What household life hack do you want us to try together?"
      }
    ]
  },
  {
    "id": "cooking_bond",
    "emoji": "👨‍🍳",
    "title": "Готовим вместе",
    "titleEn": "Cooking together",
    "questions": [
      {
        "id": "cb1",
        "type": "text",
        "text": "Какое блюдо мы готовили вместе лучше всего?",
        "textEn": "What dish did we cook together best?"
      },
      {
        "id": "cb2",
        "type": "choice",
        "text": "Твоя роль на кухне в паре — это...",
        "textEn": "Your role in the kitchen as a couple is...",
        "options": [
          {
            "id": "chef",
            "label": "Шеф-повар",
            "labelEn": "Head chef"
          },
          {
            "id": "sous",
            "label": "Помощник",
            "labelEn": "Sous chef"
          },
          {
            "id": "taster",
            "label": "Дегустатор и моральная поддержка",
            "labelEn": "Taster and moral support"
          }
        ]
      },
      {
        "id": "cb3",
        "type": "text",
        "text": "Какое блюдо ты хочешь научиться готовить со мной?",
        "textEn": "What dish do you want to learn to cook with me?"
      },
      {
        "id": "cb4",
        "type": "choice",
        "text": "Музыка на кухне — это...",
        "textEn": "Music in the kitchen is...",
        "options": [
          {
            "id": "must",
            "label": "Обязательно!",
            "labelEn": "A must!"
          },
          {
            "id": "sometimes",
            "label": "Иногда для настроения",
            "labelEn": "Sometimes for the mood"
          },
          {
            "id": "quiet",
            "label": "Лучше тишина и болтовня",
            "labelEn": "Prefer quiet and conversation"
          }
        ]
      }
    ]
  },
  {
    "id": "money_matters",
    "emoji": "💰",
    "title": "Разговор о деньгах",
    "titleEn": "Money matters",
    "questions": [
      {
        "id": "mo1",
        "type": "choice",
        "text": "Как ты относишься к совместным тратам?",
        "textEn": "How do you feel about shared expenses?",
        "options": [
          {
            "id": "equal",
            "label": "Поровну — всё честно",
            "labelEn": "Split equally — fair"
          },
          {
            "id": "flexible",
            "label": "Гибко — кто сколько может",
            "labelEn": "Flexible — whoever can"
          },
          {
            "id": "separate",
            "label": "Часть отдельно, часть вместе",
            "labelEn": "Part separate, part together"
          }
        ]
      },
      {
        "id": "mo2",
        "type": "text",
        "text": "О каких финансовых целях ты мечтаешь вместе со мной?",
        "textEn": "What financial goals do you dream about with me?"
      },
      {
        "id": "mo3",
        "type": "choice",
        "text": "Разговоры о деньгах для тебя...",
        "textEn": "Talking about money for you is...",
        "options": [
          {
            "id": "easy",
            "label": "Легко и открыто",
            "labelEn": "Easy and open"
          },
          {
            "id": "hard",
            "label": "Сложно, но важно",
            "labelEn": "Hard, but important"
          },
          {
            "id": "avoid",
            "label": "Стараюсь избегать",
            "labelEn": "I try to avoid it"
          }
        ]
      },
      {
        "id": "mo4",
        "type": "text",
        "text": "Какая покупка «для нас» принесла бы больше всего радости?",
        "textEn": "What purchase 'for us' would bring the most joy?"
      }
    ]
  },
  {
    "id": "shared_savings",
    "emoji": "🏦",
    "title": "Общие накопления",
    "titleEn": "Shared savings",
    "questions": [
      {
        "id": "sa1",
        "type": "text",
        "text": "На что ты хотел(а) бы копить вместе в первую очередь?",
        "textEn": "What would you want to save for together first?"
      },
      {
        "id": "sa2",
        "type": "choice",
        "text": "Стиль накоплений — какой твой?",
        "textEn": "What's your saving style?",
        "options": [
          {
            "id": "steady",
            "label": "Регулярно понемногу",
            "labelEn": "Steady small amounts"
          },
          {
            "id": "goal",
            "label": "На конкретную цель",
            "labelEn": "For a specific goal"
          },
          {
            "id": "spontaneous",
            "label": "Когда получается",
            "labelEn": "Whenever we can"
          }
        ]
      },
      {
        "id": "sa3",
        "type": "text",
        "text": "Какая финансовая привычка из детства повлияла на тебя?",
        "textEn": "Which money habit from childhood shaped you?"
      },
      {
        "id": "sa4",
        "type": "choice",
        "text": "Если бы у нас появилась «копилка мечты», что в ней было бы?",
        "textEn": "If we had a 'dream piggy bank', what would be in it?",
        "options": [
          {
            "id": "travel",
            "label": "Путешествие",
            "labelEn": "A trip"
          },
          {
            "id": "home",
            "label": "Дом или ремонт",
            "labelEn": "Home or renovation"
          },
          {
            "id": "experience",
            "label": "Незабываемый опыт",
            "labelEn": "An unforgettable experience"
          }
        ]
      }
    ]
  },
  {
    "id": "career_cheers",
    "emoji": "🎯",
    "title": "Поддержка в карьере",
    "titleEn": "Career support",
    "questions": [
      {
        "id": "cc1",
        "type": "text",
        "text": "Как я могу лучше поддерживать тебя в работе?",
        "textEn": "How can I better support you at work?"
      },
      {
        "id": "cc2",
        "type": "choice",
        "text": "Когда у тебя тяжёлый день на работе, тебе нужно...",
        "textEn": "When you have a tough day at work, you need...",
        "options": [
          {
            "id": "listen",
            "label": "Чтобы выслушали",
            "labelEn": "Someone to listen"
          },
          {
            "id": "distraction",
            "label": "Отвлечься и переключиться",
            "labelEn": "Distraction and a change of pace"
          },
          {
            "id": "advice",
            "label": "Совет или помощь",
            "labelEn": "Advice or help"
          }
        ]
      },
      {
        "id": "cc3",
        "type": "text",
        "text": "Какой твой профессиональный успех ты хочешь отпраздновать со мной?",
        "textEn": "Which professional win do you want to celebrate with me?"
      },
      {
        "id": "cc4",
        "type": "choice",
        "text": "Карьера vs отношения — как ты видишь баланс?",
        "textEn": "Career vs relationship — how do you see the balance?",
        "options": [
          {
            "id": "both",
            "label": "Оба важны — ищу баланс",
            "labelEn": "Both matter — I seek balance"
          },
          {
            "id": "career",
            "label": "Сейчас карьера в приоритете",
            "labelEn": "Career is the priority now"
          },
          {
            "id": "us",
            "label": "Мы важнее любой работы",
            "labelEn": "Us matters more than any job"
          }
        ]
      }
    ]
  },
  {
    "id": "work_balance",
    "emoji": "⚖️",
    "title": "Баланс работы и любви",
    "titleEn": "Work-life balance",
    "questions": [
      {
        "id": "wb1",
        "type": "choice",
        "text": "Когда ты «приносишь работу домой», это...",
        "textEn": "When you 'bring work home', it's...",
        "options": [
          {
            "id": "stress",
            "label": "Стресс, о котором хочу рассказать",
            "labelEn": "Stress I want to talk about"
          },
          {
            "id": "silence",
            "label": "Молчание — не хочу грузить",
            "labelEn": "Silence — I don't want to burden you"
          },
          {
            "id": "rare",
            "label": "Редко — умею отключаться",
            "labelEn": "Rare — I'm good at switching off"
          }
        ]
      },
      {
        "id": "wb2",
        "type": "text",
        "text": "Как мы можем защитить наше время от рабочих звонков?",
        "textEn": "How can we protect our time from work calls?"
      },
      {
        "id": "wb3",
        "type": "choice",
        "text": "Идеальный вечер после рабочего дня — это...",
        "textEn": "The ideal evening after work is...",
        "options": [
          {
            "id": "talk",
            "label": "Рассказать друг другу о дне",
            "labelEn": "Tell each other about our day"
          },
          {
            "id": "relax",
            "label": "Молча отдохнуть рядом",
            "labelEn": "Quietly rest together"
          },
          {
            "id": "activity",
            "label": "Что-то активное",
            "labelEn": "Something active"
          }
        ]
      },
      {
        "id": "wb4",
        "type": "text",
        "text": "Что помогает тебе переключиться с «рабочего режима» на «домашний»?",
        "textEn": "What helps you switch from 'work mode' to 'home mode'?"
      }
    ]
  },
  {
    "id": "big_dreams",
    "emoji": "🌟",
    "title": "Большие мечты",
    "titleEn": "Big dreams",
    "questions": [
      {
        "id": "bd1",
        "type": "text",
        "text": "Какая мечта кажется безумной, но ты всё равно о ней думаешь?",
        "textEn": "What dream seems crazy but you still think about it?"
      },
      {
        "id": "bd2",
        "type": "choice",
        "text": "Мечты для тебя — это...",
        "textEn": "Dreams for you are...",
        "options": [
          {
            "id": "fuel",
            "label": "Топливо для жизни",
            "labelEn": "Fuel for life"
          },
          {
            "id": "guide",
            "label": "Комpass к целям",
            "labelEn": "A compass to goals"
          },
          {
            "id": "fun",
            "label": "Просто приятно фантазировать",
            "labelEn": "Just fun to fantasize"
          }
        ]
      },
      {
        "id": "bd3",
        "type": "text",
        "text": "Какую мечту ты хочешь, чтобы мы осуществили в ближайшие 3 года?",
        "textEn": "Which dream do you want us to achieve in the next 3 years?"
      },
      {
        "id": "bd4",
        "type": "choice",
        "text": "Если бы деньги не были проблемой, что бы мы сделали завтра?",
        "textEn": "If money weren't an issue, what would we do tomorrow?",
        "options": [
          {
            "id": "travel",
            "label": "Отправились в кругосветку",
            "labelEn": "Go on a round-the-world trip"
          },
          {
            "id": "home",
            "label": "Построили дом мечты",
            "labelEn": "Build our dream home"
          },
          {
            "id": "help",
            "label": "Помогли близким и проектам",
            "labelEn": "Help loved ones and causes"
          }
        ]
      }
    ]
  },
  {
    "id": "hobbies_share",
    "emoji": "🎨",
    "title": "Хобби и увлечения",
    "titleEn": "Hobbies & passions",
    "questions": [
      {
        "id": "ho1",
        "type": "choice",
        "text": "Хочешь ли ты, чтобы я разделял(а) твоё хобби?",
        "textEn": "Do you want me to share your hobby?",
        "options": [
          {
            "id": "yes",
            "label": "Да — это сближает",
            "labelEn": "Yes — it brings us closer"
          },
          {
            "id": "partly",
            "label": "Иногда — но и своё нужно",
            "labelEn": "Sometimes — but I need my own too"
          },
          {
            "id": "no",
            "label": "Нет — пусть будет моим",
            "labelEn": "No — let it stay mine"
          }
        ]
      },
      {
        "id": "ho2",
        "type": "text",
        "text": "Какое моё увлечение тебя удивило или восхитило?",
        "textEn": "Which of my hobbies surprised or impressed you?"
      },
      {
        "id": "ho3",
        "type": "choice",
        "text": "Совместное хобби — это...",
        "textEn": "A shared hobby is...",
        "options": [
          {
            "id": "dream",
            "label": "Мечта — найти своё",
            "labelEn": "A dream — to find ours"
          },
          {
            "id": "have",
            "label": "У нас уже есть!",
            "labelEn": "We already have one!"
          },
          {
            "id": "optional",
            "label": "Не обязательно",
            "labelEn": "Not necessary"
          }
        ]
      },
      {
        "id": "ho4",
        "type": "text",
        "text": "Какое новое увлечение ты хотел(а) бы попробовать вместе?",
        "textEn": "What new hobby would you like to try together?"
      }
    ]
  },
  {
    "id": "learn_together",
    "emoji": "📚",
    "title": "Учимся вместе",
    "titleEn": "Learning together",
    "questions": [
      {
        "id": "lt1",
        "type": "text",
        "text": "Чему бы ты хотел(а) научиться вместе со мной?",
        "textEn": "What would you like to learn together with me?"
      },
      {
        "id": "lt2",
        "type": "choice",
        "text": "Когда я учусь чему-то новому, ты...",
        "textEn": "When I'm learning something new, you...",
        "options": [
          {
            "id": "support",
            "label": "Поддерживаешь и интересуешься",
            "labelEn": "Support and show interest"
          },
          {
            "id": "join",
            "label": "Присоединяешься",
            "labelEn": "Join in"
          },
          {
            "id": "space",
            "label": "Даёшь пространство",
            "labelEn": "Give me space"
          }
        ]
      },
      {
        "id": "lt3",
        "type": "text",
        "text": "Был ли момент, когда мы чему-то научили друг друга?",
        "textEn": "Was there a moment when we taught each other something?"
      },
      {
        "id": "lt4",
        "type": "choice",
        "text": "Идеальный «учебный» вечер вдвоём — это...",
        "textEn": "The ideal 'learning' evening together is...",
        "options": [
          {
            "id": "language",
            "label": "Изучение языка",
            "labelEn": "Learning a language"
          },
          {
            "id": "skill",
            "label": "Новый навык — танцы, рисование",
            "labelEn": "A new skill — dance, drawing"
          },
          {
            "id": "documentary",
            "label": "Документалка и обсуждение",
            "labelEn": "A documentary and discussion"
          }
        ]
      }
    ]
  },
  {
    "id": "reading_pair",
    "emoji": "📖",
    "title": "Читаем вместе",
    "titleEn": "Reading together",
    "questions": [
      {
        "id": "rd1",
        "type": "choice",
        "text": "Читать одну книгу вдвоём — это...",
        "textEn": "Reading one book together is...",
        "options": [
          {
            "id": "romantic",
            "label": "Романтично и уютно",
            "labelEn": "Romantic and cozy"
          },
          {
            "id": "fun",
            "label": "Весело — обсуждать главы",
            "labelEn": "Fun — discussing chapters"
          },
          {
            "id": "hard",
            "label": "Сложно — разные темпы",
            "labelEn": "Hard — different paces"
          }
        ]
      },
      {
        "id": "rd2",
        "type": "text",
        "text": "Какая книга могла бы стать «нашей»?",
        "textEn": "Which book could become 'ours'?"
      },
      {
        "id": "rd3",
        "type": "text",
        "text": "Расскажи о книге или истории, которая тебя тронула недавно",
        "textEn": "Tell me about a book or story that moved you recently"
      },
      {
        "id": "rd4",
        "type": "choice",
        "text": "Перед сном ты предпочитаешь...",
        "textEn": "Before bed you prefer...",
        "options": [
          {
            "id": "read",
            "label": "Читать",
            "labelEn": "Reading"
          },
          {
            "id": "talk",
            "label": "Разговаривать",
            "labelEn": "Talking"
          },
          {
            "id": "screen",
            "label": "Сериал или телефон",
            "labelEn": "A show or phone"
          }
        ]
      }
    ]
  },
  {
    "id": "gaming_us",
    "emoji": "🎮",
    "title": "Играем вместе",
    "titleEn": "Gaming together",
    "questions": [
      {
        "id": "gu1",
        "type": "choice",
        "text": "Совместные игры — это...",
        "textEn": "Playing games together is...",
        "options": [
          {
            "id": "love",
            "label": "Наш способ повеселиться",
            "labelEn": "Our way to have fun"
          },
          {
            "id": "sometimes",
            "label": "Иногда — зависит от игры",
            "labelEn": "Sometimes — depends on the game"
          },
          {
            "id": "competitive",
            "label": "Соревнование — я хочу выиграть!",
            "labelEn": "Competition — I want to win!"
          }
        ]
      },
      {
        "id": "gu2",
        "type": "text",
        "text": "Какая игра или настолка лучше всего показывает наш характер?",
        "textEn": "Which game or board game best shows our personalities?"
      },
      {
        "id": "gu3",
        "type": "choice",
        "text": "Когда я выигрываю, ты...",
        "textEn": "When I win, you...",
        "options": [
          {
            "id": "happy",
            "label": "Рад(а) за меня",
            "labelEn": "Happy for me"
          },
          {
            "id": "rematch",
            "label": "Хочешь реванш",
            "labelEn": "Want a rematch"
          },
          {
            "id": "sore",
            "label": "Немного обидно 😄",
            "labelEn": "A bit sore 😄"
          }
        ]
      },
      {
        "id": "gu4",
        "type": "text",
        "text": "В какую игру ты хотел(а) бы сыграть со мной впервые?",
        "textEn": "What game would you like to play with me for the first time?"
      }
    ]
  },
  {
    "id": "creative_us",
    "emoji": "✏️",
    "title": "Творим вместе",
    "titleEn": "Creating together",
    "questions": [
      {
        "id": "cu1",
        "type": "text",
        "text": "Какой совместный творческий проект ты представляешь?",
        "textEn": "What creative project together do you imagine?"
      },
      {
        "id": "cu2",
        "type": "choice",
        "text": "Творчество в паре — это...",
        "textEn": "Creativity as a couple is...",
        "options": [
          {
            "id": "bond",
            "label": "Способ сблизиться",
            "labelEn": "A way to bond"
          },
          {
            "id": "separate",
            "label": "Каждый своё, но рядом",
            "labelEn": "Each our own, but together"
          },
          {
            "id": "new",
            "label": "Хочу попробовать",
            "labelEn": "Want to try it"
          }
        ]
      },
      {
        "id": "cu3",
        "type": "text",
        "text": "Что бы мы создали, если бы у нас был один свободный день?",
        "textEn": "What would we create if we had one free day?"
      },
      {
        "id": "cu4",
        "type": "choice",
        "text": "Когда я творю, ты...",
        "textEn": "When I'm being creative, you...",
        "options": [
          {
            "id": "watch",
            "label": "Любишь наблюдать",
            "labelEn": "Love to watch"
          },
          {
            "id": "join",
            "label": "Присоединяешься",
            "labelEn": "Join in"
          },
          {
            "id": "inspire",
            "label": "Вдохновляешь идеями",
            "labelEn": "Inspire with ideas"
          }
        ]
      }
    ]
  },
  {
    "id": "art_dates",
    "emoji": "🖼️",
    "title": "Свидания с искусством",
    "titleEn": "Art dates",
    "questions": [
      {
        "id": "ar1",
        "type": "image",
        "text": "Куда пойти на свидание?",
        "textEn": "Where would you go for a date?",
        "imageKeys": [
          "art_studio",
          "museum_art"
        ],
        "imageLabels": [
          "Творческая мастерская",
          "Музей искусств"
        ],
        "imageLabelsEn": [
          "Art studio",
          "Art museum"
        ]
      },
      {
        "id": "ar2",
        "type": "text",
        "text": "Какое произведение искусства ты хотел(а) бы увидеть вместе?",
        "textEn": "What artwork would you like to see together?"
      },
      {
        "id": "ar3",
        "type": "choice",
        "text": "Рисовать или лепить вместе — это...",
        "textEn": "Drawing or sculpting together is...",
        "options": [
          {
            "id": "fun",
            "label": "Весело, даже если криво",
            "labelEn": "Fun, even if it's messy"
          },
          {
            "id": "romantic",
            "label": "Романтично",
            "labelEn": "Romantic"
          },
          {
            "id": "stress",
            "label": "Стресс — я не умею",
            "labelEn": "Stressful — I'm not good at it"
          }
        ]
      },
      {
        "id": "ar4",
        "type": "text",
        "text": "Как искусство может стать частью нашей жизни?",
        "textEn": "How can art become part of our life together?"
      }
    ]
  },
  {
    "id": "fitness_pair",
    "emoji": "💪",
    "title": "Спорт вдвоём",
    "titleEn": "Fitness together",
    "questions": [
      {
        "id": "fp1",
        "type": "image",
        "text": "Какой формат активности ближе?",
        "textEn": "Which activity format feels closer?",
        "imageKeys": [
          "gym_couple",
          "yoga_calm"
        ],
        "imageLabels": [
          "Тренировка в зале",
          "Йога и спокойствие"
        ],
        "imageLabelsEn": [
          "Gym workout",
          "Yoga and calm"
        ]
      },
      {
        "id": "fp2",
        "type": "choice",
        "text": "Тренироваться вместе — это...",
        "textEn": "Working out together is...",
        "options": [
          {
            "id": "motivate",
            "label": "Мотивация не сдаваться",
            "labelEn": "Motivation not to quit"
          },
          {
            "id": "fun",
            "label": "Ещё один способ провести время",
            "labelEn": "Another way to spend time"
          },
          {
            "id": "solo",
            "label": "Лучше каждому своё",
            "labelEn": "Better solo for each of us"
          }
        ]
      },
      {
        "id": "fp3",
        "type": "text",
        "text": "Какой спортивный вызов ты хотел(а) бы принять вместе?",
        "textEn": "What fitness challenge would you take on together?"
      },
      {
        "id": "fp4",
        "type": "choice",
        "text": "После совместной тренировки ты...",
        "textEn": "After a workout together you...",
        "options": [
          {
            "id": "proud",
            "label": "Горд(а) друг другом",
            "labelEn": "Proud of each other"
          },
          {
            "id": "tired",
            "label": "Падаем на диван",
            "labelEn": "Collapse on the couch"
          },
          {
            "id": "food",
            "label": "Идём есть!",
            "labelEn": "Go eat!"
          }
        ]
      }
    ]
  },
  {
    "id": "wellness_us",
    "emoji": "🧘",
    "title": "Забота о себе",
    "titleEn": "Wellness together",
    "questions": [
      {
        "id": "we1",
        "type": "choice",
        "text": "Как ты заботишься о себе в стрессовые периоды?",
        "textEn": "How do you take care of yourself during stressful times?",
        "options": [
          {
            "id": "rest",
            "label": "Отдых и сон",
            "labelEn": "Rest and sleep"
          },
          {
            "id": "move",
            "label": "Движение и спорт",
            "labelEn": "Movement and exercise"
          },
          {
            "id": "talk",
            "label": "Разговор с близкими",
            "labelEn": "Talking to loved ones"
          }
        ]
      },
      {
        "id": "we2",
        "type": "text",
        "text": "Как я могу помочь тебе заботиться о себе?",
        "textEn": "How can I help you take care of yourself?"
      },
      {
        "id": "we3",
        "type": "choice",
        "text": "Совместные практики заботы — это...",
        "textEn": "Shared self-care practices are...",
        "options": [
          {
            "id": "want",
            "label": "Хочу попробовать — медитация, прогулки",
            "labelEn": "Want to try — meditation, walks"
          },
          {
            "id": "have",
            "label": "У нас уже есть",
            "labelEn": "We already have them"
          },
          {
            "id": "personal",
            "label": "Это личное",
            "labelEn": "That's personal"
          }
        ]
      },
      {
        "id": "we4",
        "type": "text",
        "text": "Какой ритуал заботы о себе ты хотел(а) бы добавить в нашу жизнь?",
        "textEn": "What self-care ritual would you add to our life?"
      }
    ]
  },
  {
    "id": "mental_health",
    "emoji": "🧠",
    "title": "Ментальное здоровье",
    "titleEn": "Mental health",
    "questions": [
      {
        "id": "mh1",
        "type": "text",
        "text": "Когда тебе тяжело эмоционально, что помогает больше всего?",
        "textEn": "When you're emotionally struggling, what helps most?"
      },
      {
        "id": "mh2",
        "type": "choice",
        "text": "Говорить о ментальном здоровье в паре — это...",
        "textEn": "Talking about mental health as a couple is...",
        "options": [
          {
            "id": "important",
            "label": "Очень важно",
            "labelEn": "Very important"
          },
          {
            "id": "learning",
            "label": "Учимся постепенно",
            "labelEn": "We're learning gradually"
          },
          {
            "id": "hard",
            "label": "Сложно, но пробуем",
            "labelEn": "Hard, but we try"
          }
        ]
      },
      {
        "id": "mh3",
        "type": "text",
        "text": "Какой знак от тебя говорит мне «мне нужна поддержка»?",
        "textEn": "What sign from you tells me 'I need support'?"
      },
      {
        "id": "mh4",
        "type": "choice",
        "text": "Когда я грущу, ты обычно...",
        "textEn": "When I'm sad, you usually...",
        "options": [
          {
            "id": "hold",
            "label": "Обнимаешь и молчишь",
            "labelEn": "Hug and stay quiet"
          },
          {
            "id": "talk",
            "label": "Спрашиваешь и слушаешь",
            "labelEn": "Ask and listen"
          },
          {
            "id": "cheer",
            "label": "Пытаешься развеселить",
            "labelEn": "Try to cheer me up"
          }
        ]
      }
    ]
  },
  {
    "id": "stress_support",
    "emoji": "🫂",
    "title": "Поддержка в стрессе",
    "titleEn": "Stress support",
    "questions": [
      {
        "id": "st1",
        "type": "choice",
        "text": "Твой главный источник стресса сейчас — это...",
        "textEn": "Your main source of stress right now is...",
        "options": [
          {
            "id": "work",
            "label": "Работа",
            "labelEn": "Work"
          },
          {
            "id": "life",
            "label": "Жизненные обстоятельства",
            "labelEn": "Life circumstances"
          },
          {
            "id": "relations",
            "label": "Отношения или семья",
            "labelEn": "Relationships or family"
          }
        ]
      },
      {
        "id": "st2",
        "type": "text",
        "text": "Что я могу сделать сегодня, чтобы облегчить твой день?",
        "textEn": "What can I do today to lighten your day?"
      },
      {
        "id": "st3",
        "type": "choice",
        "text": "Когда ты в стрессе, тебе лучше...",
        "textEn": "When you're stressed, you prefer...",
        "options": [
          {
            "id": "alone",
            "label": "Побыть одному(одной)",
            "labelEn": "To be alone"
          },
          {
            "id": "together",
            "label": "Быть рядом, даже молча",
            "labelEn": "Be together, even quietly"
          },
          {
            "id": "distraction",
            "label": "Отвлечься — фильм, прогулка",
            "labelEn": "Distraction — movie, walk"
          }
        ]
      },
      {
        "id": "st4",
        "type": "text",
        "text": "Какой момент показал, что мы справляемся со стрессом лучше вместе?",
        "textEn": "What moment showed we handle stress better together?"
      }
    ]
  },
  {
    "id": "pet_lovers",
    "emoji": "🐾",
    "title": "Любовь к питомцам",
    "titleEn": "Pet lovers",
    "questions": [
      {
        "id": "pl1",
        "type": "image",
        "text": "Какой питомец ближе к твоей душе?",
        "textEn": "Which pet is closer to your soul?",
        "imageKeys": [
          "puppy_cuddle",
          "cat_lap"
        ],
        "imageLabels": [
          "Собака — верный друг",
          "Кошка — уют на коленях"
        ],
        "imageLabelsEn": [
          "Dog — loyal friend",
          "Cat — cozy on your lap"
        ]
      },
      {
        "id": "pl2",
        "type": "text",
        "text": "Какое животное ты хотел(а) бы завести вместе?",
        "textEn": "What animal would you like to get together?"
      },
      {
        "id": "pl3",
        "type": "choice",
        "text": "Питомец в нашей паре — это...",
        "textEn": "A pet in our couple is...",
        "options": [
          {
            "id": "dream",
            "label": "Мечта!",
            "labelEn": "A dream!"
          },
          {
            "id": "maybe",
            "label": "Может быть, когда-нибудь",
            "labelEn": "Maybe someday"
          },
          {
            "id": "no",
            "label": "Не для нас",
            "labelEn": "Not for us"
          }
        ]
      },
      {
        "id": "pl4",
        "type": "text",
        "text": "Как бы мы назвали нашего воображаемого питомца?",
        "textEn": "What would we name our imaginary pet?"
      }
    ]
  },
  {
    "id": "future_pets",
    "emoji": "🐕",
    "title": "Питомцы будущего",
    "titleEn": "Future pets",
    "questions": [
      {
        "id": "fpt1",
        "type": "choice",
        "text": "Когда заводить питомца — лучше...",
        "textEn": "When is the best time to get a pet?",
        "options": [
          {
            "id": "now",
            "label": "Сейчас — почему ждать?",
            "labelEn": "Now — why wait?"
          },
          {
            "id": "stable",
            "label": "Когда стабилизируем быт",
            "labelEn": "When life is more stable"
          },
          {
            "id": "never",
            "label": "Не планируем",
            "labelEn": "Not planning to"
          }
        ]
      },
      {
        "id": "fpt2",
        "type": "text",
        "text": "Какие обязанности по уходу за питомцем ты готов(а) взять?",
        "textEn": "Which pet care duties are you ready to take on?"
      },
      {
        "id": "fpt3",
        "type": "choice",
        "text": "Собака или кошка — или что-то другое?",
        "textEn": "Dog or cat — or something else?",
        "options": [
          {
            "id": "dog",
            "label": "Собака",
            "labelEn": "Dog"
          },
          {
            "id": "cat",
            "label": "Кошка",
            "labelEn": "Cat"
          },
          {
            "id": "exotic",
            "label": "Что-то необычное — попугай, кролик",
            "labelEn": "Something unusual — parrot, rabbit"
          }
        ]
      },
      {
        "id": "fpt4",
        "type": "text",
        "text": "Как питомец изменил бы нашу повседневную жизнь?",
        "textEn": "How would a pet change our daily life?"
      }
    ]
  },
  {
    "id": "travel_ways",
    "emoji": "✈️",
    "title": "Как мы путешествуем",
    "titleEn": "How we travel",
    "questions": [
      {
        "id": "tw1",
        "type": "image",
        "text": "Какой транспорт для путешествия мечты?",
        "textEn": "What transport for a dream trip?",
        "imageKeys": [
          "airplane_window",
          "train_travel"
        ],
        "imageLabels": [
          "Самолёт — далеко и быстро",
          "Поезд — медленно и романтично"
        ],
        "imageLabelsEn": [
          "Plane — far and fast",
          "Train — slow and romantic"
        ]
      },
      {
        "id": "tw2",
        "type": "choice",
        "text": "В путешествии ты — это...",
        "textEn": "When traveling you are...",
        "options": [
          {
            "id": "planner",
            "label": "Планировщик маршрута",
            "labelEn": "The route planner"
          },
          {
            "id": "explorer",
            "label": "Исследователь без карты",
            "labelEn": "Explorer without a map"
          },
          {
            "id": "follower",
            "label": "Следую за партнёром",
            "labelEn": "Following my partner"
          }
        ]
      },
      {
        "id": "tw3",
        "type": "text",
        "text": "Какое наше путешествие ты бы назвал(а) идеальным?",
        "textEn": "Which of our trips would you call perfect?"
      },
      {
        "id": "tw4",
        "type": "choice",
        "text": "Сouvenir из поездки — это...",
        "textEn": "A souvenir from a trip is...",
        "options": [
          {
            "id": "thing",
            "label": "Предмет на память",
            "labelEn": "An object to remember"
          },
          {
            "id": "photo",
            "label": "Фото и впечатления",
            "labelEn": "Photos and memories"
          },
          {
            "id": "tradition",
            "label": "Новая традиция",
            "labelEn": "A new tradition"
          }
        ]
      }
    ]
  },
  {
    "id": "road_trips",
    "emoji": "🚗",
    "title": "Дорожные приключения",
    "titleEn": "Road trips",
    "questions": [
      {
        "id": "rt1",
        "type": "image",
        "text": "Идеальный road trip — это...",
        "textEn": "The ideal road trip is...",
        "imageKeys": [
          "roadtrip_car",
          "camping_tent"
        ],
        "imageLabels": [
          "Автомобиль и дорога",
          "Кемпинг под звёздами"
        ],
        "imageLabelsEn": [
          "Car and open road",
          "Camping under the stars"
        ]
      },
      {
        "id": "rt2",
        "type": "text",
        "text": "Какой маршрут ты мечтаешь проехать вместе?",
        "textEn": "What route do you dream of driving together?"
      },
      {
        "id": "rt3",
        "type": "choice",
        "text": "За рулём в паре — кто?",
        "textEn": "Who drives on couple road trips?",
        "options": [
          {
            "id": "me",
            "label": "Я",
            "labelEn": "Me"
          },
          {
            "id": "partner",
            "label": "Партнёр",
            "labelEn": "My partner"
          },
          {
            "id": "switch",
            "label": "Меняемся",
            "labelEn": "We switch"
          }
        ]
      },
      {
        "id": "rt4",
        "type": "text",
        "text": "Какая песня должна звучать в нашей машине мечты?",
        "textEn": "What song should play in our dream car?"
      }
    ]
  },
  {
    "id": "nature_walks",
    "emoji": "🌲",
    "title": "Прогулки на природе",
    "titleEn": "Nature walks",
    "questions": [
      {
        "id": "nw1",
        "type": "image",
        "text": "Куда пойти гулять вдвоём?",
        "textEn": "Where would you go for a walk together?",
        "imageKeys": [
          "forest_walk",
          "lake_calm"
        ],
        "imageLabels": [
          "Лесная тропа",
          "Спокойное озеро"
        ],
        "imageLabelsEn": [
          "Forest trail",
          "Calm lake"
        ]
      },
      {
        "id": "nw2",
        "type": "text",
        "text": "Какая прогулка на природе запомнилась тебе больше всего?",
        "textEn": "Which nature walk stuck with you most?"
      },
      {
        "id": "nw3",
        "type": "choice",
        "text": "Прогулки без телефона — это...",
        "textEn": "Phone-free walks are...",
        "options": [
          {
            "id": "need",
            "label": "Нужны нам регулярно",
            "labelEn": "We need them regularly"
          },
          {
            "id": "nice",
            "label": "Приятно, но редко",
            "labelEn": "Nice, but rare"
          },
          {
            "id": "hard",
            "label": "Сложно — привык(ла) к телефону",
            "labelEn": "Hard — I'm used to my phone"
          }
        ]
      },
      {
        "id": "nw4",
        "type": "text",
        "text": "Что ты замечаешь на прогулках, чего я могу не видеть?",
        "textEn": "What do you notice on walks that I might miss?"
      }
    ]
  },
  {
    "id": "city_dates",
    "emoji": "🏙️",
    "title": "Городские свидания",
    "titleEn": "City dates",
    "questions": [
      {
        "id": "cd1",
        "type": "choice",
        "text": "Идеальное городское свидание — это...",
        "textEn": "The ideal city date is...",
        "options": [
          {
            "id": "cafe",
            "label": "Кафе и долгий разговор",
            "labelEn": "Café and long talk"
          },
          {
            "id": "walk",
            "label": "Прогулка по незнакомым улицам",
            "labelEn": "Walk through unknown streets"
          },
          {
            "id": "event",
            "label": "Концерт, выставка, событие",
            "labelEn": "Concert, exhibition, event"
          }
        ]
      },
      {
        "id": "cd2",
        "type": "text",
        "text": "Какое место в городе ты хочешь показать мне?",
        "textEn": "What place in the city do you want to show me?"
      },
      {
        "id": "cd3",
        "type": "choice",
        "text": "Турист в своём городе — это...",
        "textEn": "Being a tourist in your own city is...",
        "options": [
          {
            "id": "fun",
            "label": "Весело — открываю новое",
            "labelEn": "Fun — discovering new things"
          },
          {
            "id": "rare",
            "label": "Редко, но стоит попробовать",
            "labelEn": "Rare, but worth trying"
          },
          {
            "id": "no",
            "label": "Не моё",
            "labelEn": "Not my thing"
          }
        ]
      },
      {
        "id": "cd4",
        "type": "text",
        "text": "Куда бы ты сводил(а) меня, если бы я приехал(а) впервые?",
        "textEn": "Where would you take me if I visited for the first time?"
      }
    ]
  },
  {
    "id": "outdoor_fun",
    "emoji": "🏖️",
    "title": "Отдых на природе",
    "titleEn": "Outdoor fun",
    "questions": [
      {
        "id": "of1",
        "type": "image",
        "text": "Идеальный день на природе — это...",
        "textEn": "The ideal day outdoors is...",
        "imageKeys": [
          "sunset_beach",
          "stargazing"
        ],
        "imageLabels": [
          "Закат на пляже",
          "Наблюдение за звёздами"
        ],
        "imageLabelsEn": [
          "Sunset on the beach",
          "Stargazing"
        ]
      },
      {
        "id": "of2",
        "type": "text",
        "text": "Какой outdoor-активности ты хочешь попробовать вместе?",
        "textEn": "What outdoor activity do you want to try together?"
      },
      {
        "id": "of3",
        "type": "choice",
        "text": "Пикник или барбекю — что ближе?",
        "textEn": "Picnic or barbecue — what's closer?",
        "options": [
          {
            "id": "picnic",
            "label": "Пикник с пледом",
            "labelEn": "Picnic with a blanket"
          },
          {
            "id": "bbq",
            "label": "Барбекю с друзьями",
            "labelEn": "BBQ with friends"
          },
          {
            "id": "both",
            "label": "И то, и другое!",
            "labelEn": "Both!"
          }
        ]
      },
      {
        "id": "of4",
        "type": "text",
        "text": "Какой сезон лучше всего подходит для приключений вдвоём?",
        "textEn": "Which season is best for adventures together?"
      }
    ]
  },
  {
    "id": "seasons_us",
    "emoji": "🍂",
    "title": "Времена года",
    "titleEn": "Seasons together",
    "questions": [
      {
        "id": "se1",
        "type": "choice",
        "text": "Любимое время года для тебя — это...",
        "textEn": "Your favorite season is...",
        "options": [
          {
            "id": "spring",
            "label": "Весна — пробуждение",
            "labelEn": "Spring — awakening"
          },
          {
            "id": "summer",
            "label": "Лето — энергия",
            "labelEn": "Summer — energy"
          },
          {
            "id": "autumn",
            "label": "Осень — уют",
            "labelEn": "Autumn — coziness"
          },
          {
            "id": "winter",
            "label": "Зима — тепло дома",
            "labelEn": "Winter — warmth at home"
          }
        ]
      },
      {
        "id": "se2",
        "type": "text",
        "text": "Какое сезонное воспоминание с тобой самое тёплое?",
        "textEn": "Which seasonal memory with you is the warmest?"
      },
      {
        "id": "se3",
        "type": "choice",
        "text": "Как мы можем сделать каждый сезон особенным?",
        "textEn": "How can we make each season special?",
        "options": [
          {
            "id": "tradition",
            "label": "Сезонные традиции",
            "labelEn": "Seasonal traditions"
          },
          {
            "id": "trip",
            "label": "Мини-поездки",
            "labelEn": "Mini trips"
          },
          {
            "id": "home",
            "label": "Уют дома",
            "labelEn": "Cozy at home"
          }
        ]
      },
      {
        "id": "se4",
        "type": "text",
        "text": "Что ты ждёшь от следующего сезона вместе?",
        "textEn": "What are you looking forward to next season together?"
      }
    ]
  },
  {
    "id": "weather_mood",
    "emoji": "🌧️",
    "title": "Погода и настроение",
    "titleEn": "Weather & mood",
    "questions": [
      {
        "id": "wm1",
        "type": "image",
        "text": "Какая погода задаёт романтическое настроение?",
        "textEn": "Which weather sets a romantic mood?",
        "imageKeys": [
          "rainy_window",
          "snow_couple"
        ],
        "imageLabels": [
          "Дождь за окном",
          "Снежная прогулка"
        ],
        "imageLabelsEn": [
          "Rain at the window",
          "Snowy walk"
        ]
      },
      {
        "id": "wm2",
        "type": "choice",
        "text": "Плохая погода — это повод...",
        "textEn": "Bad weather is a reason to...",
        "options": [
          {
            "id": "cuddle",
            "label": "Устроиться дома вдвоём",
            "labelEn": "Cuddle up at home"
          },
          {
            "id": "brave",
            "label": "Выйти и гулять",
            "labelEn": "Go out anyway"
          },
          {
            "id": "sleep",
            "label": "Спать и отдыхать",
            "labelEn": "Sleep and rest"
          }
        ]
      },
      {
        "id": "wm3",
        "type": "text",
        "text": "Как погода влияет на твоё настроение в отношениях?",
        "textEn": "How does weather affect your mood in the relationship?"
      },
      {
        "id": "wm4",
        "type": "choice",
        "text": "Идеальный «дождливый» день вместе — это...",
        "textEn": "The ideal rainy day together is...",
        "options": [
          {
            "id": "movies",
            "label": "Фильмы и плед",
            "labelEn": "Movies and a blanket"
          },
          {
            "id": "cook",
            "label": "Готовка и чай",
            "labelEn": "Cooking and tea"
          },
          {
            "id": "walk",
            "label": "Прогулка под зонтом",
            "labelEn": "Walk under an umbrella"
          }
        ]
      }
    ]
  },
  {
    "id": "rainy_plans",
    "emoji": "☔",
    "title": "Планы на дождливый день",
    "titleEn": "Rainy day plans",
    "questions": [
      {
        "id": "rp1",
        "type": "text",
        "text": "Что мы делаем, когда за окном льёт дождь?",
        "textEn": "What do we do when it's pouring outside?"
      },
      {
        "id": "rp2",
        "type": "choice",
        "text": "Дождь для тебя — это...",
        "textEn": "Rain for you is...",
        "options": [
          {
            "id": "cozy",
            "label": "Уют и романтика",
            "labelEn": "Cozy and romantic"
          },
          {
            "id": "gloomy",
            "label": "Грусть и лень",
            "labelEn": "Gloom and laziness"
          },
          {
            "id": "neutral",
            "label": "Ничего особенного",
            "labelEn": "Nothing special"
          }
        ]
      },
      {
        "id": "rp3",
        "type": "text",
        "text": "Какой фильм или книга идеальны для дождливого дня вдвоём?",
        "textEn": "What movie or book is perfect for a rainy day together?"
      },
      {
        "id": "rp4",
        "type": "choice",
        "text": "Если бы мы застряли дома на три дня, что бы сделали?",
        "textEn": "If we were stuck home for three days, what would we do?",
        "options": [
          {
            "id": "projects",
            "label": "Домашние проекты",
            "labelEn": "Home projects"
          },
          {
            "id": "games",
            "label": "Игры и развлечения",
            "labelEn": "Games and fun"
          },
          {
            "id": "talk",
            "label": "Глубокие разговоры",
            "labelEn": "Deep conversations"
          }
        ]
      }
    ]
  },
  {
    "id": "home_decor",
    "emoji": "🏠",
    "title": "Стиль дома",
    "titleEn": "Home style",
    "questions": [
      {
        "id": "hd1",
        "type": "image",
        "text": "Какой интерьер тебе ближе?",
        "textEn": "Which interior feels more like you?",
        "imageKeys": [
          "boho_decor",
          "minimalist_home"
        ],
        "imageLabels": [
          "Бохо и уют",
          "Минимализм и свет"
        ],
        "imageLabelsEn": [
          "Boho and cozy",
          "Minimalism and light"
        ]
      },
      {
        "id": "hd2",
        "type": "text",
        "text": "Какая деталь интерьера делает дом «нашим»?",
        "textEn": "What interior detail makes a home 'ours'?"
      },
      {
        "id": "hd3",
        "type": "choice",
        "text": "Выбирать мебель вместе — это...",
        "textEn": "Choosing furniture together is...",
        "options": [
          {
            "id": "fun",
            "label": "Увлекательно",
            "labelEn": "Exciting"
          },
          {
            "id": "compromise",
            "label": "Компромиссы, но результат радует",
            "labelEn": "Compromises, but the result delights"
          },
          {
            "id": "stress",
            "label": "Стресс — разные вкусы",
            "labelEn": "Stress — different tastes"
          }
        ]
      },
      {
        "id": "hd4",
        "type": "text",
        "text": "Какую комнату ты хочешь оформить вместе в первую очередь?",
        "textEn": "Which room do you want to decorate together first?"
      }
    ]
  },
  {
    "id": "cozy_home",
    "emoji": "🕯️",
    "title": "Уют дома",
    "titleEn": "Cozy home",
    "questions": [
      {
        "id": "cy1",
        "type": "choice",
        "text": "Что делает дом по-настоящему уютным для тебя?",
        "textEn": "What makes a home truly cozy for you?",
        "options": [
          {
            "id": "light",
            "label": "Мягкий свет и свечи",
            "labelEn": "Soft light and candles"
          },
          {
            "id": "textile",
            "label": "Пледы и подушки",
            "labelEn": "Blankets and pillows"
          },
          {
            "id": "smell",
            "label": "Запахи — выпечка, кофе",
            "labelEn": "Scents — baking, coffee"
          }
        ]
      },
      {
        "id": "cy2",
        "type": "text",
        "text": "Какой уютный момент дома ты любишь больше всего?",
        "textEn": "Which cozy moment at home do you love most?"
      },
      {
        "id": "cy3",
        "type": "choice",
        "text": "Идеальный вечер дома — это...",
        "textEn": "The ideal evening at home is...",
        "options": [
          {
            "id": "cook",
            "label": "Готовка и ужин",
            "labelEn": "Cooking and dinner"
          },
          {
            "id": "couch",
            "label": "Диван и сериал",
            "labelEn": "Couch and a show"
          },
          {
            "id": "bath",
            "label": "Ванна и расслабление",
            "labelEn": "Bath and relaxation"
          }
        ]
      },
      {
        "id": "cy4",
        "type": "text",
        "text": "Какой маленький штрих сделал бы наш дом ещё уютнее?",
        "textEn": "What small touch would make our home cozier?"
      }
    ]
  },
  {
    "id": "morning_ritual",
    "emoji": "☀️",
    "title": "Утренние ритуалы",
    "titleEn": "Morning rituals",
    "questions": [
      {
        "id": "mr1",
        "type": "image",
        "text": "Идеальное утро вдвоём — это...",
        "textEn": "The ideal morning together is...",
        "imageKeys": [
          "coffee_morning",
          "breakfast_bed"
        ],
        "imageLabels": [
          "Кофе и разговор",
          "Завтрак в постели"
        ],
        "imageLabelsEn": [
          "Coffee and conversation",
          "Breakfast in bed"
        ]
      },
      {
        "id": "mr2",
        "type": "choice",
        "text": "Ты — жаворонок или сова в паре?",
        "textEn": "Are you the early bird or night owl in the couple?",
        "options": [
          {
            "id": "lark",
            "label": "Жаворонок",
            "labelEn": "Early bird"
          },
          {
            "id": "owl",
            "label": "Сова",
            "labelEn": "Night owl"
          },
          {
            "id": "match",
            "label": "Мы совпадаем!",
            "labelEn": "We match!"
          }
        ]
      },
      {
        "id": "mr3",
        "type": "text",
        "text": "Какой утренний ритуал ты хотел(а) бы завести?",
        "textEn": "What morning ritual would you like to start?"
      },
      {
        "id": "mr4",
        "type": "choice",
        "text": "Просыпаться вместе — это...",
        "textEn": "Waking up together is...",
        "options": [
          {
            "id": "best",
            "label": "Лучшее начало дня",
            "labelEn": "The best start to the day"
          },
          {
            "id": "rare",
            "label": "Редкость — разные графики",
            "labelEn": "Rare — different schedules"
          },
          {
            "id": "hard",
            "label": "Сложно — нужен сон",
            "labelEn": "Hard — I need sleep"
          }
        ]
      }
    ]
  },
  {
    "id": "coffee_love",
    "emoji": "☕",
    "title": "Кофе и разговоры",
    "titleEn": "Coffee & talks",
    "questions": [
      {
        "id": "cl1",
        "type": "choice",
        "text": "Кофе или чай — что ближе?",
        "textEn": "Coffee or tea — what's closer?",
        "options": [
          {
            "id": "coffee",
            "label": "Кофе!",
            "labelEn": "Coffee!"
          },
          {
            "id": "tea",
            "label": "Чай",
            "labelEn": "Tea"
          },
          {
            "id": "both",
            "label": "Зависит от настроения",
            "labelEn": "Depends on the mood"
          }
        ]
      },
      {
        "id": "cl2",
        "type": "text",
        "text": "Какой разговор за чашкой кофе запомнился тебе?",
        "textEn": "What conversation over coffee stuck with you?"
      },
      {
        "id": "cl3",
        "type": "choice",
        "text": "Утренний кофе вместе — это...",
        "textEn": "Morning coffee together is...",
        "options": [
          {
            "id": "ritual",
            "label": "Наш ритуал",
            "labelEn": "Our ritual"
          },
          {
            "id": "luxury",
            "label": "Роскошь — редко получается",
            "labelEn": "A luxury — rarely happens"
          },
          {
            "id": "want",
            "label": "Хочу, чтобы было чаще",
            "labelEn": "Want it more often"
          }
        ]
      },
      {
        "id": "cl4",
        "type": "text",
        "text": "В каком кафе ты хотел(а) бы проводить со мной больше времени?",
        "textEn": "Which café would you like to spend more time with me in?"
      }
    ]
  },
  {
    "id": "dinner_us",
    "emoji": "🍽️",
    "title": "Ужин вдвоём",
    "titleEn": "Dinner together",
    "questions": [
      {
        "id": "di1",
        "type": "text",
        "text": "Какой наш ужин ты бы назвал(а) идеальным?",
        "textEn": "Which of our dinners would you call perfect?"
      },
      {
        "id": "di2",
        "type": "choice",
        "text": "Готовить ужин или заказать — что чаще?",
        "textEn": "Cook dinner or order in — what's more often?",
        "options": [
          {
            "id": "cook",
            "label": "Готовим",
            "labelEn": "We cook"
          },
          {
            "id": "order",
            "label": "Заказываем",
            "labelEn": "We order"
          },
          {
            "id": "mix",
            "label": "По ситуации",
            "labelEn": "Depends"
          }
        ]
      },
      {
        "id": "di3",
        "type": "text",
        "text": "О чём ты мечтаешь поговорить за следующим ужином?",
        "textEn": "What do you dream of talking about at our next dinner?"
      },
      {
        "id": "di4",
        "type": "choice",
        "text": "Ужин при свечах — это...",
        "textEn": "Candlelit dinner is...",
        "options": [
          {
            "id": "often",
            "label": "Можем устроить и просто так",
            "labelEn": "We can do it anytime"
          },
          {
            "id": "special",
            "label": "Для особых случаев",
            "labelEn": "For special occasions"
          },
          {
            "id": "cliche",
            "label": "Банально, но приятно",
            "labelEn": "Cliché, but nice"
          }
        ]
      }
    ]
  },
  {
    "id": "food_explore",
    "emoji": "🌮",
    "title": "Гастрономические открытия",
    "titleEn": "Food adventures",
    "questions": [
      {
        "id": "fe1",
        "type": "choice",
        "text": "Попробовать экзотическую еду — это...",
        "textEn": "Trying exotic food is...",
        "options": [
          {
            "id": "yes",
            "label": "Да! Люблю эксперименты",
            "labelEn": "Yes! I love experiments"
          },
          {
            "id": "careful",
            "label": "Осторожно, но попробую",
            "labelEn": "Careful, but I'll try"
          },
          {
            "id": "no",
            "label": "Лучше привычное",
            "labelEn": "Prefer familiar"
          }
        ]
      },
      {
        "id": "fe2",
        "type": "text",
        "text": "Какую кухню мира ты хочешь исследовать вместе?",
        "textEn": "Which world cuisine do you want to explore together?"
      },
      {
        "id": "fe3",
        "type": "text",
        "text": "Какое блюдо ты готов(а) готовить для меня, даже если не умеешь?",
        "textEn": "What dish would you cook for me even if you're not good at it?"
      },
      {
        "id": "fe4",
        "type": "choice",
        "text": "Идеальный food-фестиваль для нас — это...",
        "textEn": "The ideal food festival for us is...",
        "options": [
          {
            "id": "street",
            "label": "Уличная еда",
            "labelEn": "Street food"
          },
          {
            "id": "fine",
            "label": "Fine dining",
            "labelEn": "Fine dining"
          },
          {
            "id": "market",
            "label": "Рынок и дегустации",
            "labelEn": "Market and tastings"
          }
        ]
      }
    ]
  },
  {
    "id": "movie_date",
    "emoji": "🎬",
    "title": "Кино-свидания",
    "titleEn": "Movie dates",
    "questions": [
      {
        "id": "md1",
        "type": "image",
        "text": "Идеальный кино-вечер — это...",
        "textEn": "The ideal movie night is...",
        "imageKeys": [
          "cinema_date",
          "couch_movie"
        ],
        "imageLabels": [
          "Поход в кинотеатр",
          "Фильм на диване"
        ],
        "imageLabelsEn": [
          "Trip to the cinema",
          "Movie on the couch"
        ]
      },
      {
        "id": "md2",
        "type": "text",
        "text": "Какой фильм ты хотел(а) бы пересмотреть со мной?",
        "textEn": "What movie would you rewatch with me?"
      },
      {
        "id": "md3",
        "type": "choice",
        "text": "Жанр для свидания — какой выбираешь?",
        "textEn": "Genre for a date — which do you pick?",
        "options": [
          {
            "id": "romcom",
            "label": "Романтическая комедия",
            "labelEn": "Romantic comedy"
          },
          {
            "id": "thriller",
            "label": "Триллер — держимся за руки",
            "labelEn": "Thriller — holding hands"
          },
          {
            "id": "doc",
            "label": "Документалка и обсуждение",
            "labelEn": "Documentary and discussion"
          }
        ]
      },
      {
        "id": "md4",
        "type": "text",
        "text": "Какой фильм мог бы рассказать нашу историю?",
        "textEn": "What movie could tell our story?"
      }
    ]
  },
  {
    "id": "binge_watch",
    "emoji": "📺",
    "title": "Сериалы и марафоны",
    "titleEn": "Binge watching",
    "questions": [
      {
        "id": "bw1",
        "type": "choice",
        "text": "Смотреть сериал вместе — это...",
        "textEn": "Watching a series together is...",
        "options": [
          {
            "id": "must",
            "label": "Обязательно синхронно!",
            "labelEn": "Must be in sync!"
          },
          {
            "id": "flexible",
            "label": "Можно в разном темпе",
            "labelEn": "Different paces OK"
          },
          {
            "id": "solo",
            "label": "Иногда каждый своё",
            "labelEn": "Sometimes each our own"
          }
        ]
      },
      {
        "id": "bw2",
        "type": "text",
        "text": "Какой сериал ты хотел(а) бы начать смотреть со мной?",
        "textEn": "What series would you like to start with me?"
      },
      {
        "id": "bw3",
        "type": "choice",
        "text": "Когда я смотрю «ещё одну серию» без тебя, ты...",
        "textEn": "When I watch 'one more episode' without you, you...",
        "options": [
          {
            "id": "fine",
            "label": "Нормально — догоню",
            "labelEn": "Fine — I'll catch up"
          },
          {
            "id": "wait",
            "label": "Жду, чтобы вместе",
            "labelEn": "Wait to watch together"
          },
          {
            "id": "spoiler",
            "label": "Боюсь спойлеров!",
            "labelEn": "Afraid of spoilers!"
          }
        ]
      },
      {
        "id": "bw4",
        "type": "text",
        "text": "Какой сериальный персонаж похож на нас?",
        "textEn": "Which TV character is most like us?"
      }
    ]
  },
  {
    "id": "playlist_us",
    "emoji": "🎧",
    "title": "Наш плейлист",
    "titleEn": "Our playlist",
    "questions": [
      {
        "id": "pu1",
        "type": "text",
        "text": "Какую песню ты добавил(а) бы в «наш» плейлист прямо сейчас?",
        "textEn": "What song would you add to 'our' playlist right now?"
      },
      {
        "id": "pu2",
        "type": "choice",
        "text": "Музыка в машине — кто выбирает?",
        "textEn": "Music in the car — who picks?",
        "options": [
          {
            "id": "driver",
            "label": "Водитель",
            "labelEn": "Driver"
          },
          {
            "id": "passenger",
            "label": "Пассажир",
            "labelEn": "Passenger"
          },
          {
            "id": "shuffle",
            "label": "Случайный плейлист",
            "labelEn": "Shuffle playlist"
          }
        ]
      },
      {
        "id": "pu3",
        "type": "text",
        "text": "Какая песня мгновенно возвращает тебя к нашему моменту?",
        "textEn": "Which song instantly takes you back to a moment with me?"
      },
      {
        "id": "pu4",
        "type": "choice",
        "text": "Концерт вместе — это...",
        "textEn": "A concert together is...",
        "options": [
          {
            "id": "dream",
            "label": "Мечта!",
            "labelEn": "A dream!"
          },
          {
            "id": "done",
            "label": "Уже были — хотим ещё",
            "labelEn": "Been there — want more"
          },
          {
            "id": "home",
            "label": "Лучше дома с колонкой",
            "labelEn": "Prefer home with speakers"
          }
        ]
      }
    ]
  },
  {
    "id": "live_music",
    "emoji": "🎤",
    "title": "Живая музыка",
    "titleEn": "Live music",
    "questions": [
      {
        "id": "lm1",
        "type": "choice",
        "text": "Живой концерт vs запись — что лучше?",
        "textEn": "Live concert vs recording — which is better?",
        "options": [
          {
            "id": "live",
            "label": "Живое — энергия!",
            "labelEn": "Live — the energy!"
          },
          {
            "id": "record",
            "label": "Запись — комфортнее",
            "labelEn": "Recording — more comfortable"
          },
          {
            "id": "both",
            "label": "Зависит от настроения",
            "labelEn": "Depends on the mood"
          }
        ]
      },
      {
        "id": "lm2",
        "type": "text",
        "text": "На какой концерт ты хотел(а) бы сходить вместе?",
        "textEn": "What concert would you like to attend together?"
      },
      {
        "id": "lm3",
        "type": "text",
        "text": "Какой музыкальный момент с тобой запомнился больше всего?",
        "textEn": "Which musical moment with you stuck with you most?"
      },
      {
        "id": "lm4",
        "type": "choice",
        "text": "Если бы мы играли в группе, кто на чём?",
        "textEn": "If we were in a band, who plays what?",
        "options": [
          {
            "id": "vocal",
            "label": "Я — вокал, ты — инструмент",
            "labelEn": "Me vocals, you instrument"
          },
          {
            "id": "both",
            "label": "Оба поём",
            "labelEn": "We both sing"
          },
          {
            "id": "dj",
            "label": "DJ-сет вдвоём",
            "labelEn": "DJ set together"
          }
        ]
      }
    ]
  },
  {
    "id": "dance_us",
    "emoji": "💃",
    "title": "Танцуем вместе",
    "titleEn": "Dancing together",
    "questions": [
      {
        "id": "da1",
        "type": "image",
        "text": "Какой танец ближе к нам?",
        "textEn": "Which dance feels more like us?",
        "imageKeys": [
          "dance_floor",
          "wedding_dance"
        ],
        "imageLabels": [
          "Танцпол и энергия",
          "Медленный свадебный танец"
        ],
        "imageLabelsEn": [
          "Dance floor energy",
          "Slow wedding dance"
        ]
      },
      {
        "id": "da2",
        "type": "choice",
        "text": "Танцевать вместе — это...",
        "textEn": "Dancing together is...",
        "options": [
          {
            "id": "love",
            "label": "Обожаю!",
            "labelEn": "Love it!"
          },
          {
            "id": "shy",
            "label": "Смущаюсь, но попробую",
            "labelEn": "Shy, but I'll try"
          },
          {
            "id": "funny",
            "label": "Смешно — и это прикол",
            "labelEn": "Funny — and that's the point"
          }
        ]
      },
      {
        "id": "da3",
        "type": "text",
        "text": "Какую песню ты бы выбрал(а) для нашего медленного танца?",
        "textEn": "What song would you pick for our slow dance?"
      },
      {
        "id": "da4",
        "type": "choice",
        "text": "На свадьбе друга мы...",
        "textEn": "At a friend's wedding we...",
        "options": [
          {
            "id": "dance",
            "label": "Танцуем всю ночь",
            "labelEn": "Dance all night"
          },
          {
            "id": "watch",
            "label": "Смотрим и болтаем",
            "labelEn": "Watch and chat"
          },
          {
            "id": "leave",
            "label": "Уходим рано",
            "labelEn": "Leave early"
          }
        ]
      }
    ]
  },
  {
    "id": "party_mode",
    "emoji": "🎉",
    "title": "Вечеринки и тусовки",
    "titleEn": "Parties & social life",
    "questions": [
      {
        "id": "pm1",
        "type": "image",
        "text": "Идеальный вечер с друзьями — это...",
        "textEn": "The ideal evening with friends is...",
        "imageKeys": [
          "party_friends",
          "wine_evening"
        ],
        "imageLabels": [
          "Вечеринка с друзьями",
          "Тихий вечер с вином"
        ],
        "imageLabelsEn": [
          "Party with friends",
          "Quiet evening with wine"
        ]
      },
      {
        "id": "pm2",
        "type": "choice",
        "text": "На вечеринках мы — это...",
        "textEn": "At parties we are...",
        "options": [
          {
            "id": "together",
            "label": "Всегда рядом",
            "labelEn": "Always together"
          },
          {
            "id": "social",
            "label": "Общаемся с разными людьми",
            "labelEn": "Talk to different people"
          },
          {
            "id": "early",
            "label": "Уходим пораньше",
            "labelEn": "Leave early"
          }
        ]
      },
      {
        "id": "pm3",
        "type": "text",
        "text": "Какой совместный выход «в свет» запомнился тебе?",
        "textEn": "Which night out together stuck with you?"
      },
      {
        "id": "pm4",
        "type": "choice",
        "text": "Приглашать друзей домой — это...",
        "textEn": "Inviting friends over is...",
        "options": [
          {
            "id": "love",
            "label": "Люблю устраивать",
            "labelEn": "Love hosting"
          },
          {
            "id": "sometimes",
            "label": "Иногда — не часто",
            "labelEn": "Sometimes — not often"
          },
          {
            "id": "no",
            "label": "Предпочитаю только нас",
            "labelEn": "Prefer just us"
          }
        ]
      }
    ]
  },
  {
    "id": "friend_circle",
    "emoji": "👥",
    "title": "Круг друзей",
    "titleEn": "Friend circle",
    "questions": [
      {
        "id": "fc1",
        "type": "choice",
        "text": "Друзья в отношениях — это...",
        "textEn": "Friends in a relationship are...",
        "options": [
          {
            "id": "important",
            "label": "Важная часть жизни",
            "labelEn": "An important part of life"
          },
          {
            "id": "few",
            "label": "Мало, но близкие",
            "labelEn": "Few but close"
          },
          {
            "id": "us",
            "label": "Главное — мы вдвоём",
            "labelEn": "Main thing — us two"
          }
        ]
      },
      {
        "id": "fc2",
        "type": "text",
        "text": "Какой друг повлиял на наши отношения больше всего?",
        "textEn": "Which friend influenced our relationship most?"
      },
      {
        "id": "fc3",
        "type": "choice",
        "text": "Знакомить партнёра с друзьями — это...",
        "textEn": "Introducing your partner to friends is...",
        "options": [
          {
            "id": "excited",
            "label": "Волнительно и приятно",
            "labelEn": "Exciting and nice"
          },
          {
            "id": "nervous",
            "label": "Немного стрессно",
            "labelEn": "A bit stressful"
          },
          {
            "id": "natural",
            "label": "Естественно",
            "labelEn": "Natural"
          }
        ]
      },
      {
        "id": "fc4",
        "type": "text",
        "text": "Как мы можем лучше интегрировать друг друга в свои круги?",
        "textEn": "How can we better integrate each other into our circles?"
      }
    ]
  },
  {
    "id": "our_friends",
    "emoji": "🤗",
    "title": "Общие друзья",
    "titleEn": "Our friends",
    "questions": [
      {
        "id": "ouf1",
        "type": "text",
        "text": "Какой общий друг стал важен для нас обоих?",
        "textEn": "Which mutual friend became important to both of us?"
      },
      {
        "id": "ouf2",
        "type": "choice",
        "text": "Двойные свидания с друзьями — это...",
        "textEn": "Double dates with friends are...",
        "options": [
          {
            "id": "fun",
            "label": "Весело!",
            "labelEn": "Fun!"
          },
          {
            "id": "ok",
            "label": "Нормально, но редко",
            "labelEn": "OK, but rare"
          },
          {
            "id": "prefer",
            "label": "Лучше только мы",
            "labelEn": "Prefer just us"
          }
        ]
      },
      {
        "id": "ouf3",
        "type": "text",
        "text": "Кого из моих друзей ты хотел(а) бы узнать лучше?",
        "textEn": "Which of my friends would you like to know better?"
      },
      {
        "id": "ouf4",
        "type": "choice",
        "text": "Если бы мы устроили ужин для друзей, что бы приготовили?",
        "textEn": "If we hosted dinner for friends, what would we cook?",
        "options": [
          {
            "id": "fancy",
            "label": "Что-то впечатляющее",
            "labelEn": "Something impressive"
          },
          {
            "id": "simple",
            "label": "Простое и вкусное",
            "labelEn": "Simple and tasty"
          },
          {
            "id": "order",
            "label": "Заказали бы — честно",
            "labelEn": "Order in — honestly"
          }
        ]
      }
    ]
  },
  {
    "id": "meet_family",
    "emoji": "🏡",
    "title": "Знакомство с семьёй",
    "titleEn": "Meeting the family",
    "questions": [
      {
        "id": "mf1",
        "type": "text",
        "text": "Как ты себя чувствовал(а), когда знакомился(лась) с моей семьёй?",
        "textEn": "How did you feel meeting my family?"
      },
      {
        "id": "mf2",
        "type": "choice",
        "text": "Семья партнёра для тебя — это...",
        "textEn": "Your partner's family is...",
        "options": [
          {
            "id": "warm",
            "label": "Тёплые люди, часть жизни",
            "labelEn": "Warm people, part of life"
          },
          {
            "id": "learning",
            "label": "Учусь понимать",
            "labelEn": "Learning to understand"
          },
          {
            "id": "complex",
            "label": "Сложно, но стараюсь",
            "labelEn": "Complex, but I try"
          }
        ]
      },
      {
        "id": "mf3",
        "type": "text",
        "text": "Какой момент с моей семьёй запомнился тебе?",
        "textEn": "Which moment with my family stuck with you?"
      },
      {
        "id": "mf4",
        "type": "choice",
        "text": "Семейные ужины — как часто?",
        "textEn": "Family dinners — how often?",
        "options": [
          {
            "id": "monthly",
            "label": "Раз в месяц",
            "labelEn": "Once a month"
          },
          {
            "id": "holidays",
            "label": "Только праздники",
            "labelEn": "Holidays only"
          },
          {
            "id": "rare",
            "label": "Редко — и это OK",
            "labelEn": "Rare — and that's OK"
          }
        ]
      }
    ]
  },
  {
    "id": "in_laws",
    "emoji": "🤝",
    "title": "Отношения с роднёй",
    "titleEn": "In-laws & relatives",
    "questions": [
      {
        "id": "il1",
        "type": "choice",
        "text": "Советы от родителей партнёра — это...",
        "textEn": "Advice from your partner's parents is...",
        "options": [
          {
            "id": "welcome",
            "label": "Приветствую",
            "labelEn": "Welcome"
          },
          {
            "id": "filter",
            "label": "Слушаю, но фильтрую",
            "labelEn": "Listen but filter"
          },
          {
            "id": "hard",
            "label": "Сложно воспринимаю",
            "labelEn": "Hard to accept"
          }
        ]
      },
      {
        "id": "il2",
        "type": "text",
        "text": "Как нам сохранять границы с родственниками?",
        "textEn": "How can we keep boundaries with relatives?"
      },
      {
        "id": "il3",
        "type": "choice",
        "text": "Праздники с двумя семьями — это...",
        "textEn": "Holidays with both families are...",
        "options": [
          {
            "id": "rotate",
            "label": "Чередуем",
            "labelEn": "We rotate"
          },
          {
            "id": "together",
            "label": "Собираем всех",
            "labelEn": "Gather everyone"
          },
          {
            "id": "separate",
            "label": "Отмечаем отдельно",
            "labelEn": "Celebrate separately"
          }
        ]
      },
      {
        "id": "il4",
        "type": "text",
        "text": "Что ты ценишь в моих родителях или родственниках?",
        "textEn": "What do you appreciate about my parents or relatives?"
      }
    ]
  },
  {
    "id": "kids_talk",
    "emoji": "👶",
    "title": "Разговор о детях",
    "titleEn": "Talking about kids",
    "questions": [
      {
        "id": "kt1",
        "type": "choice",
        "text": "Дети в наших планах — это...",
        "textEn": "Kids in our plans are...",
        "options": [
          {
            "id": "yes",
            "label": "Да, хотим",
            "labelEn": "Yes, we want them"
          },
          {
            "id": "maybe",
            "label": "Может быть, позже",
            "labelEn": "Maybe later"
          },
          {
            "id": "no",
            "label": "Нет / не уверен(а)",
            "labelEn": "No / not sure"
          }
        ]
      },
      {
        "id": "kt2",
        "type": "text",
        "text": "Каким родителем ты видишь меня?",
        "textEn": "What kind of parent do you see me as?"
      },
      {
        "id": "kt3",
        "type": "choice",
        "text": "Как мы будем делить родительские обязанности?",
        "textEn": "How will we split parenting duties?",
        "options": [
          {
            "id": "equal",
            "label": "Поровну",
            "labelEn": "Equally"
          },
          {
            "id": "strengths",
            "label": "По сильным сторонам",
            "labelEn": "By strengths"
          },
          {
            "id": "discuss",
            "label": "Обсудим, когда придёт время",
            "labelEn": "We'll discuss when the time comes"
          }
        ]
      },
      {
        "id": "kt4",
        "type": "text",
        "text": "Какую ценность ты хочешь передать нашим детям?",
        "textEn": "What value do you want to pass on to our children?"
      }
    ]
  },
  {
    "id": "family_values",
    "emoji": "💎",
    "title": "Семейные ценности",
    "titleEn": "Family values",
    "questions": [
      {
        "id": "fv1",
        "type": "text",
        "text": "Какая ценность из твоей семьи самая важная для тебя?",
        "textEn": "Which value from your family matters most to you?"
      },
      {
        "id": "fv2",
        "type": "choice",
        "text": "Семья для тебя — это прежде всего...",
        "textEn": "Family for you is above all...",
        "options": [
          {
            "id": "support",
            "label": "Поддержка",
            "labelEn": "Support"
          },
          {
            "id": "tradition",
            "label": "Традиции",
            "labelEn": "Traditions"
          },
          {
            "id": "love",
            "label": "Безусловная любовь",
            "labelEn": "Unconditional love"
          }
        ]
      },
      {
        "id": "fv3",
        "type": "text",
        "text": "Какие ценности мы уже разделяем как пара?",
        "textEn": "Which values do we already share as a couple?"
      },
      {
        "id": "fv4",
        "type": "choice",
        "text": "Если бы мы написали «семейный манифест», что там было бы первым?",
        "textEn": "If we wrote a 'family manifesto', what would come first?",
        "options": [
          {
            "id": "honesty",
            "label": "Честность",
            "labelEn": "Honesty"
          },
          {
            "id": "fun",
            "label": "Радость и смех",
            "labelEn": "Joy and laughter"
          },
          {
            "id": "respect",
            "label": "Уважение",
            "labelEn": "Respect"
          }
        ]
      }
    ]
  },
  {
    "id": "talk_style",
    "emoji": "🗣️",
    "title": "Стиль общения",
    "titleEn": "Communication style",
    "questions": [
      {
        "id": "ts1",
        "type": "choice",
        "text": "Ты предпочитаешь говорить или слушать?",
        "textEn": "Do you prefer to talk or listen?",
        "options": [
          {
            "id": "talk",
            "label": "Говорить — мне нужно высказаться",
            "labelEn": "Talk — I need to express"
          },
          {
            "id": "listen",
            "label": "Слушать — так понимаю лучше",
            "labelEn": "Listen — I understand better"
          },
          {
            "id": "both",
            "label": "Зависит от темы",
            "labelEn": "Depends on the topic"
          }
        ]
      },
      {
        "id": "ts2",
        "type": "text",
        "text": "Когда я молчу, что ты думаешь?",
        "textEn": "When I'm quiet, what do you think?"
      },
      {
        "id": "ts3",
        "type": "choice",
        "text": "Серьёзные разговоры лучше проводить...",
        "textEn": "Serious talks are best had...",
        "options": [
          {
            "id": "face",
            "label": "Лицом к лицу",
            "labelEn": "Face to face"
          },
          {
            "id": "walk",
            "label": "На прогулке",
            "labelEn": "On a walk"
          },
          {
            "id": "evening",
            "label": "Вечером, когда спокойно",
            "labelEn": "In the evening, when calm"
          }
        ]
      },
      {
        "id": "ts4",
        "type": "text",
        "text": "Какой мой стиль общения ты ценишь больше всего?",
        "textEn": "Which of my communication styles do you value most?"
      }
    ]
  },
  {
    "id": "love_language",
    "emoji": "💝",
    "title": "Языки любви",
    "titleEn": "Love languages",
    "questions": [
      {
        "id": "ll1",
        "type": "choice",
        "text": "Твой главный язык любви — это...",
        "textEn": "Your main love language is...",
        "options": [
          {
            "id": "words",
            "label": "Слова поддержки",
            "labelEn": "Words of affirmation"
          },
          {
            "id": "time",
            "label": "Качественное время",
            "labelEn": "Quality time"
          },
          {
            "id": "touch",
            "label": "Прикосновения",
            "labelEn": "Physical touch"
          },
          {
            "id": "gifts",
            "label": "Подарки",
            "labelEn": "Gifts"
          },
          {
            "id": "acts",
            "label": "Помощь и забота",
            "labelEn": "Acts of service"
          }
        ]
      },
      {
        "id": "ll2",
        "type": "text",
        "text": "Когда ты последний раз почувствовал(а) мою любовь на «своём языке»?",
        "textEn": "When did you last feel my love in 'your language'?"
      },
      {
        "id": "ll3",
        "type": "choice",
        "text": "Какой язык любви партнёра ты учишься понимать?",
        "textEn": "Which of your partner's love languages are you learning?",
        "options": [
          {
            "id": "same",
            "label": "Наши совпадают!",
            "labelEn": "Ours match!"
          },
          {
            "id": "learning",
            "label": "Учусь говорить на его/её",
            "labelEn": "Learning to speak theirs"
          },
          {
            "id": "different",
            "label": "Разные — и это вызов",
            "labelEn": "Different — and that's a challenge"
          }
        ]
      },
      {
        "id": "ll4",
        "type": "text",
        "text": "Что я могу сделать завтра, чтобы ты почувствовал(а) себя любимым(ой)?",
        "textEn": "What can I do tomorrow so you feel loved?"
      }
    ]
  },
  {
    "id": "compliments",
    "emoji": "✨",
    "title": "Сила комплиментов",
    "titleEn": "Power of compliments",
    "questions": [
      {
        "id": "cm1",
        "type": "text",
        "text": "Какой комплимент от меня запомнился тебе больше всего?",
        "textEn": "Which compliment from me stuck with you most?"
      },
      {
        "id": "cm2",
        "type": "choice",
        "text": "Комплименты для тебя — это...",
        "textEn": "Compliments for you are...",
        "options": [
          {
            "id": "need",
            "label": "Нужны регулярно",
            "labelEn": "Needed regularly"
          },
          {
            "id": "nice",
            "label": "Приятно, но не обязательно",
            "labelEn": "Nice but not essential"
          },
          {
            "id": "shy",
            "label": "Смущают — но нравятся",
            "labelEn": "Embarrassing — but I like them"
          }
        ]
      },
      {
        "id": "cm3",
        "type": "text",
        "text": "За что ты хотел(а) бы получить комплимент прямо сейчас?",
        "textEn": "What would you like a compliment about right now?"
      },
      {
        "id": "cm4",
        "type": "choice",
        "text": "Как ты предпочитаешь получать комплименты?",
        "textEn": "How do you prefer to receive compliments?",
        "options": [
          {
            "id": "public",
            "label": "При всех — мне приятно",
            "labelEn": "In public — I like it"
          },
          {
            "id": "private",
            "label": "Наедине",
            "labelEn": "In private"
          },
          {
            "id": "text",
            "label": "В сообщении — могу перечитать",
            "labelEn": "In a message — I can reread"
          }
        ]
      }
    ]
  },
  {
    "id": "gratitude",
    "emoji": "🙏",
    "title": "Благодарность",
    "titleEn": "Gratitude",
    "questions": [
      {
        "id": "gr1",
        "type": "text",
        "text": "За что ты благодарен(на) мне сегодня?",
        "textEn": "What are you grateful to me for today?"
      },
      {
        "id": "gr2",
        "type": "choice",
        "text": "Говорить «спасибо» в паре — это...",
        "textEn": "Saying 'thank you' in a couple is...",
        "options": [
          {
            "id": "daily",
            "label": "Каждый день",
            "labelEn": "Every day"
          },
          {
            "id": "when",
            "label": "Когда по-настоящему чувствую",
            "labelEn": "When I truly feel it"
          },
          {
            "id": "actions",
            "label": "Показываю делами",
            "labelEn": "I show through actions"
          }
        ]
      },
      {
        "id": "gr3",
        "type": "text",
        "text": "Какой момент с тобой вызывает благодарность, когда оглядываешься назад?",
        "textEn": "Which moment with you brings gratitude when you look back?"
      },
      {
        "id": "gr4",
        "type": "choice",
        "text": "Как мы можем практиковать благодарность вместе?",
        "textEn": "How can we practice gratitude together?",
        "options": [
          {
            "id": "journal",
            "label": "Дневник благодарности",
            "labelEn": "Gratitude journal"
          },
          {
            "id": "evening",
            "label": "Вечерний «за что спасибо»",
            "labelEn": "Evening 'what I'm thankful for'"
          },
          {
            "id": "surprise",
            "label": "Случайные записки",
            "labelEn": "Random notes"
          }
        ]
      }
    ]
  },
  {
    "id": "forgiveness",
    "emoji": "🌱",
    "title": "Прощение",
    "titleEn": "Forgiveness",
    "questions": [
      {
        "id": "fg1",
        "type": "choice",
        "text": "Простить — для тебя это...",
        "textEn": "Forgiving for you is...",
        "options": [
          {
            "id": "quick",
            "label": "Быстро — не держу обиду",
            "labelEn": "Quick — I don't hold grudges"
          },
          {
            "id": "time",
            "label": "Нужно время",
            "labelEn": "Takes time"
          },
          {
            "id": "hard",
            "label": "Сложно, но стараюсь",
            "labelEn": "Hard, but I try"
          }
        ]
      },
      {
        "id": "fg2",
        "type": "text",
        "text": "Когда я прощаю тебя, что для тебя значит больше всего?",
        "textEn": "When I forgive you, what matters most to you?"
      },
      {
        "id": "fg3",
        "type": "text",
        "text": "Есть ли что-то, что ты ещё не простил(а) — и готов(а) обсудить?",
        "textEn": "Is there something you haven't forgiven yet — and are ready to discuss?"
      },
      {
        "id": "fg4",
        "type": "choice",
        "text": "Как пара может расти через прощение?",
        "textEn": "How can a couple grow through forgiveness?",
        "options": [
          {
            "id": "talk",
            "label": "Честные разговоры",
            "labelEn": "Honest talks"
          },
          {
            "id": "understand",
            "label": "Понимание мотивов",
            "labelEn": "Understanding motives"
          },
          {
            "id": "move",
            "label": "Отпустить и идти дальше",
            "labelEn": "Let go and move forward"
          }
        ]
      }
    ]
  },
  {
    "id": "open_up",
    "emoji": "🫀",
    "title": "Открыться",
    "titleEn": "Opening up",
    "questions": [
      {
        "id": "ou1",
        "type": "text",
        "text": "О чём ты давно хочешь поговорить, но откладываешь?",
        "textEn": "What have you wanted to talk about but keep putting off?"
      },
      {
        "id": "ou2",
        "type": "choice",
        "text": "Открываться партнёру — это...",
        "textEn": "Opening up to your partner is...",
        "options": [
          {
            "id": "natural",
            "label": "Естественно",
            "labelEn": "Natural"
          },
          {
            "id": "gradual",
            "label": "Постепенно — доверие растёт",
            "labelEn": "Gradually — trust grows"
          },
          {
            "id": "scary",
            "label": "Страшно, но важно",
            "labelEn": "Scary, but important"
          }
        ]
      },
      {
        "id": "ou3",
        "type": "text",
        "text": "Когда ты чувствуешь, что можешь быть полностью собой?",
        "textEn": "When do you feel you can be completely yourself?"
      },
      {
        "id": "ou4",
        "type": "choice",
        "text": "Что помогает тебе открыться?",
        "textEn": "What helps you open up?",
        "options": [
          {
            "id": "trust",
            "label": "Доверие и время",
            "labelEn": "Trust and time"
          },
          {
            "id": "questions",
            "label": "Правильные вопросы",
            "labelEn": "The right questions"
          },
          {
            "id": "silence",
            "label": "Тишина и терпение",
            "labelEn": "Silence and patience"
          }
        ]
      }
    ]
  },
  {
    "id": "emotional_intimacy",
    "emoji": "💞",
    "title": "Эмоциональная близость",
    "titleEn": "Emotional intimacy",
    "questions": [
      {
        "id": "ei1",
        "type": "text",
        "text": "Когда ты чувствуешь эмоциональную близость со мной сильнее всего?",
        "textEn": "When do you feel emotionally closest to me?"
      },
      {
        "id": "ei2",
        "type": "choice",
        "text": "Эмоциональная близость для тебя — это...",
        "textEn": "Emotional intimacy for you is...",
        "options": [
          {
            "id": "share",
            "label": "Делиться переживаниями",
            "labelEn": "Sharing feelings"
          },
          {
            "id": "understand",
            "label": "Быть понятым без слов",
            "labelEn": "Being understood without words"
          },
          {
            "id": "safe",
            "label": "Чувствовать себя в безопасности",
            "labelEn": "Feeling safe"
          }
        ]
      },
      {
        "id": "ei3",
        "type": "text",
        "text": "Что мешает тебе быть эмоционально ближе — и как я могу помочь?",
        "textEn": "What keeps you from being emotionally closer — and how can I help?"
      },
      {
        "id": "ei4",
        "type": "choice",
        "text": "Глубокая эмоциональная связь — это...",
        "textEn": "Deep emotional connection is...",
        "options": [
          {
            "id": "have",
            "label": "У нас уже есть",
            "labelEn": "We already have it"
          },
          {
            "id": "growing",
            "label": "Растёт с каждым днём",
            "labelEn": "Growing every day"
          },
          {
            "id": "want",
            "label": "Хочу больше",
            "labelEn": "I want more"
          }
        ]
      }
    ]
  },
  {
    "id": "physical_affection",
    "emoji": "🤗",
    "title": "Физическая нежность",
    "titleEn": "Physical affection",
    "questions": [
      {
        "id": "pa1",
        "type": "choice",
        "text": "Какой вид прикосновений ты любишь больше всего?",
        "textEn": "What kind of touch do you love most?",
        "options": [
          {
            "id": "hug",
            "label": "Долгие объятия",
            "labelEn": "Long hugs"
          },
          {
            "id": "hand",
            "label": "Держаться за руки",
            "labelEn": "Holding hands"
          },
          {
            "id": "cuddle",
            "label": "Прижаться и молчать",
            "labelEn": "Cuddle in silence"
          }
        ]
      },
      {
        "id": "pa2",
        "type": "text",
        "text": "Когда я обнимаю тебя неожиданно — что ты чувствуешь?",
        "textEn": "When I hug you unexpectedly — what do you feel?"
      },
      {
        "id": "pa3",
        "type": "choice",
        "text": "Публичная нежность — для тебя это...",
        "textEn": "Public affection — for you it's...",
        "options": [
          {
            "id": "love",
            "label": "Нравится",
            "labelEn": "I like it"
          },
          {
            "id": "sometimes",
            "label": "Зависит от места",
            "labelEn": "Depends on the place"
          },
          {
            "id": "private",
            "label": "Лучше наедине",
            "labelEn": "Prefer in private"
          }
        ]
      },
      {
        "id": "pa4",
        "type": "text",
        "text": "Как я могу чаще показывать нежность так, как тебе приятно?",
        "textEn": "How can I show affection more often in a way you enjoy?"
      }
    ]
  },
  {
    "id": "secret_wishes",
    "emoji": "✨",
    "title": "Тайные желания",
    "titleEn": "Secret wishes",
    "questions": [
      {
        "id": "sw1",
        "type": "text",
        "text": "О чём ты мечтаешь, но ещё не говорил(а) мне?",
        "textEn": "What do you dream about but haven't told me yet?"
      },
      {
        "id": "sw2",
        "type": "choice",
        "text": "Делиться тайными желаниями — это...",
        "textEn": "Sharing secret wishes is...",
        "options": [
          {
            "id": "exciting",
            "label": "Волнительно и приятно",
            "labelEn": "Exciting and nice"
          },
          {
            "id": "scary",
            "label": "Страшновато",
            "labelEn": "A bit scary"
          },
          {
            "id": "ready",
            "label": "Готов(а) попробовать",
            "labelEn": "Ready to try"
          }
        ]
      },
      {
        "id": "sw3",
        "type": "text",
        "text": "Какое желание мы могли бы исполнить друг для друга в этом месяце?",
        "textEn": "What wish could we fulfill for each other this month?"
      },
      {
        "id": "sw4",
        "type": "choice",
        "text": "Если бы я исполнил(а) одно твоё желание завтра — что бы это было?",
        "textEn": "If I fulfilled one wish of yours tomorrow — what would it be?",
        "options": [
          {
            "id": "experience",
            "label": "Впечатление или приключение",
            "labelEn": "An experience or adventure"
          },
          {
            "id": "comfort",
            "label": "Забота и уют",
            "labelEn": "Care and coziness"
          },
          {
            "id": "surprise",
            "label": "Сюрприз — угадай сам(а)",
            "labelEn": "A surprise — guess yourself"
          }
        ]
      }
    ]
  },
  {
    "id": "boundaries",
    "emoji": "🚧",
    "title": "Здоровые границы",
    "titleEn": "Healthy boundaries",
    "questions": [
      {
        "id": "bo1",
        "type": "choice",
        "text": "Границы в отношениях — это...",
        "textEn": "Boundaries in a relationship are...",
        "options": [
          {
            "id": "essential",
            "label": "Необходимость",
            "labelEn": "Essential"
          },
          {
            "id": "learning",
            "label": "Учимся вместе",
            "labelEn": "Learning together"
          },
          {
            "id": "unclear",
            "label": "Пока неясно",
            "labelEn": "Still unclear"
          }
        ]
      },
      {
        "id": "bo2",
        "type": "text",
        "text": "Какая граница для тебя особенно важна?",
        "textEn": "Which boundary is especially important to you?"
      },
      {
        "id": "bo3",
        "type": "text",
        "text": "Был ли момент, когда тебе нужно было обозначить границу?",
        "textEn": "Was there a moment when you needed to set a boundary?"
      },
      {
        "id": "bo4",
        "type": "choice",
        "text": "Когда я уважаю твои границы, ты...",
        "textEn": "When I respect your boundaries, you...",
        "options": [
          {
            "id": "safe",
            "label": "Чувствуешь себя в безопасности",
            "labelEn": "Feel safe"
          },
          {
            "id": "closer",
            "label": "Становимся ближе",
            "labelEn": "We grow closer"
          },
          {
            "id": "grateful",
            "label": "Благодарен(на)",
            "labelEn": "Feel grateful"
          }
        ]
      }
    ]
  },
  {
    "id": "alone_time",
    "emoji": "🧘‍♀️",
    "title": "Время на себя",
    "titleEn": "Alone time",
    "questions": [
      {
        "id": "at1",
        "type": "text",
        "text": "Что ты делаешь в своё личное время, о чём я могу не знать?",
        "textEn": "What do you do in your alone time that I might not know about?"
      },
      {
        "id": "at2",
        "type": "choice",
        "text": "Скучать друг по другу — это...",
        "textEn": "Missing each other is...",
        "options": [
          {
            "id": "sweet",
            "label": "Мило и романтично",
            "labelEn": "Sweet and romantic"
          },
          {
            "id": "normal",
            "label": "Нормально — мы не слиплись",
            "labelEn": "Normal — we're not glued together"
          },
          {
            "id": "rare",
            "label": "Редко — мы много вместе",
            "labelEn": "Rare — we're together a lot"
          }
        ]
      },
      {
        "id": "at3",
        "type": "text",
        "text": "Как мы можем поддерживать личное пространство друг друга?",
        "textEn": "How can we support each other's personal space?"
      },
      {
        "id": "at4",
        "type": "choice",
        "text": "После времени на себя ты...",
        "textEn": "After alone time you...",
        "options": [
          {
            "id": "recharged",
            "label": "Возвращаешься с энергией",
            "labelEn": "Come back energized"
          },
          {
            "id": "miss",
            "label": "Скучаешь и рад(а) видеть",
            "labelEn": "Miss me and happy to see me"
          },
          {
            "id": "same",
            "label": "Ничего не меняется",
            "labelEn": "Nothing changes"
          }
        ]
      }
    ]
  },
  {
    "id": "phone_habits",
    "emoji": "📱",
    "title": "Телефон в паре",
    "titleEn": "Phone habits",
    "questions": [
      {
        "id": "ph1",
        "type": "choice",
        "text": "Телефон за ужином — это...",
        "textEn": "Phone at dinner is...",
        "options": [
          {
            "id": "no",
            "label": "Табу — мы вместе",
            "labelEn": "Taboo — we're together"
          },
          {
            "id": "sometimes",
            "label": "Иногда — если важно",
            "labelEn": "Sometimes — if important"
          },
          {
            "id": "normal",
            "label": "Нормально",
            "labelEn": "Normal"
          }
        ]
      },
      {
        "id": "ph2",
        "type": "text",
        "text": "Когда телефон партнёра мешает общению, что ты чувствуешь?",
        "textEn": "When your partner's phone gets in the way, what do you feel?"
      },
      {
        "id": "ph3",
        "type": "choice",
        "text": "Как мы можем меньше отвлекаться на экраны?",
        "textEn": "How can we distract ourselves less with screens?",
        "options": [
          {
            "id": "box",
            "label": "Коробка для телефонов",
            "labelEn": "Phone box"
          },
          {
            "id": "rule",
            "label": "Правило «без телефона» вечером",
            "labelEn": "No-phone evening rule"
          },
          {
            "id": "trust",
            "label": "Просто договориться",
            "labelEn": "Just agree on it"
          }
        ]
      },
      {
        "id": "ph4",
        "type": "text",
        "text": "Какое сообщение от меня ты любишь получать больше всего?",
        "textEn": "What kind of message from me do you love getting most?"
      }
    ]
  },
  {
    "id": "screen_time",
    "emoji": "💻",
    "title": "Экранное время",
    "titleEn": "Screen time",
    "questions": [
      {
        "id": "sc1",
        "type": "choice",
        "text": "Сериалы vs реальное время вместе — баланс...",
        "textEn": "Shows vs real time together — balance is...",
        "options": [
          {
            "id": "us",
            "label": "Мы важнее экрана",
            "labelEn": "We matter more than screens"
          },
          {
            "id": "share",
            "label": "Смотрим вместе — это тоже «мы»",
            "labelEn": "Watch together — that's 'us' too"
          },
          {
            "id": "struggle",
            "label": "Борюсь с этим",
            "labelEn": "I struggle with this"
          }
        ]
      },
      {
        "id": "sc2",
        "type": "text",
        "text": "Какой контент ты хотел(а) бы смотреть или обсуждать вместе?",
        "textEn": "What content would you like to watch or discuss together?"
      },
      {
        "id": "sc3",
        "type": "choice",
        "text": "Цифровой детокс вдвоём — это...",
        "textEn": "A digital detox together is...",
        "options": [
          {
            "id": "want",
            "label": "Хочу попробовать",
            "labelEn": "Want to try"
          },
          {
            "id": "tried",
            "label": "Пробовали — помогло",
            "labelEn": "Tried it — it helped"
          },
          {
            "id": "hard",
            "label": "Слишком сложно",
            "labelEn": "Too hard"
          }
        ]
      },
      {
        "id": "sc4",
        "type": "text",
        "text": "Как технологии помогают нашим отношениям?",
        "textEn": "How do technologies help our relationship?"
      }
    ]
  },
  {
    "id": "social_online",
    "emoji": "🌐",
    "title": "Мы в соцсетях",
    "titleEn": "Us on social media",
    "questions": [
      {
        "id": "soc1",
        "type": "choice",
        "text": "Посты о нас в соцсетях — это...",
        "textEn": "Posts about us on social media are...",
        "options": [
          {
            "id": "love",
            "label": "Люблю делиться",
            "labelEn": "Love sharing"
          },
          {
            "id": "private",
            "label": "Предпочитаю приватность",
            "labelEn": "Prefer privacy"
          },
          {
            "id": "sometimes",
            "label": "Иногда — особые моменты",
            "labelEn": "Sometimes — special moments"
          }
        ]
      },
      {
        "id": "soc2",
        "type": "text",
        "text": "Как ты относишься к тому, что я лайкаю или комментирую?",
        "textEn": "How do you feel about what I like or comment online?"
      },
      {
        "id": "soc3",
        "type": "choice",
        "text": "Пара в интернете — показывать или скрывать?",
        "textEn": "Couple online — show or hide?",
        "options": [
          {
            "id": "open",
            "label": "Открыто — нам нечего скрывать",
            "labelEn": "Open — nothing to hide"
          },
          {
            "id": "minimal",
            "label": "Минимум",
            "labelEn": "Minimum"
          },
          {
            "id": "none",
            "label": "Не наш формат",
            "labelEn": "Not our style"
          }
        ]
      },
      {
        "id": "soc4",
        "type": "text",
        "text": "Какой наш момент ты бы не постил, но он дорог?",
        "textEn": "Which moment of ours wouldn't you post but is precious?"
      }
    ]
  },
  {
    "id": "nostalgia",
    "emoji": "📼",
    "title": "Ностальгия",
    "titleEn": "Nostalgia",
    "questions": [
      {
        "id": "no1",
        "type": "text",
        "text": "На какой период наших отношений ты оглядываешься с теплотой?",
        "textEn": "Which period of our relationship do you look back on warmly?"
      },
      {
        "id": "no2",
        "type": "choice",
        "text": "Ностальгия для тебя — это...",
        "textEn": "Nostalgia for you is...",
        "options": [
          {
            "id": "sweet",
            "label": "Сладкая грусть",
            "labelEn": "Sweet sadness"
          },
          {
            "id": "motivation",
            "label": "Мотивация для будущего",
            "labelEn": "Motivation for the future"
          },
          {
            "id": "rare",
            "label": "Редко — живу настоящим",
            "labelEn": "Rare — I live in the present"
          }
        ]
      },
      {
        "id": "no3",
        "type": "text",
        "text": "Какой «старый» момент с тобой ты бы хотел(а) пережить снова?",
        "textEn": "Which 'old' moment with you would you relive?"
      },
      {
        "id": "no4",
        "type": "choice",
        "text": "Фото или вещи из прошлого — это...",
        "textEn": "Photos or things from the past are...",
        "options": [
          {
            "id": "treasure",
            "label": "Сокровища",
            "labelEn": "Treasures"
          },
          {
            "id": "sometimes",
            "label": "Приятно, но не застреваю",
            "labelEn": "Nice, but I don't dwell"
          },
          {
            "id": "forward",
            "label": "Смотрю вперёд",
            "labelEn": "I look forward"
          }
        ]
      }
    ]
  },
  {
    "id": "photo_wall",
    "emoji": "🖼️",
    "title": "Стена воспоминаний",
    "titleEn": "Wall of memories",
    "questions": [
      {
        "id": "pw1",
        "type": "image",
        "text": "Как хранить воспоминания?",
        "textEn": "How to keep memories?",
        "imageKeys": [
          "polaroid_wall",
          "vintage_room"
        ],
        "imageLabels": [
          "Стена поларoidов",
          "Винтажный уголок"
        ],
        "imageLabelsEn": [
          "Polaroid wall",
          "Vintage corner"
        ]
      },
      {
        "id": "pw2",
        "type": "text",
        "text": "Какое фото с нами — твоё любимое?",
        "textEn": "Which photo of us is your favorite?"
      },
      {
        "id": "pw3",
        "type": "choice",
        "text": "Печатать фото или хранить в телефоне?",
        "textEn": "Print photos or keep them on your phone?",
        "options": [
          {
            "id": "print",
            "label": "Печатать — хочу видеть",
            "labelEn": "Print — want to see them"
          },
          {
            "id": "digital",
            "label": "В телефоне достаточно",
            "labelEn": "Phone is enough"
          },
          {
            "id": "both",
            "label": "И то, и другое",
            "labelEn": "Both"
          }
        ]
      },
      {
        "id": "pw4",
        "type": "text",
        "text": "Какое воспоминание ты хотел(а) бы оформить в рамку?",
        "textEn": "Which memory would you frame?"
      }
    ]
  },
  {
    "id": "anniversaries",
    "emoji": "💍",
    "title": "Годовщины",
    "titleEn": "Anniversaries",
    "questions": [
      {
        "id": "an1",
        "type": "choice",
        "text": "Отмечать годовщины — это...",
        "textEn": "Celebrating anniversaries is...",
        "options": [
          {
            "id": "must",
            "label": "Обязательно — каждый год",
            "labelEn": "A must — every year"
          },
          {
            "id": "flexible",
            "label": "Главное — помнить",
            "labelEn": "Main thing is remembering"
          },
          {
            "id": "surprise",
            "label": "Люблю сюрпризы, не даты",
            "labelEn": "Love surprises, not dates"
          }
        ]
      },
      {
        "id": "an2",
        "type": "text",
        "text": "Какую годовщину ты ждёшь с особым нетерпением?",
        "textEn": "Which anniversary are you especially looking forward to?"
      },
      {
        "id": "an3",
        "type": "text",
        "text": "Как мы отметили нашу лучшую годовщину?",
        "textEn": "How did we celebrate our best anniversary?"
      },
      {
        "id": "an4",
        "type": "choice",
        "text": "Идеальный подарок на годовщину — это...",
        "textEn": "The ideal anniversary gift is...",
        "options": [
          {
            "id": "experience",
            "label": "Впечатление вместе",
            "labelEn": "An experience together"
          },
          {
            "id": "symbol",
            "label": "Что-то символичное",
            "labelEn": "Something symbolic"
          },
          {
            "id": "letter",
            "label": "Письмо или слова",
            "labelEn": "A letter or words"
          }
        ]
      }
    ]
  },
  {
    "id": "milestones",
    "emoji": "🏆",
    "title": "Важные вехи",
    "titleEn": "Milestones",
    "questions": [
      {
        "id": "mi1",
        "type": "text",
        "text": "Какая веха в наших отношениях для тебя самая значимая?",
        "textEn": "Which milestone in our relationship matters most to you?"
      },
      {
        "id": "mi2",
        "type": "choice",
        "text": "Праздновать маленькие победы — это...",
        "textEn": "Celebrating small wins is...",
        "options": [
          {
            "id": "yes",
            "label": "Да — каждый шаг важен",
            "labelEn": "Yes — every step matters"
          },
          {
            "id": "sometimes",
            "label": "Иногда забываем",
            "labelEn": "Sometimes we forget"
          },
          {
            "id": "big",
            "label": "Только большие события",
            "labelEn": "Only big events"
          }
        ]
      },
      {
        "id": "mi3",
        "type": "text",
        "text": "Какую следующую веху ты хочешь достичь вместе?",
        "textEn": "What next milestone do you want to reach together?"
      },
      {
        "id": "mi4",
        "type": "choice",
        "text": "Когда мы достигаем цели, ты...",
        "textEn": "When we reach a goal, you...",
        "options": [
          {
            "id": "celebrate",
            "label": "Празднуем!",
            "labelEn": "Celebrate!"
          },
          {
            "id": "quiet",
            "label": "Тихо радуемся",
            "labelEn": "Quietly rejoice"
          },
          {
            "id": "next",
            "label": "Сразу ставим новую",
            "labelEn": "Set a new one right away"
          }
        ]
      }
    ]
  },
  {
    "id": "love_notes",
    "emoji": "💌",
    "title": "Любовные записки",
    "titleEn": "Love notes",
    "questions": [
      {
        "id": "ln1",
        "type": "image",
        "text": "Какой романтический жест ближе?",
        "textEn": "Which romantic gesture feels closer?",
        "imageKeys": [
          "handwritten_note",
          "flowers_bouquet"
        ],
        "imageLabels": [
          "Записка от руки",
          "Букет цветов"
        ],
        "imageLabelsEn": [
          "Handwritten note",
          "Bouquet of flowers"
        ]
      },
      {
        "id": "ln2",
        "type": "text",
        "text": "Получал(а) ли ты когда-нибудь записку от меня? Как это было?",
        "textEn": "Have you ever gotten a note from me? What was it like?"
      },
      {
        "id": "ln3",
        "type": "choice",
        "text": "Письма и записки — это...",
        "textEn": "Letters and notes are...",
        "options": [
          {
            "id": "romantic",
            "label": "Очень романтично",
            "labelEn": "Very romantic"
          },
          {
            "id": "cute",
            "label": "Мило, но редко",
            "labelEn": "Cute, but rare"
          },
          {
            "id": "old",
            "label": "Старомодно — лучше сообщения",
            "labelEn": "Old-fashioned — messages are better"
          }
        ]
      },
      {
        "id": "ln4",
        "type": "text",
        "text": "Что бы ты написал(а) мне в записке, если бы оставил(а) её утром?",
        "textEn": "What would you write in a note if you left it for me in the morning?"
      }
    ]
  },
  {
    "id": "surprises_us",
    "emoji": "🎊",
    "title": "Сюрпризы",
    "titleEn": "Surprises",
    "questions": [
      {
        "id": "su1",
        "type": "choice",
        "text": "Сюрпризы для тебя — это...",
        "textEn": "Surprises for you are...",
        "options": [
          {
            "id": "love",
            "label": "Обожаю!",
            "labelEn": "Love them!"
          },
          {
            "id": "mixed",
            "label": "Зависит — люблю приятные",
            "labelEn": "Depends — I like nice ones"
          },
          {
            "id": "plan",
            "label": "Предпочитаю знать заранее",
            "labelEn": "Prefer knowing ahead"
          }
        ]
      },
      {
        "id": "su2",
        "type": "text",
        "text": "Какой сюрприз от меня ты никогда не забудешь?",
        "textEn": "Which surprise from me will you never forget?"
      },
      {
        "id": "su3",
        "type": "choice",
        "text": "Устраивать сюрпризы — это...",
        "textEn": "Planning surprises is...",
        "options": [
          {
            "id": "fun",
            "label": "Весело — люблю готовить",
            "labelEn": "Fun — I love planning"
          },
          {
            "id": "stress",
            "label": "Стress — боюсь не угадать",
            "labelEn": "Stressful — afraid to miss"
          },
          {
            "id": "rare",
            "label": "Редко, но от души",
            "labelEn": "Rare, but from the heart"
          }
        ]
      },
      {
        "id": "su4",
        "type": "text",
        "text": "Какой сюрприз ты хотел(а) бы устроить мне?",
        "textEn": "What surprise would you like to plan for me?"
      }
    ]
  },
  {
    "id": "city_nights",
    "emoji": "🌃",
    "title": "Городские ночи",
    "titleEn": "City nights",
    "questions": [
      {
        "id": "cn1",
        "type": "image",
        "text": "Идеальный вечер — это...",
        "textEn": "The ideal evening is...",
        "imageKeys": [
          "city_night",
          "sunset_beach"
        ],
        "imageLabels": [
          "Огни города",
          "Закат у моря"
        ],
        "imageLabelsEn": [
          "City lights",
          "Sunset by the sea"
        ]
      },
      {
        "id": "cn2",
        "type": "text",
        "text": "Какой город ты мечтаешь исследовать вместе ночью?",
        "textEn": "Which city do you dream of exploring together at night?"
      },
      {
        "id": "cn3",
        "type": "choice",
        "text": "Ночные прогулки — это...",
        "textEn": "Night walks are...",
        "options": [
          {
            "id": "romantic",
            "label": "Романтика!",
            "labelEn": "Romantic!"
          },
          {
            "id": "rare",
            "label": "Редко — устаём",
            "labelEn": "Rare — we get tired"
          },
          {
            "id": "adventure",
            "label": "Приключение",
            "labelEn": "An adventure"
          }
        ]
      },
      {
        "id": "cn4",
        "type": "text",
        "text": "Какой вечер в городе с тобой запомнился больше всего?",
        "textEn": "Which city evening with you stuck with you most?"
      }
    ]
  },
  {
    "id": "market_stroll",
    "emoji": "🥬",
    "title": "Рынок и прогулка",
    "titleEn": "Market stroll",
    "questions": [
      {
        "id": "mk1",
        "type": "image",
        "text": "Куда пойти в субботу?",
        "textEn": "Where to go on Saturday?",
        "imageKeys": [
          "farmers_market",
          "vintage_room"
        ],
        "imageLabels": [
          "Фермерский рынок",
          "Винтажная лавка"
        ],
        "imageLabelsEn": [
          "Farmers market",
          "Vintage shop"
        ]
      },
      {
        "id": "mk2",
        "type": "text",
        "text": "Совместный поход за продуктами — свидание или рутина?",
        "textEn": "Grocery shopping together — date or routine?"
      },
      {
        "id": "mk3",
        "type": "choice",
        "text": "Рынок или супermarket — что ближе?",
        "textEn": "Market or supermarket — what's closer?",
        "options": [
          {
            "id": "market",
            "label": "Рынок — атмосфера",
            "labelEn": "Market — the atmosphere"
          },
          {
            "id": "super",
            "label": "Супermarket — быстро",
            "labelEn": "Supermarket — quick"
          },
          {
            "id": "delivery",
            "label": "Доставка",
            "labelEn": "Delivery"
          }
        ]
      },
      {
        "id": "mk4",
        "type": "text",
        "text": "Что бы мы нашли на идеальном рынке?",
        "textEn": "What would we find at the ideal market?"
      }
    ]
  },
  {
    "id": "growth_together",
    "emoji": "🌿",
    "title": "Растём вместе",
    "titleEn": "Growing together",
    "questions": [
      {
        "id": "gt1",
        "type": "text",
        "text": "Чему я научил(а) тебя за время наших отношений?",
        "textEn": "What have I taught you during our relationship?"
      },
      {
        "id": "gt2",
        "type": "choice",
        "text": "Расти как пара — это...",
        "textEn": "Growing as a couple is...",
        "options": [
          {
            "id": "conscious",
            "label": "Осознанная работа",
            "labelEn": "Conscious work"
          },
          {
            "id": "natural",
            "label": "Происходит само",
            "labelEn": "Happens naturally"
          },
          {
            "id": "challenge",
            "label": "Вызов, но стоит того",
            "labelEn": "A challenge, but worth it"
          }
        ]
      },
      {
        "id": "gt3",
        "type": "text",
        "text": "В чём ты стал(а) лучше благодаря нашим отношениям?",
        "textEn": "What have you become better at thanks to us?"
      },
      {
        "id": "gt4",
        "type": "choice",
        "text": "Как мы можем расти вместе в этом году?",
        "textEn": "How can we grow together this year?",
        "options": [
          {
            "id": "goals",
            "label": "Общие цели",
            "labelEn": "Shared goals"
          },
          {
            "id": "habits",
            "label": "Новые привычки",
            "labelEn": "New habits"
          },
          {
            "id": "talk",
            "label": "Больше глубоких разговоров",
            "labelEn": "More deep talks"
          }
        ]
      }
    ]
  },
  {
    "id": "change_adapt",
    "emoji": "🔄",
    "title": "Изменения и адаптация",
    "titleEn": "Change & adaptation",
    "questions": [
      {
        "id": "ca1",
        "type": "choice",
        "text": "Когда жизнь меняется, ты...",
        "textEn": "When life changes, you...",
        "options": [
          {
            "id": "adapt",
            "label": "Быстро адаптируюсь",
            "labelEn": "Adapt quickly"
          },
          {
            "id": "stress",
            "label": "Стрессую, потом принимаю",
            "labelEn": "Stress, then accept"
          },
          {
            "id": "partner",
            "label": "Опираюсь на партнёра",
            "labelEn": "Lean on my partner"
          }
        ]
      },
      {
        "id": "ca2",
        "type": "text",
        "text": "Какое большое изменение мы пережили лучше всего?",
        "textEn": "Which big change did we handle best?"
      },
      {
        "id": "ca3",
        "type": "text",
        "text": "Что пугает тебя в переменах — и как я могу помочь?",
        "textEn": "What scares you about change — and how can I help?"
      },
      {
        "id": "ca4",
        "type": "choice",
        "text": "Изменения в отношениях — это...",
        "textEn": "Changes in a relationship are...",
        "options": [
          {
            "id": "growth",
            "label": "Рост",
            "labelEn": "Growth"
          },
          {
            "id": "scary",
            "label": "Страшно",
            "labelEn": "Scary"
          },
          {
            "id": "normal",
            "label": "Нормальная часть жизни",
            "labelEn": "A normal part of life"
          }
        ]
      }
    ]
  },
  {
    "id": "humor_style",
    "emoji": "😄",
    "title": "Юмор в паре",
    "titleEn": "Humor in the couple",
    "questions": [
      {
        "id": "hs1",
        "type": "choice",
        "text": "Твой тип юмора — это...",
        "textEn": "Your type of humor is...",
        "options": [
          {
            "id": "sarcasm",
            "label": "Сарказм и ирония",
            "labelEn": "Sarcasm and irony"
          },
          {
            "id": "silly",
            "label": "Глупости и мемы",
            "labelEn": "Silliness and memes"
          },
          {
            "id": "warm",
            "label": "Тёплый и добрый",
            "labelEn": "Warm and kind"
          }
        ]
      },
      {
        "id": "hs2",
        "type": "text",
        "text": "Когда мы смеёмся вместе — над чем чаще всего?",
        "textEn": "When we laugh together — at what most often?"
      },
      {
        "id": "hs3",
        "type": "choice",
        "text": "Шутить в ссоре — это...",
        "textEn": "Joking during a fight is...",
        "options": [
          {
            "id": "helps",
            "label": "Помогает разрядить",
            "labelEn": "Helps defuse"
          },
          {
            "id": "worse",
            "label": "Только хуже",
            "labelEn": "Makes it worse"
          },
          {
            "id": "depends",
            "label": "Зависит от ситуации",
            "labelEn": "Depends on the situation"
          }
        ]
      },
      {
        "id": "hs4",
        "type": "text",
        "text": "Какая шутка или мем стала «нашей»?",
        "textEn": "Which joke or meme became 'ours'?"
      }
    ]
  },
  {
    "id": "inside_jokes",
    "emoji": "🤫",
    "title": "Секретные шутки",
    "titleEn": "Inside jokes",
    "questions": [
      {
        "id": "ij1",
        "type": "text",
        "text": "Какая наша inside joke сразу заставляет тебя улыбнуться?",
        "textEn": "Which inside joke instantly makes you smile?"
      },
      {
        "id": "ij2",
        "type": "choice",
        "text": "Inside jokes — это...",
        "textEn": "Inside jokes are...",
        "options": [
          {
            "id": "bond",
            "label": "Наша связь",
            "labelEn": "Our bond"
          },
          {
            "id": "many",
            "label": "Их слишком много",
            "labelEn": "Too many to count"
          },
          {
            "id": "building",
            "label": "Ещё создаём",
            "labelEn": "Still building them"
          }
        ]
      },
      {
        "id": "ij3",
        "type": "text",
        "text": "Как появилась наша самая странная шутка?",
        "textEn": "How did our weirdest joke start?"
      },
      {
        "id": "ij4",
        "type": "choice",
        "text": "Если бы посторонний услышал нас, он бы...",
        "textEn": "If a stranger heard us, they would...",
        "options": [
          {
            "id": "confused",
            "label": "Ничего не понял",
            "labelEn": "Understand nothing"
          },
          {
            "id": "laugh",
            "label": "Тоже засмеялся",
            "labelEn": "Laugh too"
          },
          {
            "id": "jealous",
            "label": "Завидовал нашей связи",
            "labelEn": "Envy our connection"
          }
        ]
      }
    ]
  },
  {
    "id": "legacy_dreams",
    "emoji": "🌍",
    "title": "Наследие и смысл",
    "titleEn": "Legacy & meaning",
    "questions": [
      {
        "id": "ld1",
        "type": "text",
        "text": "Какой след ты хочешь оставить вместе со мной?",
        "textEn": "What mark do you want to leave together with me?"
      },
      {
        "id": "ld2",
        "type": "choice",
        "text": "Смысл жизни для тебя — это...",
        "textEn": "Meaning of life for you is...",
        "options": [
          {
            "id": "love",
            "label": "Любовь и близкие",
            "labelEn": "Love and loved ones"
          },
          {
            "id": "create",
            "label": "Создавать что-то",
            "labelEn": "Creating something"
          },
          {
            "id": "experience",
            "label": "Переживать и чувствовать",
            "labelEn": "Experiencing and feeling"
          }
        ]
      },
      {
        "id": "ld3",
        "type": "text",
        "text": "О чём ты хочешь, чтобы мы вспоминали через 20 лет?",
        "textEn": "What do you want us to remember in 20 years?"
      },
      {
        "id": "ld4",
        "type": "choice",
        "text": "Если бы мы написали книгу о нас, жанр был бы...",
        "textEn": "If we wrote a book about us, the genre would be...",
        "options": [
          {
            "id": "romance",
            "label": "Роман",
            "labelEn": "Romance"
          },
          {
            "id": "comedy",
            "label": "Комедия",
            "labelEn": "Comedy"
          },
          {
            "id": "adventure",
            "label": "Приключения",
            "labelEn": "Adventure"
          }
        ]
      }
    ]
  },
  {
    "id": "adventure_bucket",
    "emoji": "🎒",
    "title": "Список приключений",
    "titleEn": "Adventure bucket list",
    "questions": [
      {
        "id": "ab1",
        "type": "text",
        "text": "Какое приключение из «списка мечты» ты хочешь сделать первым?",
        "textEn": "Which bucket-list adventure do you want to do first?"
      },
      {
        "id": "ab2",
        "type": "choice",
        "text": "Адrenaline vs спокойствие — что выбираешь?",
        "textEn": "Adrenaline vs calm — what do you pick?",
        "options": [
          {
            "id": "adrenaline",
            "label": "Adrenaline — прыжок, дайving",
            "labelEn": "Adrenaline — jump, diving"
          },
          {
            "id": "calm",
            "label": "Спокойствие — трекking, кемпинг",
            "labelEn": "Calm — trekking, camping"
          },
          {
            "id": "mix",
            "label": "Микс",
            "labelEn": "A mix"
          }
        ]
      },
      {
        "id": "ab3",
        "type": "text",
        "text": "Какое безумное приключение мы ещё не пробовали?",
        "textEn": "What crazy adventure haven't we tried yet?"
      },
      {
        "id": "ab4",
        "type": "choice",
        "text": "Bucket list для нас — это...",
        "textEn": "A bucket list for us is...",
        "options": [
          {
            "id": "have",
            "label": "Уже есть список!",
            "labelEn": "We already have one!"
          },
          {
            "id": "make",
            "label": "Пора составить",
            "labelEn": "Time to make one"
          },
          {
            "id": "spontaneous",
            "label": "Спontanно — без списков",
            "labelEn": "Spontaneous — no lists"
          }
        ]
      }
    ]
  },
  {
    "id": "quiet_moments",
    "emoji": "🤍",
    "title": "Тихие моменты",
    "titleEn": "Quiet moments",
    "questions": [
      {
        "id": "qm1",
        "type": "choice",
        "text": "Молчание вместе — это...",
        "textEn": "Silence together is...",
        "options": [
          {
            "id": "comfort",
            "label": "Комфорт и близость",
            "labelEn": "Comfort and closeness"
          },
          {
            "id": "awkward",
            "label": "Иногда неловко",
            "labelEn": "Sometimes awkward"
          },
          {
            "id": "rare",
            "label": "Редко — мы болтаем",
            "labelEn": "Rare — we talk a lot"
          }
        ]
      },
      {
        "id": "qm2",
        "type": "text",
        "text": "Какой тихий момент с тобой ты бы сохранил(а) навсегда?",
        "textEn": "Which quiet moment with you would you keep forever?"
      },
      {
        "id": "qm3",
        "type": "choice",
        "text": "Идеальный тихий вечер — это...",
        "textEn": "The ideal quiet evening is...",
        "options": [
          {
            "id": "read",
            "label": "Читать рядом",
            "labelEn": "Reading side by side"
          },
          {
            "id": "cuddle",
            "label": "Просто обниматься",
            "labelEn": "Just cuddling"
          },
          {
            "id": "nature",
            "label": "Смотреть в окно или на звёзды",
            "labelEn": "Looking out the window or at stars"
          }
        ]
      },
      {
        "id": "qm4",
        "type": "text",
        "text": "Что ты чувствуешь, когда мы просто молчим, но рядом?",
        "textEn": "What do you feel when we're just quiet but together?"
      }
    ]
  },
  {
    "id": "cozy_evenings",
    "emoji": "🍷",
    "title": "Уютные вечера",
    "titleEn": "Cozy evenings",
    "questions": [
      {
        "id": "ce1",
        "type": "image",
        "text": "Как провести вечер?",
        "textEn": "How to spend the evening?",
        "imageKeys": [
          "wine_evening",
          "couch_movie"
        ],
        "imageLabels": [
          "Бокал вина и разговор",
          "Плед и фильм"
        ],
        "imageLabelsEn": [
          "Glass of wine and talk",
          "Blanket and a movie"
        ]
      },
      {
        "id": "ce2",
        "type": "choice",
        "text": "Вечер дома vs выход — что чаще?",
        "textEn": "Evening at home vs going out — what's more often?",
        "options": [
          {
            "id": "home",
            "label": "Дома — уют",
            "labelEn": "Home — cozy"
          },
          {
            "id": "out",
            "label": "Выходим",
            "labelEn": "We go out"
          },
          {
            "id": "balance",
            "label": "50/50",
            "labelEn": "50/50"
          }
        ]
      },
      {
        "id": "ce3",
        "type": "text",
        "text": "Какой уютный вечер с тобой — идеал?",
        "textEn": "What's your ideal cozy evening with me?"
      },
      {
        "id": "ce4",
        "type": "choice",
        "text": "Что делает вечер «идеальным»?",
        "textEn": "What makes an evening 'perfect'?",
        "options": [
          {
            "id": "presence",
            "label": "Полное присутствие друг друга",
            "labelEn": "Full presence with each other"
          },
          {
            "id": "comfort",
            "label": "Комфорт — еда, плед, тишина",
            "labelEn": "Comfort — food, blanket, quiet"
          },
          {
            "id": "surprise",
            "label": "Небольшой сюрприз",
            "labelEn": "A small surprise"
          }
        ]
      }
    ]
  }
];


function tsEscape(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function renderQuestion(q) {
  if (q.type === 'text') {
    return `{ id: '${q.id}', type: 'text', text: '${tsEscape(q.text)}' }`;
  }
  if (q.type === 'choice') {
    const opts = q.options
      .map((o) => `{ id: '${o.id}', label: '${tsEscape(o.label)}' }`)
      .join(', ');
    return `{ id: '${q.id}', type: 'choice', text: '${tsEscape(q.text)}', options: [${opts}] }`;
  }
  if (q.type === 'image') {
    const images = q.imageKeys
      .map((key, i) => `{ id: '${key}', label: '${tsEscape(q.imageLabels[i])}', url: IMG.${key} }`)
      .join(', ');
    return `{ id: '${q.id}', type: 'image', text: '${tsEscape(q.text)}', images: [${images}] }`;
  }
  throw new Error(`Unknown question type: ${q.type}`);
}

function renderQuestionI18n(q) {
  if (q.type === 'text') {
    return `{ text: '${tsEscape(q.textEn)}' }`;
  }
  if (q.type === 'choice') {
    const opts = q.options.map((o) => `${o.id}: '${tsEscape(o.labelEn)}'`).join(', ');
    return `{ text: '${tsEscape(q.textEn)}', options: { ${opts} } }`;
  }
  if (q.type === 'image') {
    const imgs = q.imageKeys.map((key, i) => `${key}: '${tsEscape(q.imageLabelsEn[i])}'`).join(', ');
    return `{ text: '${tsEscape(q.textEn)}', images: { ${imgs} } }`;
  }
  throw new Error(`Unknown question type: ${q.type}`);
}

function generateExtraCategories() {
  const blocks = CATEGORIES.map((cat) => {
    const qs = cat.questions.map((q) => '      ' + renderQuestion(q)).join(',\n');
    return `  {\n    id: '${cat.id}',\n    emoji: '${cat.emoji}',\n    title: '${tsEscape(cat.title)}',\n    questions: [\n${qs},\n    ],\n  }`;
  }).join(',\n');
  return `import { DAILY_QUESTION_IMAGES as IMG } from './dailyQuestionsImages';\nimport type { DailyQuestionCategory } from './dailyQuestionsContent';\n\nexport const EXTRA_DAILY_QUESTION_CATEGORIES: DailyQuestionCategory[] = [\n${blocks},\n];\n`;
}

function generateExtraCategoriesI18n() {
  const blocks = CATEGORIES.map((cat) => {
    const qs = cat.questions
      .map((q) => `      ${q.id}: ${renderQuestionI18n(q).replace(/\n/g, ' ')}`)
      .join(',\n');
    return `  ${cat.id}: {\n    title: '${tsEscape(cat.titleEn)}',\n    questions: {\n${qs},\n    },\n  }`;
  }).join(',\n');
  return `type QuestionOverlay = {\n  text?: string;\n  options?: Record<string, string>;\n  images?: Record<string, string>;\n};\n\ntype CategoryOverlay = {\n  title: string;\n  questions: Record<string, QuestionOverlay>;\n};\n\n/** English copy for extra daily question categories (base content is Russian). */\nexport const EXTRA_DAILY_QUESTIONS_EN: Record<string, CategoryOverlay> = {\n${blocks},\n};\n`;
}

function validate() {
  const ids = CATEGORIES.map((c) => c.id);
  if (ids.length !== 85) throw new Error(`Expected 85 categories, got ${ids.length}`);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate category ids');
  for (const id of ids) {
    if (EXISTING_CATEGORY_IDS.has(id)) throw new Error(`Duplicate existing category: ${id}`);
  }
  for (const cat of CATEGORIES) {
    if (cat.questions.length !== 4) throw new Error(`Category ${cat.id} must have 4 questions`);
  }
  const imageCats = CATEGORIES.filter((c) => c.questions.some((q) => q.type === 'image'));
  if (imageCats.length < 18 || imageCats.length > 22) {
    throw new Error(`Expected ~20 image categories, got ${imageCats.length}`);
  }
  const usedKeys = new Set();
  for (const cat of CATEGORIES) {
    for (const q of cat.questions) {
      if (q.type === 'image') q.imageKeys.forEach((k) => usedKeys.add(k));
    }
  }
  for (const key of NEW_IMAGE_KEYS) {
    if (!usedKeys.has(key)) throw new Error(`Unused image key: ${key}`);
  }
}

function main() {
  validate();
  fs.writeFileSync(OUT_CATEGORIES, generateExtraCategories(), 'utf8');
  fs.writeFileSync(OUT_I18N, generateExtraCategoriesI18n(), 'utf8');
  console.log(`Generated ${CATEGORIES.length} categories →`);
  console.log(`  ${OUT_CATEGORIES}`);
  console.log(`  ${OUT_I18N}`);
  console.log(`Image keys (${NEW_IMAGE_KEYS.length}): ${NEW_IMAGE_KEYS.join(', ')}`);
}

main();

