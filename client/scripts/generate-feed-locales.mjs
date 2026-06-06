import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/locales');

const milestoneIds = [
  'week1', 'week2', 'month1', 'month2', 'month3', 'days100', 'month6', 'month9',
  'year1', 'year1_5', 'year2', 'year3', 'year4', 'year5', 'year7', 'year10',
  'year15', 'year20', 'year25', 'year30',
];

const milestoneDays = {
  week1: 7, week2: 14, month1: 30, month2: 60, month3: 90, days100: 100,
  month6: 180, month9: 270, year1: 365, year1_5: 548, year2: 730, year3: 1095,
  year4: 1460, year5: 1825, year7: 2555, year10: 3650, year15: 5475,
  year20: 7300, year25: 9125, year30: 10950,
};

const achievementIds = [
  'first_week', 'two_weeks', 'first_month', 'two_months', 'three_months', 'century',
  'half_year', 'nine_months', 'first_year', 'year_and_half', 'two_years', 'three_years',
  'four_years', 'five_years', 'seven_years', 'ten_years', 'fifteen_years',
  'twenty_years', 'silver_wedding', 'pearl_wedding',
];

const statusKeys = [
  'lt3', 'lt7', 'lt14', 'lt30', 'lt60', 'lt90', 'lt120', 'lt180', 'lt270', 'lt365',
  'lt548', 'lt730', 'lt1095', 'lt1460', 'lt1825', 'lt2190', 'lt2555', 'lt2920',
  'lt3650', 'lt4380', 'lt5475', 'lt7300', 'lt10950', 'lt14600', 'lt18250', 'default',
];

