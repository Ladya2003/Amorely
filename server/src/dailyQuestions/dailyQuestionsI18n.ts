import { AppLocale } from '../i18n/locales';
import type { DailyQuestion, DailyQuestionCategory } from './dailyQuestionsContent';

type QuestionOverlay = {
  text?: string;
  options?: Record<string, string>;
  images?: Record<string, string>;
};

type CategoryOverlay = {
  title: string;
  questions: Record<string, QuestionOverlay>;
};

/** English copy for daily question categories (base content is Russian). */
const EN: Record<string, CategoryOverlay> = {
  never_have_i_ever: {
    title: 'Never have I ever...',
    questions: {
      n1: { text: 'Never have I ever... (write your funniest "sin")' },
      n2: {
        text: 'Never have I ever secretly read my partner\'s messages',
        options: { yes: 'Yes, guilty 🙈', no: 'Never!', tempted: 'Wanted to, but resisted' },
      },
      n3: { text: 'Never have I ever done something crazy for love. Tell me!' },
      n4: {
        text: 'Never have I ever fallen asleep during a movie date',
        options: { guilty: 'Guilty 😴', never: 'Never!', partner: 'My partner fell asleep!' },
      },
    },
  },
  intimate_life: {
    title: 'Our intimate life',
    questions: {
      i1: {
        text: 'What matters more to you in intimacy?',
        options: { passion: 'Passion and spontaneity', tenderness: 'Tenderness and trust', balance: 'A balance of both' },
      },
      i2: { text: 'What compliment from your partner turns you on the most?' },
      i3: {
        text: 'Ideal atmosphere for a romantic evening?',
        options: { candles: 'Candles and quiet', music: 'Music and dancing', surprise: 'A surprise with no prep' },
      },
      i4: { text: 'What do you dream about but haven\'t told your partner yet?' },
    },
  },
  couple_life: {
    title: 'Couple life',
    questions: {
      c1: {
        text: 'Who usually cooks at home?',
        options: { me: 'Me', partner: 'My partner', together: 'Together', delivery: 'Delivery is our friend' },
      },
      c2: { text: 'Which everyday moment with your partner do you enjoy most?' },
      c3: {
        text: 'How do you usually make up after a fight?',
        options: { talk: 'A calm talk', hug: 'Hugs without words', time: 'Need time alone', humor: 'A joke and laughter' },
      },
      c4: { text: 'Which habit of your partner would you like to adopt?' },
    },
  },
  dream_house: {
    title: 'Dream home',
    questions: {
      d1: {
        text: 'Which home feels more like you?',
        images: { modern: 'Modern', cozy: 'Cozy cottage' },
      },
      d2: {
        text: 'Where would you like to live?',
        images: { beach: 'By the sea', mountain: 'In the mountains' },
      },
      d3: { text: 'Which room in your dream home is your favorite and why?' },
      d4: {
        text: 'Which kitchen do you prefer?',
        images: { kitchen: 'Bright and spacious', fireplace: 'With a fireplace nearby' },
      },
    },
  },
  love_in_balance: {
    title: 'Love in balance',
    questions: {
      l1: {
        text: 'How much alone time do you need in a relationship?',
        options: { lot: 'A lot — I\'m an introvert', some: 'A little every day', little: 'Not much — I want us together' },
      },
      l2: { text: 'What helps you feel balance between "us" and "me"?' },
      l3: {
        text: 'How do you react when your partner is busy and doesn\'t reply?',
        options: { calm: 'I wait calmly', worry: 'I start worrying', busy: 'I keep myself busy too' },
      },
      l4: { text: 'What can your partner do to help you feel safe?' },
    },
  },
  holiday_habits: {
    title: 'Holiday habits',
    questions: {
      h1: {
        text: 'How do you prefer to celebrate New Year?',
        options: { home: 'At home, cozy', party: 'At a big party', travel: 'While traveling' },
      },
      h2: { text: 'Which holiday would you especially like to celebrate together?' },
      h3: {
        text: 'How do you feel about holiday gifts?',
        options: { love: 'Love giving and receiving', simple: 'Time together matters most', surprise: 'I love surprises' },
      },
      h4: { text: 'Which childhood holiday tradition is dear to you?' },
    },
  },
  first_dates: {
    title: 'First dates',
    questions: {
      f1: { text: 'What do you remember most about our first date?' },
      f2: {
        text: 'Your ideal first date is...',
        options: { walk: 'A walk and conversation', dinner: 'Dinner at a restaurant', adventure: 'Something unusual' },
      },
      f3: { text: 'What moment made you want to keep dating?' },
      f4: {
        text: 'How did you feel before our first kiss?',
        options: { nervous: 'Nervous', natural: 'It felt natural', excited: 'Excited and thrilled' },
      },
    },
  },
  future_together: {
    title: 'Future together',
    questions: {
      u1: { text: 'How do you see our life in 5 years?' },
      u2: {
        text: 'How many children (if any) would you want?',
        options: { zero: 'None', one_two: '1–2 kids', big: 'A big family', open: 'We\'ll see' },
      },
      u3: { text: 'What dream do you want us to fulfill together this year?' },
      u4: {
        text: 'Where would you spend a golden anniversary?',
        options: { home: 'At home with loved ones', abroad: 'In a faraway country', revisit: 'Where we first met' },
      },
    },
  },
  food_romance: {
    title: 'Food & romance',
    questions: {
      r1: {
        text: 'The perfect romantic dinner is...',
        options: { cook: 'Cooking together at home', restaurant: 'Candlelit restaurant', picnic: 'Picnic outdoors' },
      },
      r2: { text: 'Which dish reminds you of our relationship?' },
      r3: {
        text: 'How do you feel about grocery shopping together?',
        options: { love: 'Love it — it\'s a date!', ok: 'Fine if it\'s quick', no: 'Prefer going alone' },
      },
      r4: { text: 'Which taste or scent reminds you of us?' },
    },
  },
  travel_dreams: {
    title: 'Dream trips',
    questions: {
      t1: {
        text: 'Where should we go on the next vacation?',
        images: { beach: 'Beach and sun', city: 'City and culture' },
      },
      t2: { text: 'What trip do you dream of taking with me?' },
      t3: {
        text: 'Your travel style is...',
        options: { plan: 'Fully planned', spontaneous: 'Spontaneous and adventurous', mix: 'Mix of plans and improvisation' },
      },
      t4: {
        text: 'Where to stay when traveling?',
        images: { hotel: 'Hotel with a view', cottage: 'Cozy cottage' },
      },
    },
  },
  silly_moments: {
    title: 'Silly secrets',
    questions: {
      s1: { text: 'What\'s our funniest story that you tell friends?' },
      s2: {
        text: 'What do you do to cheer up your partner?',
        options: { joke: 'Jokes and goofing around', gift: 'A small surprise', hug: 'A tight hug' },
      },
      s3: { text: 'What weird talent do you have that I might not know about?' },
      s4: {
        text: 'If we were cartoon characters, it would be...',
        options: { comedy: 'A comedy', adventure: 'An adventure', romance: 'A romantic fairy tale' },
      },
    },
  },
  deep_connection: {
    title: 'Deep connection',
    questions: {
      p1: { text: 'When did you last feel that I truly understand you?' },
      p2: {
        text: 'What does "being heard" mean to you?',
        options: { listen: 'Listening without advice', support: 'Support in words and actions', empathy: 'Feeling my emotions' },
      },
      p3: { text: 'What is hardest for you to talk about, but you want to try?' },
      p4: {
        text: 'How often do you need deep conversations?',
        options: { daily: 'Almost every day', weekly: 'Once a week', sometimes: 'Sometimes, but they matter' },
      },
    },
  },
  music_mood: {
    title: 'Music & mood',
    questions: {
      m1: { text: 'Which song reminds you of us?' },
      m2: {
        text: 'What music do you play for a romantic mood?',
        options: { slow: 'Slow ballads', jazz: 'Jazz / lo-fi', fun: 'Upbeat hits' },
      },
      m3: { text: 'Which concert or festival would you visit together?' },
      m4: {
        text: 'Dancing at home is...',
        options: { love: 'Our ritual!', sometimes: 'Sometimes, when the mood hits', shy: 'Shy, but I\'ll try' },
      },
    },
  },
  morning_night: {
    title: 'Morning & night',
    questions: {
      o1: {
        text: 'Are you a night owl or an early bird?',
        options: { owl: 'Night owl 🦉', lark: 'Early bird 🐦', depends: 'Depends on the day' },
      },
      o2: { text: 'What does your ideal morning together look like?' },
      o3: {
        text: 'How do you sleep best?',
        options: { cuddle: 'Cuddling', space: 'Need a little space', talk: 'After talking about the day' },
      },
      o4: {
        text: 'Which bedroom feels more like you?',
        images: { bedroom: 'Minimalism and light', cozy: 'Cozy textiles' },
      },
    },
  },
  gifts_surprises: {
    title: 'Gifts & surprises',
    questions: {
      g1: {
        text: 'Which gift do you prefer?',
        options: { handmade: 'Handmade', experience: 'An experience / trip', thing: 'Something I\'ve wanted for ages' },
      },
      g2: { text: 'What surprise from your partner stuck with you the most?' },
      g3: {
        text: 'How do you feel about public displays of affection?',
        options: { love: 'Love them!', sometimes: 'Sometimes — yes', private: 'Prefer in private' },
      },
      g4: { text: 'What small daily gesture would make you happier?' },
    },
  },
};

