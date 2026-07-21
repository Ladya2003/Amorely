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

export const DAILY_QUESTIONS_ANNOUNCEMENT_PRESET: {
  key: string;
  pushTitle: string;
  pushBody: Record<AppLocale, string>;
  translations: Record<AppLocale, AnnouncementLocaleContent>;
} = {
  key: 'daily-questions-v1',
  pushTitle: 'Amorely',
  pushBody: {
    ru: 'Новое: «Вопросы дня» — отвечайте вместе и сравнивайте ответы!',
    en: 'New: Questions of the day — answer together and compare!',
    es: 'Nuevo: «Preguntas del día» — responded juntos y comparad respuestas.',
    de: 'Neu: «Fragen des Tages» — gemeinsam antworten und vergleichen!',
    fr: 'Nouveau : « Questions du jour » — répondez à deux et comparez !',
    pt: 'Novo: «Perguntas do dia» — respondam juntos e comparem as respostas!',
    uk: 'Нове: «Питання дня» — відповідайте разом і порівнюйте відповіді!',
  },
  translations: {
    ru: {
      title: 'Вопросы дня',
      preview:
        'Две категории вопросов на главной: отвечайте по отдельности и смотрите результаты вместе.',
      content: `На главной появился новый блок «Вопросы дня» — мини-игра для пары!

• Каждый день — 2 категории (например, «Быт», «Первое свидание»)
• Типы вопросов: текст, выбор варианта, фото
• Сначала отвечаете вы, потом партнёр — ответы скрыты до конца
• В конце — % схожести и сравнение ответов в чат-формате
• История прошлых раундов — иконка 🕐 в блоке
• Новые категории через 24 часа после прохождения обоими

Загляните на главную и начните первую категорию вместе!`,
    },
    en: {
      title: 'Questions of the day',
      preview:
        'Two question categories on the home screen — answer separately, then see results together.',
      content: `A new "Questions of the day" block is on the home screen — a mini game for couples!

• Every day — 2 categories (e.g. couple life, first date)
• Question types: text, multiple choice, photo pick
• You answer first, then your partner — answers stay hidden until both finish
• Results show similarity % and side-by-side answers
• Past rounds in history — tap the 🕐 icon in the block
• New categories unlock 24 hours after you both complete them

Open the home screen and start your first category together!`,
    },
    es: {
      title: 'Preguntas del día',
      preview:
        'Dos categorías en la pantalla principal: responded por separado y ved los resultados juntos.',
      content: `¡Nuevo bloque «Preguntas del día» en la pantalla principal — un minijuego en pareja!

• Cada día — 2 categorías (p. ej. vida en pareja, primera cita)
• Tipos: texto, opción múltiple, elección de foto
• Respondes tú, luego tu pareja — las respuestas se ocultan hasta que ambos terminen
• Al final: % de similitud y comparación de respuestas
• Historial de rondas anteriores — icono 🕐 en el bloque
• Nuevas categorías 24 h después de completarlas ambos

¡Entrad en la pantalla principal y empezad la primera categoría!`,
    },
    de: {
      title: 'Fragen des Tages',
      preview:
        'Zwei Kategorien auf dem Startbildschirm — getrennt antworten, Ergebnisse gemeinsam ansehen.',
      content: `Neuer Block «Fragen des Tages» auf dem Startbildschirm — ein Minispiel für Paare!

• Jeden Tag — 2 Kategorien (z. B. Paarleben, erstes Date)
• Fragetypen: Text, Auswahl, Foto
• Du antwortest zuerst, dann dein Partner — Antworten bleiben verborgen
• Am Ende: Ähnlichkeit in % und Antwortvergleich
• Verlauf vergangener Runden — 🕐-Symbol im Block
• Neue Kategorien 24 Std. nach gemeinsamem Abschluss

Öffnet den Startbildschirm und startet eure erste Kategorie!`,
    },
    fr: {
      title: 'Questions du jour',
      preview:
        'Deux catégories sur l\'accueil : répondez séparément, puis comparez vos résultats.',
      content: `Nouveau bloc « Questions du jour » sur l'accueil — un mini-jeu à deux !

• Chaque jour — 2 catégories (ex. vie de couple, premier rendez-vous)
• Types : texte, choix, photo
• Vous répondez d'abord, puis votre partenaire — réponses cachées jusqu'à la fin
• À la fin : % de similarité et comparaison des réponses
• Historique des rounds — icône 🕐 dans le bloc
• Nouvelles catégories 24 h après avoir terminé tous les deux

Ouvrez l'accueil et lancez votre première catégorie !`,
    },
    pt: {
      title: 'Perguntas do dia',
      preview:
        'Duas categorias na tela inicial: respondam separadamente e vejam os resultados juntos.',
      content: `Novo bloco «Perguntas do dia» na tela inicial — um minijogo para casais!

• Todo dia — 2 categorias (ex.: vida a dois, primeiro encontro)
• Tipos: texto, escolha, foto
• Você responde primeiro, depois o parceiro — respostas ocultas até os dois terminarem
• No final: % de similaridade e comparação das respostas
• Histórico de rodadas — ícone 🕐 no bloco
• Novas categorias 24 h depois que ambos concluírem

Abra a tela inicial e comecem a primeira categoria juntos!`,
    },
    uk: {
      title: 'Питання дня',
      preview:
        'Дві категорії на головній: відповідайте окремо й дивіться результати разом.',
      content: `На головній з’явився блок «Питання дня» — міні-гра для пари!

• Щодня — 2 категорії (наприклад, «Побут», «Перше побачення»)
• Типи: текст, вибір варіанта, фото
• Спочатку відповідаєте ви, потім партнер — відповіді приховані до кінця
• Наприкінці — % схожості та порівняння відповідей
• Історія минулих раундів — іконка 🕐 у блоці
• Нові категорії через 24 год після проходження обома

Загляньте на головну та почніть першу категорію разом!`,
    },
  },
};