const translations = {
  ru: {
    nav: { home: 'Главная', chat: 'Чат', calendar: 'Календарь', news: 'Новости', settings: 'Настройки' },
    feed: {
      title: 'Лента',
      contentOfDay: 'Контент дня',
      contentUpdateTooltip: 'Подборка обновляется в 02:00 и 17:00 (Europe/Minsk)',
      contentUpdateAriaLabel: 'Информация об обновлении контента',
      emptyPlaceholder: 'Еще нету доступного контента\n\n📅 Добавьте ваши события в\nКалендаре с фото и видео',
      noContent: 'Нет доступного контента',
      birthday: 'День рождения',
      anniversary: 'Годовщина',
      day_one: 'день',
      day_few: 'дня',
      day_many: 'дней',
      daysTogether: '{{count}} {{daysWord}} вместе',
      since: 'С {{date}}',
      addPartnerTitle: 'Добавьте партнера в настройках',
      addPartnerDescription: 'Чтобы видеть количество дней вместе, добавьте вашего партнера и дату начала отношений',
      signatureUser: 'Подпись пользователя',
      signaturePartner: 'Подпись партнера',
      signature: 'Подпись',
      achievementsTitle: 'Достижения',
      untilAnniversary: '⏳ До следующей годовщины:',
      progress: {
        allMilestones: '🎉 Все вехи достигнуты! Вы - легенды! 💎',
        nextMilestone: 'До следующей отметки:',
        percentDone: '{{percent}}% пройдено',
        daysRemaining: '{{count}} {{daysWord}} осталось',
      },
      validation: {
        fileTooLarge: 'Файл слишком большой. Максимальный размер: {{max}} МБ',
        invalidFormat: 'Недопустимый формат файла. Используйте JPG, PNG, GIF или WebP',
        generic: 'Ошибка валидации',
      },
      export: {
        tooltip: 'Скачать открытку',
        success: 'Открытка успешно сохранена! 📸',
        error: 'Не удалось экспортировать открытку',
      },
      colorPicker: { changeTheme: 'Изменить цветовую тему', pickColor: 'Выбрать любой цвет' },
      signatureDialog: { title: 'Добавить подпись', clear: 'Очистить', cancel: 'Отмена', save: 'Сохранить' },
      status: {
        lt3: 'Самое начало нашей истории любви 💕',
        lt7: 'Первые дни волшебства вместе ✨',
        lt14: 'Неделя за неделей - открываем друг друга 🌸',
        lt30: 'Первый месяц незабываемых моментов 🌟',
        lt60: 'Два месяца счастья и бабочек в животе 🦋',
        lt90: 'Три месяца любви и нежности 💑',
        lt120: 'Четыре месяца вместе - наш маленький мир 🌍',
        lt180: 'Полгода любви и взаимопонимания 💝',
        lt270: 'Девять месяцев - как рождение нашей любви 🎈',
        lt365: 'Почти год вместе - наша любовь крепнет 💕',
        lt548: 'Больше года любви и заботы друг о друге 💖',
        lt730: 'Полтора года - наша любовь как крепкий дуб 🌳',
        lt1095: 'Два года вместе - наша история продолжается 📖',
        lt1460: 'Три года любви - мы непобедимы вместе 👑',
        lt1825: 'Четыре года - наша любовь как драгоценный камень 💎',
        lt2190: 'Пять лет вместе - половина десятилетия счастья 🎊',
        lt2555: 'Шесть лет - наша связь становится все глубже 🌊',
        lt2920: 'Семь лет - мы прошли через все вместе 🌈',
        lt3650: 'Восемь лет любви - настоящая крепость 🏰',
        lt4380: 'Десять лет вместе - целая эпоха любви 🎭',
        lt5475: 'Двенадцать лет - наша любовь как вино, с годами лучше 🍷',
        lt7300: 'Пятнадцать лет вместе - мы единое целое 💫',
        lt10950: 'Двадцать лет любви - наша легенда ⭐',
        lt14600: 'Двадцать пять лет - серебряная свадьба близко! 🥈',
        lt18250: 'Тридцать лет вместе - жемчужная прочность 📿',
        default: 'Любовь длиною в жизнь - вечная и бесконечная 💎✨',
      },
      milestones: {
        week1: { title: 'Первая неделя', description: '{{days}} дней вместе' },
        week2: { title: 'Две недели', description: '{{days}} дней вместе' },
        month1: { title: 'Месяц любви', description: '{{days}} дней вместе' },
        month2: { title: 'Два месяца', description: '{{days}} дней вместе' },
        month3: { title: 'Три месяца', description: '{{days}} дней вместе' },
        days100: { title: 'Первая сотня!', description: '{{days}} дней вместе' },
        month6: { title: 'Полгода', description: '{{days}} дней вместе' },
        month9: { title: 'Девять месяцев', description: '{{days}} дней вместе' },
        year1: { title: 'Год вместе!', description: '{{days}} дней вместе' },
        year1_5: { title: 'Полтора года', description: '{{days}} дней вместе' },
        year2: { title: 'Два года!', description: '{{days}} дней вместе' },
        year3: { title: 'Три года!', description: '{{days}} дней вместе' },
        year4: { title: 'Четыре года!', description: '{{days}} дней вместе' },
        year5: { title: 'Пять лет!', description: '{{days}} дней вместе' },
        year7: { title: 'Семь лет!', description: '{{days}} дней вместе' },
        year10: { title: 'Десять лет!', description: '{{days}} дней вместе' },
        year15: { title: 'Пятнадцать лет!', description: '{{days}} дней вместе' },
        year20: { title: 'Двадцать лет!', description: '{{days}} дней вместе' },
        year25: { title: 'Серебряная свадьба!', description: '{{days}} дней вместе' },
        year30: { title: 'Жемчужная свадьба!', description: '{{days}} дней вместе' },
      },
      achievements: {
        first_week: { title: 'Первая неделя', description: 'Первые дни волшебства вместе' },
        two_weeks: { title: 'Две недели', description: 'Открываем друг друга' },
        first_month: { title: 'Месяц любви', description: 'Месяц незабываемых моментов!' },
        two_months: { title: 'Два месяца', description: 'Счастье и бабочки в животе' },
        three_months: { title: 'Три месяца', description: 'Любовь и нежность' },
        century: { title: 'Первая сотня', description: '100 дней - это круто!' },
        half_year: { title: 'Полгода счастья', description: 'Любовь и взаимопонимание' },
        nine_months: { title: 'Девять месяцев', description: 'Как рождение нашей любви' },
        first_year: { title: 'Год вместе', description: 'Целый год любви и заботы!' },
        year_and_half: { title: 'Полтора года', description: 'Любовь как крепкий дуб' },
        two_years: { title: 'Два года', description: 'Наша история продолжается' },
        three_years: { title: 'Три года', description: 'Мы непобедимы вместе' },
        four_years: { title: 'Четыре года', description: 'Любовь как драгоценный камень' },
        five_years: { title: 'Пять лет', description: 'Половина десятилетия счастья!' },
        seven_years: { title: 'Семь лет', description: 'Прошли через все вместе' },
        ten_years: { title: 'Десять лет', description: 'Целая эпоха любви!' },
        fifteen_years: { title: 'Пятнадцать лет', description: 'Мы единое целое' },
        twenty_years: { title: 'Двадцать лет', description: 'Наша легенда!' },
        silver_wedding: { title: 'Серебряная свадьба', description: '25 лет вместе - невероятно!' },
        pearl_wedding: { title: 'Жемчужная свадьба', description: '30 лет - жемчужная прочность' },
      },
    },
  },
  en: {
    nav: { home: 'Home', chat: 'Chat', calendar: 'Calendar', news: 'News', settings: 'Settings' },
    feed: {
      title: 'Feed',
      contentOfDay: 'Content of the day',
      contentUpdateTooltip: 'The selection updates at 02:00 and 17:00 (Europe/Minsk)',
      contentUpdateAriaLabel: 'Content update information',
      emptyPlaceholder: 'No content available yet\n\n📅 Add your events in the\nCalendar with photos and videos',
      noContent: 'No content available',
      birthday: 'Birthday',
      anniversary: 'Anniversary',
      day_one: 'day',
      day_other: 'days',
      daysTogether: '{{count}} {{daysWord}} together',
      since: 'Since {{date}}',
      addPartnerTitle: 'Add your partner in settings',
      addPartnerDescription: 'To see how many days you have been together, add your partner and the relationship start date',
      signatureUser: 'User signature',
      signaturePartner: 'Partner signature',
      signature: 'Signature',
      achievementsTitle: 'Achievements',
      untilAnniversary: '⏳ Until the next anniversary:',
      progress: {
        allMilestones: '🎉 All milestones reached! You are legends! 💎',
        nextMilestone: 'Until the next milestone:',
        percentDone: '{{percent}}% complete',
        daysRemaining: '{{count}} {{daysWord}} left',
      },
      validation: {
        fileTooLarge: 'File is too large. Maximum size: {{max}} MB',
        invalidFormat: 'Invalid file format. Use JPG, PNG, GIF, or WebP',
        generic: 'Validation error',
      },
      export: {
        tooltip: 'Download card',
        success: 'Card saved successfully! 📸',
        error: 'Failed to export card',
      },
      colorPicker: { changeTheme: 'Change color theme', pickColor: 'Pick any color' },
      signatureDialog: { title: 'Add signature', clear: 'Clear', cancel: 'Cancel', save: 'Save' },
      status: {
        lt3: 'The very beginning of our love story 💕',
        lt7: 'The first magical days together ✨',
        lt14: 'Week by week — discovering each other 🌸',
        lt30: 'The first month of unforgettable moments 🌟',
        lt60: 'Two months of happiness and butterflies 🦋',
        lt90: 'Three months of love and tenderness 💑',
        lt120: 'Four months together — our little world 🌍',
        lt180: 'Half a year of love and understanding 💝',
        lt270: 'Nine months — like the birth of our love 🎈',
        lt365: 'Almost a year together — our love grows stronger 💕',
        lt548: 'More than a year of love and care 💖',
        lt730: 'A year and a half — our love like a sturdy oak 🌳',
        lt1095: 'Two years together — our story continues 📖',
        lt1460: 'Three years of love — unstoppable together 👑',
        lt1825: 'Four years — our love like a precious gem 💎',
        lt2190: 'Five years together — half a decade of happiness 🎊',
        lt2555: 'Six years — our bond grows deeper 🌊',
        lt2920: 'Seven years — we have been through it all 🌈',
        lt3650: 'Eight years of love — a true fortress 🏰',
        lt4380: 'Ten years together — a whole era of love 🎭',
        lt5475: 'Twelve years — our love ages like fine wine 🍷',
        lt7300: 'Fifteen years together — we are one 💫',
        lt10950: 'Twenty years of love — our legend ⭐',
        lt14600: 'Twenty-five years — silver anniversary is near! 🥈',
        lt18250: 'Thirty years together — pearl strength 📿',
        default: 'A lifetime of love — eternal and endless 💎✨',
      },
      milestones: Object.fromEntries(milestoneIds.map((id) => [id, {
        title: id.replace(/_/g, ' '),
        description: '{{days}} days together',
      }])),
      achievements: Object.fromEntries(achievementIds.map((id) => [id, {
        title: id.replace(/_/g, ' '),
        description: 'Achievement unlocked',
      }])),
    },
  },
};

