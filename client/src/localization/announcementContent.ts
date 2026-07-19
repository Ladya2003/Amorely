import { AppLocale, SUPPORTED_LOCALES } from './locale';

export interface AnnouncementLocaleContent {
  title: string;
  preview: string;
  content: string;
}

export type AnnouncementTranslations = Partial<Record<AppLocale, AnnouncementLocaleContent>>;

export const createEmptyAnnouncementTranslations = (): Record<AppLocale, AnnouncementLocaleContent> =>
  Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, { title: '', preview: '', content: '' }])
  ) as Record<AppLocale, AnnouncementLocaleContent>;

export const normalizeAnnouncementTranslations = (
  item: {
    translations?: AnnouncementTranslations | null;
  }
): Record<AppLocale, AnnouncementLocaleContent> => {
  const empty = createEmptyAnnouncementTranslations();
  const source = item.translations ?? {};

  for (const locale of SUPPORTED_LOCALES) {
    const entry = source[locale];
    if (entry) {
      empty[locale] = {
        title: entry.title ?? '',
        preview: entry.preview ?? '',
        content: entry.content ?? '',
      };
    }
  }

  return empty;
};

export const PET_FEEDING_ANNOUNCEMENT_PRESET: {
  key: string;
  pushTitle: string;
  pushBody: Record<AppLocale, string>;
  translations: Record<AppLocale, AnnouncementLocaleContent>;
} = {
  key: 'pet-feeding-v1',
  pushTitle: 'Amorely',
  pushBody: {
    ru: 'Новое: кормите питомцев и зарабатывайте Аморки!',
    en: 'New: feed your pets and earn AmoreCoins!',
    es: 'Nuevo: alimenta a tus mascotas y gana AmoreCoins.',
    de: 'Neu: Füttere deine Haustiere und verdiene AmoreCoins!',
    fr: 'Nouveau : nourrissez vos animaux et gagnez des AmoreCoins !',
    pt: 'Novo: alimente seus pets e ganhe AmoreCoins!',
    uk: 'Нове: годуйте улюбленців і заробляйте Аморки!',
  },
  translations: {
    ru: {
      title: 'Кормление питомцев',
      preview:
        'Новая шкала сытости, кнопка «Покормить» и награда +5 Аморок за полную сытость.',
      content: `У каждого питомца теперь есть сытость. Следите за ней, кормите вовремя — и получайте бонусы!

• Корм — 2 Аморки, +10–20 сытости
• Сытость падает на 2/час
• Полная сытость (100) — +5 Аморок
• На карточке видно настроение: 😾 / 😐 / 😊

Загляните к питомцу на главной!`,
    },
    en: {
      title: 'Feed your pets',
      preview:
        'New satiety stat, Feed button, and +5 AmoreCoins when satiety reaches 100.',
      content: `Every pet now has satiety. Keep an eye on it, feed on time — and earn bonuses!

• Food costs 2 AmoreCoins and restores 10–20 satiety
• Satiety drops by 2 per hour
• Full satiety (100) — +5 AmoreCoins
• Mood emoji on the card: 😾 / 😐 / 😊

Visit your pet on the home screen!`,
    },
    es: {
      title: 'Alimenta a tus mascotas',
      preview:
        'Nueva barra de saciedad, botón Alimentar y +5 AmoreCoins cuando la saciedad llega a 100.',
      content: `¡Ahora cada mascota tiene saciedad! Vigílala, aliméntala a tiempo y gana bonificaciones.

• Comida: 2 AmoreCoins, +10–20 de saciedad
• La saciedad baja 2 puntos por hora
• Saciedad completa (100): +5 AmoreCoins
• Emoji de ánimo en la tarjeta: 😾 / 😐 / 😊

¡Visita a tu mascota en la pantalla principal!`,
    },
    de: {
      title: 'Füttere deine Haustiere',
      preview:
        'Neuer Sättigungswert, Füttern-Button und +5 AmoreCoins bei voller Sättigung (100).',
      content: `Jedes Haustier hat jetzt einen Sättigungswert. Behalte ihn im Blick, füttere rechtzeitig — und verdiene Boni!

• Futter: 2 AmoreCoins, +10–20 Sättigung
• Sättigung sinkt um 2 pro Stunde
• Volle Sättigung (100): +5 AmoreCoins
• Stimmungs-Emoji auf der Karte: 😾 / 😐 / 😊

Schau auf dem Startbildschirm bei deinem Haustier vorbei!`,
    },
    fr: {
      title: 'Nourrissez vos animaux',
      preview:
        'Nouvelle jauge de satiété, bouton Nourrir et +5 AmoreCoins quand la satiété atteint 100.',
      content: `Chaque animal a désormais une satiété. Surveillez-la, nourrissez-le à temps — et gagnez des bonus !

• Nourriture : 2 AmoreCoins, +10–20 de satiété
• La satiété baisse de 2 par heure
• Satiété maximale (100) : +5 AmoreCoins
• Emoji d'humeur sur la carte : 😾 / 😐 / 😊

Rendez visite à votre animal depuis l'écran d'accueil !`,
    },
    pt: {
      title: 'Alimente seus pets',
      preview:
        'Nova barra de saciedade, botão Alimentar e +5 AmoreCoins quando a saciedade chega a 100.',
      content: `Agora cada pet tem saciedade. Fique de olho, alimente na hora — e ganhe bônus!

• Comida: 2 AmoreCoins, +10–20 de saciedade
• A saciedade cai 2 pontos por hora
• Saciedade cheia (100): +5 AmoreCoins
• Emoji de humor no card: 😾 / 😐 / 😊

Visite seu pet na tela inicial!`,
    },
    uk: {
      title: 'Годування улюбленців',
      preview:
        'Нова шкала ситості, кнопка «Погодувати» та нагорода +5 Аморок за повну ситість.',
      content: `Тепер у кожного улюбленця є ситість. Стежте за нею, годуйте вчасно — і отримуйте бонуси!

• Корм — 2 Аморки, +10–20 ситості
• Ситість падає на 2/год
• Повна ситість (100) — +5 Аморок
• На картці видно настрій: 😾 / 😐 / 😊

Загляньте до улюбленця на головній!`,
    },
  },
};
