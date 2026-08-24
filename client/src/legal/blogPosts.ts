import type { LegalLocale } from './legalLocale';

export type BlogCategoryId = 'product' | 'tips' | 'updates';

export type BlogPost = {
  slug: string;
  category: BlogCategoryId;
  publishedAt: string;
  imageFile: string;
  title: Record<LegalLocale, string>;
  excerpt: Record<LegalLocale, string>;
  paragraphs: Record<LegalLocale, string[]>;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'private-space-for-two',
    category: 'product',
    publishedAt: '2026-08-20',
    imageFile: '1. avatars, feed light.PNG',
    title: {
      ru: 'Amorely — личное пространство только для двоих',
      en: 'Amorely — a private space just for the two of you',
    },
    excerpt: {
      ru: 'Общая лента, аватары рядом и воспоминания, которые не растворяются в обычном мессенджере.',
      en: 'A shared feed, avatars side by side, and memories that do not disappear into a regular messenger.',
    },
    paragraphs: {
      ru: [
        'Amorely задуман как закрытое пространство пары, а не как ещё одна лента для друзей и сторис. Здесь вы видите друг друга: аватары, расстояние, общие фото и важные дни — без посторонней аудитории.',
        'Лента собирает моменты, которые вы сами добавляете. Это не публичный профиль и не соцсеть «для всех». Большинство функций открывается после того, как вы свяжете аккаунты как партнёры.',
        'Если вы давно искали место, где переписка, фото и планы живут вместе, а не в пяти разных приложениях — начните с бесплатной регистрации и пригласите вторую половину.',
      ],
      en: [
        'Amorely is a closed space for a couple, not another feed for friends and stories. You see each other: avatars, distance, shared photos, and important days — without an outside audience.',
        'The feed collects moments you add yourselves. It is not a public profile or a social network “for everyone”. Most features unlock after you link accounts as partners.',
        'If you have been looking for one place where chat, photos, and plans live together instead of across five apps, start with a free account and invite your partner.',
      ],
    },
  },
  {
    slug: 'encrypted-chat-and-games',
    category: 'product',
    publishedAt: '2026-08-21',
    imageFile: '6. chat light.PNG',
    title: {
      ru: 'Зашифрованный чат и игры, которые имеют смысл вдвоём',
      en: 'Encrypted chat and games that only make sense together',
    },
    excerpt: {
      ru: 'Переписка остаётся между вами. Рядом — угадай место, рисунок и другие игры для пары.',
      en: 'Messages stay between you. Nearby: guess the location, draw & guess, and other couple games.',
    },
    paragraphs: {
      ru: [
        'Чат в Amorely использует сквозное шифрование: содержимое сообщений рассчитано на то, чтобы его читали только вы двое, а не администрация сервиса.',
        'Из чата можно перейти в игры: угадать место на карте, сравнить точки, нарисовать загадку партнёру. Это короткий ритуал на вечер, а не бесконечная лента рекомендаций.',
        'Правила простые: чат для добровольного общения пары, без угроз, спама и запрещённого законом контента. Пользуйтесь им так, как пользовались бы личным дневником на двоих.',
      ],
      en: [
        'Amorely chat uses end-to-end encryption: message contents are meant to be read only by the two of you, not by the service administration.',
        'From chat you can jump into games: guess a place on the map, compare pins, or sketch a prompt for your partner. It is a short evening ritual, not an infinite recommendation feed.',
        'The rules are simple: chat is for a couple’s voluntary conversation — no threats, spam, or illegal content. Use it the way you would use a private journal for two.',
      ],
    },
  },
  {
    slug: 'calendar-and-free-forever-for-now',
    category: 'tips',
    publishedAt: '2026-08-22',
    imageFile: '10. calendar light.PNG',
    title: {
      ru: 'Календарь воспоминаний — и почему сейчас всё бесплатно',
      en: 'A memory calendar — and why everything is free right now',
    },
    excerpt: {
      ru: 'Откройте месяц и сразу увидите, как вы жили. Подписок и скрытых платежей нет.',
      en: 'Open a month and see how you have been living. No subscriptions and no hidden fees.',
    },
    paragraphs: {
      ru: [
        'Общий календарь превращает даты в фотодневник: события, особенные дни и галерея месяцев. Это удобно и тем, кто рядом, и тем, кто живёт в разных часовых поясах.',
        'Рядом с календарём — вопрос дня, питомец, идеи свиданий и счётчик дней вместе. Всё это уже доступно без оплаты.',
        'На этом этапе Amorely полностью бесплатен: нет премиума и нет страницы оплаты. Если когда-нибудь появятся платные функции, мы опишем их в оферте заранее — а не «на третьем экране после регистрации».',
      ],
      en: [
        'The shared calendar turns dates into a photo diary: events, special days, and a gallery of months. It works whether you share a city or live across time zones.',
        'Beside the calendar you get questions of the day, a shared pet, dating ideas, and a days-together counter. All of that is already available without paying.',
        'At this stage Amorely is completely free: no premium tier and no checkout. If paid features ever appear, we will describe them in the offer first — not on the third screen after sign-up.',
      ],
    },
  },
];

export const getBlogPostBySlug = (slug: string): BlogPost | undefined =>
  BLOG_POSTS.find((post) => post.slug === slug);

export const filterBlogPosts = (
  query: string,
  category: BlogCategoryId | 'all',
  locale: LegalLocale
): BlogPost[] => {
  const normalized = query.trim().toLowerCase();
  return BLOG_POSTS.filter((post) => {
    if (category !== 'all' && post.category !== category) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    const haystack = `${post.title[locale]} ${post.excerpt[locale]}`.toLowerCase();
    return haystack.includes(normalized);
  }).sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
};