// Fill EN milestones/achievements with proper English
const enMilestones = {
  week1: ['First week', '{{days}} days together'],
  week2: ['Two weeks', '{{days}} days together'],
  month1: ['Month of love', '{{days}} days together'],
  month2: ['Two months', '{{days}} days together'],
  month3: ['Three months', '{{days}} days together'],
  days100: ['First hundred!', '{{days}} days together'],
  month6: ['Half a year', '{{days}} days together'],
  month9: ['Nine months', '{{days}} days together'],
  year1: ['One year together!', '{{days}} days together'],
  year1_5: ['A year and a half', '{{days}} days together'],
  year2: ['Two years!', '{{days}} days together'],
  year3: ['Three years!', '{{days}} days together'],
  year4: ['Four years!', '{{days}} days together'],
  year5: ['Five years!', '{{days}} days together'],
  year7: ['Seven years!', '{{days}} days together'],
  year10: ['Ten years!', '{{days}} days together'],
  year15: ['Fifteen years!', '{{days}} days together'],
  year20: ['Twenty years!', '{{days}} days together'],
  year25: ['Silver anniversary!', '{{days}} days together'],
  year30: ['Pearl anniversary!', '{{days}} days together'],
};
for (const [id, [title, description]] of Object.entries(enMilestones)) {
  translations.en.feed.milestones[id] = { title, description };
}