const localizeQuestion = (question: DailyQuestion, overlay?: QuestionOverlay): DailyQuestion => {
  if (!overlay) return question;

  return {
    ...question,
    text: overlay.text ?? question.text,
    options: question.options?.map((option) => ({
      ...option,
      label: overlay.options?.[option.id] ?? option.label,
    })),
    images: question.images?.map((image) => ({
      ...image,
      label: overlay.images?.[image.id] ?? image.label,
    })),
  };
};

export const resolveDailyQuestionsContentLocale = (locale: AppLocale): 'ru' | 'en' => {
  if (locale === 'ru') return 'ru';
  return 'en';
};

export const localizeCategory = (
  category: DailyQuestionCategory,
  locale: AppLocale
): DailyQuestionCategory => {
  if (resolveDailyQuestionsContentLocale(locale) === 'ru') {
    return category;
  }

  const overlay = EN[category.id];
  if (!overlay) return category;

  return {
    ...category,
    title: overlay.title,
    questions: category.questions.map((question) =>
      localizeQuestion(question, overlay.questions[question.id])
    ),
  };
};

export const getLocalizedCategoryTitle = (
  categoryId: string,
  fallback: string,
  locale: AppLocale
): string => {
  if (resolveDailyQuestionsContentLocale(locale) === 'ru') return fallback;
  return EN[categoryId]?.title ?? fallback;
};

export const getLocalizedQuestion = (
  categoryId: string,
  question: DailyQuestion,
  locale: AppLocale
): DailyQuestion => {
  if (resolveDailyQuestionsContentLocale(locale) === 'ru') return question;
  const overlay = EN[categoryId]?.questions[question.id];
  return localizeQuestion(question, overlay);
};

export const getLocalizedAnswerLabel = (
  categoryId: string,
  question: DailyQuestion,
  value: string,
  locale: AppLocale
): string => {
  const localized = getLocalizedQuestion(categoryId, question, locale);
  if (localized.type === 'choice' && localized.options) {
    return localized.options.find((o) => o.id === value)?.label ?? value;
  }
  if (localized.type === 'image' && localized.images) {
    return localized.images.find((o) => o.id === value)?.label ?? value;
  }
  return value;
};
