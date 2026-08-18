type SupportedLocale = 'ru' | 'en' | 'es' | 'de' | 'fr' | 'pt' | 'uk' | 'by';

const normalizeLocale = (locale?: string): SupportedLocale => {
  const code = (locale || 'ru').slice(0, 2).toLowerCase();
  if (code === 'be') {
    return 'by';
  }
  if (
    code === 'en' ||
    code === 'es' ||
    code === 'de' ||
    code === 'fr' ||
    code === 'pt' ||
    code === 'uk' ||
    code === 'by'
  ) {
    return code;
  }
  return 'ru';
};

const ACCEPTED_TEXT: Record<SupportedLocale, string> = {
  ru: 'Партнёр принял заявку и восстановил воспоминания. Можете проверить календарь.',
  uk: 'Партнер прийняв заявку і відновив спогади. Можете перевірити календар.',
  by: 'Партнёр прыняў заяўку і аднавіў успаміны. Можаце праверыць каляндар.',
  en: 'Your partner accepted the request and restored your memories. You can check the calendar.',
  es: 'Tu pareja aceptó la solicitud y restauró los recuerdos. Puedes revisar el calendario.',
  de: 'Dein Partner hat die Anfrage angenommen und die Erinnerungen wiederhergestellt. Du kannst den Kalender prüfen.',
  fr: 'Votre partenaire a accepté la demande et restauré les souvenirs. Vous pouvez vérifier le calendrier.',
  pt: 'O seu parceiro aceitou o pedido e restaurou as memórias. Pode verificar o calendário.'
};

const DECLINED_TEXT: Record<SupportedLocale, string> = {
  ru: 'Партнёр отклонил заявку на восстановление воспоминаний.',
  uk: 'Партнер відхилив заявку на відновлення спогадів.',
  by: 'Партнёр адхіліў заяўку на аднаўленне ўспамінаў.',
  en: 'Your partner declined the memory restore request.',
  es: 'Tu pareja rechazó la solicitud para restaurar los recuerdos.',
  de: 'Dein Partner hat die Anfrage zur Wiederherstellung der Erinnerungen abgelehnt.',
  fr: 'Votre partenaire a refusé la demande de restauration des souvenirs.',
  pt: 'O seu parceiro recusou o pedido de restauro das memórias.'
};

export const buildMemoryRestoreAcceptedText = (locale?: string): string =>
  ACCEPTED_TEXT[normalizeLocale(locale)];

export const buildMemoryRestoreDeclinedText = (locale?: string): string =>
  DECLINED_TEXT[normalizeLocale(locale)];