const enAchievements = {
  first_week: ['First week', 'The first magical days together'],
  two_weeks: ['Two weeks', 'Discovering each other'],
  first_month: ['Month of love', 'A month of unforgettable moments!'],
  two_months: ['Two months', 'Happiness and butterflies'],
  three_months: ['Three months', 'Love and tenderness'],
  century: ['First hundred', '100 days — amazing!'],
  half_year: ['Half a year of happiness', 'Love and understanding'],
  nine_months: ['Nine months', 'Like the birth of our love'],
  first_year: ['One year together', 'A whole year of love and care!'],
  year_and_half: ['A year and a half', 'Love like a sturdy oak'],
  two_years: ['Two years', 'Our story continues'],
  three_years: ['Three years', 'Unstoppable together'],
  four_years: ['Four years', 'Love like a precious gem'],
  five_years: ['Five years', 'Half a decade of happiness!'],
  seven_years: ['Seven years', 'Through it all together'],
  ten_years: ['Ten years', 'A whole era of love!'],
  fifteen_years: ['Fifteen years', 'We are one'],
  twenty_years: ['Twenty years', 'Our legend!'],
  silver_wedding: ['Silver anniversary', '25 years together — incredible!'],
  pearl_wedding: ['Pearl anniversary', '30 years — pearl strength'],
};
for (const [id, [title, description]] of Object.entries(enAchievements)) {
  translations.en.feed.achievements[id] = { title, description };
}

// Other locales — use EN structure with translated UI shell + milestones from EN pattern
const localeOverrides = {
  es: {
    nav: { home: 'Inicio', chat: 'Chat', calendar: 'Calendario', news: 'Noticias', settings: 'Ajustes' },
    feedShell: {
      title: 'Feed', contentOfDay: 'Contenido del día',
      contentUpdateTooltip: 'La selección se actualiza a las 02:00 y 17:00 (Europe/Minsk)',
      contentUpdateAriaLabel: 'Información sobre la actualización del contenido',
      emptyPlaceholder: 'Aún no hay contenido disponible\n\n📅 Añade tus eventos en el\nCalendario con fotos y vídeos',
      noContent: 'No hay contenido disponible', birthday: 'Cumpleaños', anniversary: 'Aniversario',
      day_one: 'día', day_other: 'días', daysTogether: '{{count}} {{daysWord}} juntos', since: 'Desde {{date}}',
      addPartnerTitle: 'Añade a tu pareja en ajustes',
      addPartnerDescription: 'Para ver cuántos días lleváis juntos, añade a tu pareja y la fecha de inicio de la relación',
      signatureUser: 'Firma del usuario', signaturePartner: 'Firma de la pareja', signature: 'Firma',
      achievementsTitle: 'Logros', untilAnniversary: '⏳ Hasta el próximo aniversario:',
      progress: { allMilestones: '🎉 ¡Todos los hitos alcanzados! ¡Sois leyendas! 💎', nextMilestone: 'Hasta el próximo hito:', percentDone: '{{percent}}% completado', daysRemaining: 'Quedan {{count}} {{daysWord}}' },
      validation: { fileTooLarge: 'El archivo es demasiado grande. Tamaño máximo: {{max}} MB', invalidFormat: 'Formato no válido. Usa JPG, PNG, GIF o WebP', generic: 'Error de validación' },
      export: { tooltip: 'Descargar tarjeta', success: '¡Tarjeta guardada con éxito! 📸', error: 'No se pudo exportar la tarjeta' },
      colorPicker: { changeTheme: 'Cambiar tema de color', pickColor: 'Elegir cualquier color' },
      signatureDialog: { title: 'Añadir firma', clear: 'Borrar', cancel: 'Cancelar', save: 'Guardar' },
    },
  },
  de: {
    nav: { home: 'Start', chat: 'Chat', calendar: 'Kalender', news: 'Neuigkeiten', settings: 'Einstellungen' },
    feedShell: {
      title: 'Feed', contentOfDay: 'Inhalt des Tages',
      contentUpdateTooltip: 'Die Auswahl wird um 02:00 und 17:00 Uhr aktualisiert (Europe/Minsk)',
      contentUpdateAriaLabel: 'Informationen zur Inhaltsaktualisierung',
      emptyPlaceholder: 'Noch kein Inhalt verfügbar\n\n📅 Füge deine Ereignisse im\nKalender mit Fotos und Videos hinzu',
      noContent: 'Kein Inhalt verfügbar', birthday: 'Geburtstag', anniversary: 'Jubiläum',
      day_one: 'Tag', day_other: 'Tage', daysTogether: '{{count}} {{daysWord}} zusammen', since: 'Seit {{date}}',
      addPartnerTitle: 'Partner in den Einstellungen hinzufügen',
      addPartnerDescription: 'Um die gemeinsamen Tage zu sehen, füge deinen Partner und das Startdatum der Beziehung hinzu',
      signatureUser: 'Unterschrift des Nutzers', signaturePartner: 'Unterschrift des Partners', signature: 'Unterschrift',
      achievementsTitle: 'Erfolge', untilAnniversary: '⏳ Bis zum nächsten Jubiläum:',
      progress: { allMilestones: '🎉 Alle Meilensteine erreicht! Ihr seid Legenden! 💎', nextMilestone: 'Bis zum nächsten Meilenstein:', percentDone: '{{percent}}% geschafft', daysRemaining: 'Noch {{count}} {{daysWord}}' },
      validation: { fileTooLarge: 'Datei ist zu groß. Maximale Größe: {{max}} MB', invalidFormat: 'Ungültiges Format. Verwende JPG, PNG, GIF oder WebP', generic: 'Validierungsfehler' },
      export: { tooltip: 'Karte herunterladen', success: 'Karte erfolgreich gespeichert! 📸', error: 'Karte konnte nicht exportiert werden' },
      colorPicker: { changeTheme: 'Farbthema ändern', pickColor: 'Beliebige Farbe wählen' },
      signatureDialog: { title: 'Unterschrift hinzufügen', clear: 'Löschen', cancel: 'Abbrechen', save: 'Speichern' },
    },
  },
  fr: {
    nav: { home: 'Accueil', chat: 'Chat', calendar: 'Calendrier', news: 'Actualités', settings: 'Paramètres' },
    feedShell: {
      title: 'Fil', contentOfDay: 'Contenu du jour',
      contentUpdateTooltip: 'La sélection est mise à jour à 02:00 et 17:00 (Europe/Minsk)',
      contentUpdateAriaLabel: 'Informations sur la mise à jour du contenu',
      emptyPlaceholder: 'Pas encore de contenu disponible\n\n📅 Ajoutez vos événements dans le\nCalendrier avec photos et vidéos',
      noContent: 'Aucun contenu disponible', birthday: 'Anniversaire', anniversary: 'Fête',
      day_one: 'jour', day_other: 'jours', daysTogether: '{{count}} {{daysWord}} ensemble', since: 'Depuis le {{date}}',
      addPartnerTitle: 'Ajoutez votre partenaire dans les paramètres',
      addPartnerDescription: 'Pour voir le nombre de jours ensemble, ajoutez votre partenaire et la date de début de la relation',
      signatureUser: 'Signature de l\'utilisateur', signaturePartner: 'Signature du partenaire', signature: 'Signature',
      achievementsTitle: 'Succès', untilAnniversary: '⏳ Jusqu\'au prochain anniversaire :',
      progress: { allMilestones: '🎉 Tous les jalons atteints ! Vous êtes des légendes ! 💎', nextMilestone: 'Jusqu\'au prochain jalon :', percentDone: '{{percent}}% terminé', daysRemaining: 'Il reste {{count}} {{daysWord}}' },
      validation: { fileTooLarge: 'Fichier trop volumineux. Taille maximale : {{max}} Mo', invalidFormat: 'Format non valide. Utilisez JPG, PNG, GIF ou WebP', generic: 'Erreur de validation' },
      export: { tooltip: 'Télécharger la carte', success: 'Carte enregistrée avec succès ! 📸', error: 'Impossible d\'exporter la carte' },
      colorPicker: { changeTheme: 'Changer le thème de couleur', pickColor: 'Choisir une couleur' },
      signatureDialog: { title: 'Ajouter une signature', clear: 'Effacer', cancel: 'Annuler', save: 'Enregistrer' },
    },
  },
  pt: {
    nav: { home: 'Início', chat: 'Chat', calendar: 'Calendário', news: 'Notícias', settings: 'Configurações' },
    feedShell: {
      title: 'Feed', contentOfDay: 'Conteúdo do dia',
      contentUpdateTooltip: 'A seleção é atualizada às 02:00 e 17:00 (Europe/Minsk)',
      contentUpdateAriaLabel: 'Informações sobre a atualização do conteúdo',
      emptyPlaceholder: 'Ainda não há conteúdo disponível\n\n📅 Adicione seus eventos no\nCalendário com fotos e vídeos',
      noContent: 'Nenhum conteúdo disponível', birthday: 'Aniversário', anniversary: 'Data especial',
      day_one: 'dia', day_other: 'dias', daysTogether: '{{count}} {{daysWord}} juntos', since: 'Desde {{date}}',
      addPartnerTitle: 'Adicione seu parceiro nas configurações',
      addPartnerDescription: 'Para ver quantos dias vocês estão juntos, adicione seu parceiro e a data de início do relacionamento',
      signatureUser: 'Assinatura do usuário', signaturePartner: 'Assinatura do parceiro', signature: 'Assinatura',
      achievementsTitle: 'Conquistas', untilAnniversary: '⏳ Até o próximo aniversário:',
      progress: { allMilestones: '🎉 Todos os marcos alcançados! Vocês são lendas! 💎', nextMilestone: 'Até o próximo marco:', percentDone: '{{percent}}% concluído', daysRemaining: 'Faltam {{count}} {{daysWord}}' },
      validation: { fileTooLarge: 'Arquivo muito grande. Tamanho máximo: {{max}} MB', invalidFormat: 'Formato inválido. Use JPG, PNG, GIF ou WebP', generic: 'Erro de validação' },
      export: { tooltip: 'Baixar cartão', success: 'Cartão salvo com sucesso! 📸', error: 'Não foi possível exportar o cartão' },
      colorPicker: { changeTheme: 'Alterar tema de cor', pickColor: 'Escolher qualquer cor' },
      signatureDialog: { title: 'Adicionar assinatura', clear: 'Limpar', cancel: 'Cancelar', save: 'Salvar' },
    },
  },
  uk: {
    nav: { home: 'Головна', chat: 'Чат', calendar: 'Календар', news: 'Новини', settings: 'Налаштування' },
    feedShell: {
      title: 'Стрічка', contentOfDay: 'Контент дня',
      contentUpdateTooltip: 'Підбірка оновлюється о 02:00 та 17:00 (Europe/Minsk)',
      contentUpdateAriaLabel: 'Інформація про оновлення контенту',
      emptyPlaceholder: 'Ще немає доступного контенту\n\n📅 Додайте ваші події в\nКалендарі з фото та відео',
      noContent: 'Немає доступного контенту', birthday: 'День народження', anniversary: 'Річниця',
      day_one: 'день', day_few: 'дні', day_many: 'днів', daysTogether: '{{count}} {{daysWord}} разом', since: 'З {{date}}',
      addPartnerTitle: 'Додайте партнера в налаштуваннях',
      addPartnerDescription: 'Щоб бачити кількість днів разом, додайте партнера та дату початку стосунків',
      signatureUser: 'Підпис користувача', signaturePartner: 'Підпис партнера', signature: 'Підпис',
      achievementsTitle: 'Досягнення', untilAnniversary: '⏳ До наступної річниці:',
      progress: { allMilestones: '🎉 Усі віхи досягнуто! Ви — легенди! 💎', nextMilestone: 'До наступної віхи:', percentDone: '{{percent}}% пройдено', daysRemaining: 'Залишилось {{count}} {{daysWord}}' },
      validation: { fileTooLarge: 'Файл занадто великий. Максимальний розмір: {{max}} МБ', invalidFormat: 'Недопустимий формат файлу. Використовуйте JPG, PNG, GIF або WebP', generic: 'Помилка валідації' },
      export: { tooltip: 'Завантажити листівку', success: 'Листівку успішно збережено! 📸', error: 'Не вдалося експортувати листівку' },
      colorPicker: { changeTheme: 'Змінити кольорову тему', pickColor: 'Вибрати будь-який колір' },
      signatureDialog: { title: 'Додати підпис', clear: 'Очистити', cancel: 'Скасувати', save: 'Зберегти' },
    },
  },
};

// Build es/de/fr/pt/uk from EN milestones/achievements/status with localized shell
for (const [locale, override] of Object.entries(localeOverrides)) {
  translations[locale] = {
    nav: override.nav,
    feed: {
      ...override.feedShell,
      status: translations.en.feed.status,
      milestones: translations.en.feed.milestones,
      achievements: translations.en.feed.achievements,
    },
  };
}

// Ukrainian status + milestones + achievements from Russian (adapted)
translations.uk.feed.status = { ...translations.ru.feed.status };
translations.uk.feed.milestones = {
  week1: { title: 'Перший тиждень', description: '{{days}} днів разом' },
  week2: { title: 'Два тижні', description: '{{days}} днів разом' },
  month1: { title: 'Місяць кохання', description: '{{days}} днів разом' },
  month2: { title: 'Два місяці', description: '{{days}} днів разом' },
  month3: { title: 'Три місяці', description: '{{days}} днів разом' },
  days100: { title: 'Перша сотня!', description: '{{days}} днів разом' },
  month6: { title: 'Півроку', description: '{{days}} днів разом' },
  month9: { title: 'Дев\'ять місяців', description: '{{days}} днів разом' },
  year1: { title: 'Рік разом!', description: '{{days}} днів разом' },
  year1_5: { title: 'Півтора року', description: '{{days}} днів разом' },
  year2: { title: 'Два роки!', description: '{{days}} днів разом' },
  year3: { title: 'Три роки!', description: '{{days}} днів разом' },
  year4: { title: 'Чотири роки!', description: '{{days}} днів разом' },
  year5: { title: 'П\'ять років!', description: '{{days}} днів разом' },
  year7: { title: 'Сім років!', description: '{{days}} днів разом' },
  year10: { title: 'Десять років!', description: '{{days}} днів разом' },
  year15: { title: 'П\'ятнадцять років!', description: '{{days}} днів разом' },
  year20: { title: 'Двадцять років!', description: '{{days}} днів разом' },
  year25: { title: 'Срібне весілля!', description: '{{days}} днів разом' },
  year30: { title: 'Перлинне весілля!', description: '{{days}} днів разом' },
};
translations.uk.feed.achievements = {
  first_week: { title: 'Перший тиждень', description: 'Перші дні чарівності разом' },
  two_weeks: { title: 'Два тижні', description: 'Відкриваємо одне одного' },
  first_month: { title: 'Місяць кохання', description: 'Місяць незабутніх моментів!' },
  two_months: { title: 'Два місяці', description: 'Щастя та метелики в животі' },
  three_months: { title: 'Три місяці', description: 'Любов і ніжність' },
  century: { title: 'Перша сотня', description: '100 днів — це круто!' },
  half_year: { title: 'Півроку щастя', description: 'Любов і взаєморозуміння' },
  nine_months: { title: 'Дев\'ять місяців', description: 'Як народження нашого кохання' },
  first_year: { title: 'Рік разом', description: 'Цілий рік любові та турботи!' },
  year_and_half: { title: 'Півтора року', description: 'Любов як міцний дуб' },
  two_years: { title: 'Два роки', description: 'Наша історія триває' },
  three_years: { title: 'Три роки', description: 'Ми непереможні разом' },
  four_years: { title: 'Чотири роки', description: 'Любов як дорогоцінний камінь' },
  five_years: { title: 'П\'ять років', description: 'Половина десятиліття щастя!' },
  seven_years: { title: 'Сім років', description: 'Пройшли через усе разом' },
  ten_years: { title: 'Десять років', description: 'Ціла епоха любові!' },
  fifteen_years: { title: 'П\'ятнадцять років', description: 'Ми єдине ціле' },
  twenty_years: { title: 'Двадцять років', description: 'Наша легенда!' },
  silver_wedding: { title: 'Срібне весілля', description: '25 років разом — неймовірно!' },
  pearl_wedding: { title: 'Перлинне весілля', description: '30 років — перлинна міцність' },
};
translations.uk.feed.status = {
  lt3: 'Самий початок нашої історії кохання 💕',
  lt7: 'Перші дні чарівності разом ✨',
  lt14: 'Тиждень за тижнем — відкриваємо одне одного 🌸',
  lt30: 'Перший місяць незабутніх моментів 🌟',
  lt60: 'Два місяці щастя та метеликів у животі 🦋',
  lt90: 'Три місяці любові та ніжності 💑',
  lt120: 'Чотири місяці разом — наш маленький світ 🌍',
  lt180: 'Півроку любові та взаєморозуміння 💝',
  lt270: 'Дев\'ять місяців — як народження нашого кохання 🎈',
  lt365: 'Майже рік разом — наше кохання міцнішає 💕',
  lt548: 'Більше року любові та турботи одне про одного 💖',
  lt730: 'Півтора року — наше кохання як міцний дуб 🌳',
  lt1095: 'Два роки разом — наша історія триває 📖',
  lt1460: 'Три роки любові — ми непереможні разом 👑',
  lt1825: 'Чотири роки — наше кохання як дорогоцінний камінь 💎',
  lt2190: 'П\'ять років разом — половина десятиліття щастя 🎊',
  lt2555: 'Шість років — наш зв\'язок стає все глибшим 🌊',
  lt2920: 'Сім років — ми пройшли через усе разом 🌈',
  lt3650: 'Вісім років любові — справжня фортеця 🏰',
  lt4380: 'Десять років разом — ціла епоха любові 🎭',
  lt5475: 'Дванадцять років — наше кохання як вино, з роками краще 🍷',
  lt7300: 'П\'ятнадцять років разом — ми єдине ціле 💫',
  lt10950: 'Двадцять років любові — наша легенда ⭐',
  lt14600: 'Двадцять п\'ять років — срібне весілля близько! 🥈',
  lt18250: 'Тридцять років разом — перлинна міцність 📿',
  default: 'Любов на все життя — вічна і безкінечна 💎✨',
};

// Spanish/German/French/Portuguese localized status (shorter set from EN pattern - use EN for now but translate key statuses)
// For es/de/fr/pt use English milestones text is bad - translate milestones descriptions at least
const daysTogetherLabel = { es: 'días juntos', de: 'Tage zusammen', fr: 'jours ensemble', pt: 'dias juntos' };
for (const loc of ['es', 'de', 'fr', 'pt']) {
  const label = daysTogetherLabel[loc];
  translations[loc].feed.milestones = Object.fromEntries(
    milestoneIds.map((id) => [id, {
      title: translations.en.feed.milestones[id].title,
      description: `{{days}} ${label}`,
    }])
  );
}

const locales = ['ru', 'en', 'es', 'de', 'fr', 'pt', 'uk'];
for (const locale of locales) {
  const filePath = path.join(localesDir, `${locale}.json`);
  const base = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const patch = translations[locale];
  base.nav = { ...base.nav, ...patch.nav };
  base.feed = patch.feed;
  fs.writeFileSync(filePath, JSON.stringify(base, null, 2) + '\n', 'utf8');
  console.log(`Updated ${locale}.json`);
}
