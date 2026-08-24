import { AppLocale, resolveLocale } from '../../i18n/locales';

const EMAIL_HTML_LANG: Record<AppLocale, string> = {
  ru: 'ru',
  en: 'en',
  es: 'es',
  de: 'de',
  fr: 'fr',
  pt: 'pt',
  uk: 'uk',
  by: 'be',
};

type SharedEmailCopy = {
  linkHint: string;
  madeForCouples: string;
  signoff: string;
};

type VerificationEmailCopy = {
  subject: string;
  heading: string;
  subtitle: string;
  button: string;
  footerNote: string;
  textWelcome: string;
  textIntro: string;
  textExpires: string;
  textIgnore: string;
};

type PasswordResetEmailCopy = {
  subject: string;
  heading: string;
  subtitle: string;
  button: string;
  footerNote: string;
  textIntro: string;
  textAction: string;
  textExpires: string;
  textIgnore: string;
};

const SHARED_COPY: Record<AppLocale, SharedEmailCopy> = {
  en: {
    linkHint: 'Button not working? Paste this link into your browser:',
    madeForCouples: 'Made for couples',
    signoff: '— Amorely',
  },
  ru: {
    linkHint: 'Кнопка не работает? Вставьте эту ссылку в браузер:',
    madeForCouples: 'Сделано для пар',
    signoff: '— Amorely',
  },
  by: {
    linkHint: 'Кнопка не працуе? Устаўце гэтую спасылку ў браўзер:',
    madeForCouples: 'Зроблена для пар',
    signoff: '— Amorely',
  },
  uk: {
    linkHint: 'Кнопка не працює? Вставте це посилання в браузер:',
    madeForCouples: 'Зроблено для пар',
    signoff: '— Amorely',
  },
  es: {
    linkHint: '¿El botón no funciona? Pega este enlace en el navegador:',
    madeForCouples: 'Hecho para parejas',
    signoff: '— Amorely',
  },
  de: {
    linkHint: 'Button funktioniert nicht? Füge diesen Link in den Browser ein:',
    madeForCouples: 'Für Paare gemacht',
    signoff: '— Amorely',
  },
  fr: {
    linkHint: 'Le bouton ne fonctionne pas ? Collez ce lien dans votre navigateur :',
    madeForCouples: 'Conçu pour les couples',
    signoff: '— Amorely',
  },
  pt: {
    linkHint: 'O botão não funciona? Cole este link no navegador:',
    madeForCouples: 'Feito para casais',
    signoff: '— Amorely',
  },
};

const VERIFICATION_COPY: Record<AppLocale, VerificationEmailCopy> = {
  en: {
    subject: 'Confirm your Amorely email',
    heading: 'Confirm your email',
    subtitle: 'One quick step and your private space for two is ready.',
    button: 'Confirm email',
    footerNote:
      'This link expires in 24 hours. If you didn’t create an Amorely account, you can ignore this email.',
    textWelcome: 'Welcome to Amorely!',
    textIntro: 'Please confirm your email address to finish creating your account:',
    textExpires: 'This link expires in 24 hours.',
    textIgnore: 'If you did not create an Amorely account, you can ignore this email.',
  },
  ru: {
    subject: 'Подтвердите email в Amorely',
    heading: 'Подтвердите email',
    subtitle: 'Один шаг — и ваше пространство для двоих готово.',
    button: 'Подтвердить email',
    footerNote:
      'Ссылка действует 24 часа. Если вы не создавали аккаунт Amorely, просто проигнорируйте это письмо.',
    textWelcome: 'Добро пожаловать в Amorely!',
    textIntro: 'Подтвердите email, чтобы завершить создание аккаунта:',
    textExpires: 'Ссылка действует 24 часа.',
    textIgnore: 'Если вы не создавали аккаунт Amorely, просто проигнорируйте это письмо.',
  },
  by: {
    subject: 'Пацвердзіце email у Amorely',
    heading: 'Пацвердзіце email',
    subtitle: 'Адзін крок — і ваша прастора для двух гатовая.',
    button: 'Пацвердзіць email',
    footerNote:
      'Спасылка дзейнічае 24 гадзіны. Калі вы не стваралі акаўнт Amorely, проста праігнаруйце гэты ліст.',
    textWelcome: 'Вітаем у Amorely!',
    textIntro: 'Пацвердзіце email, каб завяршыць стварэнне акаўнта:',
    textExpires: 'Спасылка дзейнічае 24 гадзіны.',
    textIgnore: 'Калі вы не стваралі акаўнт Amorely, проста праігнаруйце гэты ліст.',
  },
  uk: {
    subject: 'Підтвердіть email в Amorely',
    heading: 'Підтвердіть email',
    subtitle: 'Один крок — і ваш простір для двох готовий.',
    button: 'Підтвердити email',
    footerNote:
      'Посилання діє 24 години. Якщо ви не створювали акаунт Amorely, просто проігноруйте цей лист.',
    textWelcome: 'Ласкаво просимо до Amorely!',
    textIntro: 'Підтвердіть email, щоб завершити створення акаунта:',
    textExpires: 'Посилання діє 24 години.',
    textIgnore: 'Якщо ви не створювали акаунт Amorely, просто проігноруйте цей лист.',
  },
  es: {
    subject: 'Confirma tu correo de Amorely',
    heading: 'Confirma tu correo',
    subtitle: 'Un paso más y tu espacio privado para dos estará listo.',
    button: 'Confirmar correo',
    footerNote:
      'Este enlace caduca en 24 horas. Si no creaste una cuenta de Amorely, puedes ignorar este correo.',
    textWelcome: '¡Bienvenido a Amorely!',
    textIntro: 'Confirma tu correo para terminar de crear tu cuenta:',
    textExpires: 'Este enlace caduca en 24 horas.',
    textIgnore: 'Si no creaste una cuenta de Amorely, puedes ignorar este correo.',
  },
  de: {
    subject: 'Bestätige deine Amorely-E-Mail',
    heading: 'E-Mail bestätigen',
    subtitle: 'Noch ein Schritt, dann ist euer privater Raum für zwei bereit.',
    button: 'E-Mail bestätigen',
    footerNote:
      'Dieser Link läuft in 24 Stunden ab. Wenn du kein Amorely-Konto erstellt hast, kannst du diese E-Mail ignorieren.',
    textWelcome: 'Willkommen bei Amorely!',
    textIntro: 'Bitte bestätige deine E-Mail-Adresse, um dein Konto zu erstellen:',
    textExpires: 'Dieser Link läuft in 24 Stunden ab.',
    textIgnore: 'Wenn du kein Amorely-Konto erstellt hast, kannst du diese E-Mail ignorieren.',
  },
  fr: {
    subject: 'Confirmez votre e-mail Amorely',
    heading: 'Confirmez votre e-mail',
    subtitle: 'Une étape de plus et votre espace privé à deux est prêt.',
    button: 'Confirmer l’e-mail',
    footerNote:
      'Ce lien expire dans 24 heures. Si vous n’avez pas créé de compte Amorely, vous pouvez ignorer cet e-mail.',
    textWelcome: 'Bienvenue sur Amorely !',
    textIntro: 'Veuillez confirmer votre e-mail pour terminer la création de votre compte :',
    textExpires: 'Ce lien expire dans 24 heures.',
    textIgnore: 'Si vous n’avez pas créé de compte Amorely, vous pouvez ignorer cet e-mail.',
  },
  pt: {
    subject: 'Confirme o e-mail da Amorely',
    heading: 'Confirme o seu e-mail',
    subtitle: 'Só mais um passo e o vosso espaço privado a dois está pronto.',
    button: 'Confirmar e-mail',
    footerNote:
      'Este link expira em 24 horas. Se não criou uma conta Amorely, pode ignorar este e-mail.',
    textWelcome: 'Bem-vindo à Amorely!',
    textIntro: 'Confirme o seu e-mail para concluir a criação da conta:',
    textExpires: 'Este link expira em 24 horas.',
    textIgnore: 'Se não criou uma conta Amorely, pode ignorar este e-mail.',
  },
};

const PASSWORD_RESET_COPY: Record<AppLocale, PasswordResetEmailCopy> = {
  en: {
    subject: 'Reset your Amorely password',
    heading: 'Reset your password',
    subtitle: 'Choose a new password for your private space for two.',
    button: 'Reset password',
    footerNote:
      'This link expires in 1 hour. If you didn’t request a password reset, you can ignore this email.',
    textIntro: 'We received a request to reset the password for your Amorely account.',
    textAction: 'Open this link to choose a new password:',
    textExpires: 'This link expires in 1 hour.',
    textIgnore: 'If you did not request a password reset, you can ignore this email.',
  },
  ru: {
    subject: 'Сброс пароля Amorely',
    heading: 'Сбросьте пароль',
    subtitle: 'Выберите новый пароль для вашего пространства для двоих.',
    button: 'Сбросить пароль',
    footerNote:
      'Ссылка действует 1 час. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.',
    textIntro: 'Мы получили запрос на сброс пароля для вашего аккаунта Amorely.',
    textAction: 'Откройте эту ссылку, чтобы выбрать новый пароль:',
    textExpires: 'Ссылка действует 1 час.',
    textIgnore: 'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.',
  },
  by: {
    subject: 'Скід пароля Amorely',
    heading: 'Скіньце пароль',
    subtitle: 'Выберыце новы пароль для вашай прасторы для двух.',
    button: 'Скінуць пароль',
    footerNote:
      'Спасылка дзейнічае 1 гадзіну. Калі вы не запытвалі скід пароля, проста праігнаруйце гэты ліст.',
    textIntro: 'Мы атрымалі запыт на скід пароля для вашага акаўнта Amorely.',
    textAction: 'Адкрыйце гэтую спасылку, каб выбраць новы пароль:',
    textExpires: 'Спасылка дзейнічае 1 гадзіну.',
    textIgnore: 'Калі вы не запытвалі скід пароля, проста праігнаруйце гэты ліст.',
  },
  uk: {
    subject: 'Скидання пароля Amorely',
    heading: 'Скиньте пароль',
    subtitle: 'Оберіть новий пароль для вашого простору для двох.',
    button: 'Скинути пароль',
    footerNote:
      'Посилання діє 1 годину. Якщо ви не запитували скидання пароля, просто проігноруйте цей лист.',
    textIntro: 'Ми отримали запит на скидання пароля для вашого акаунта Amorely.',
    textAction: 'Відкрийте це посилання, щоб обрати новий пароль:',
    textExpires: 'Посилання діє 1 годину.',
    textIgnore: 'Якщо ви не запитували скидання пароля, просто проігноруйте цей лист.',
  },
  es: {
    subject: 'Restablece tu contraseña de Amorely',
    heading: 'Restablece tu contraseña',
    subtitle: 'Elige una nueva contraseña para tu espacio privado para dos.',
    button: 'Restablecer contraseña',
    footerNote:
      'Este enlace caduca en 1 hora. Si no pediste restablecer la contraseña, puedes ignorar este correo.',
    textIntro: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta de Amorely.',
    textAction: 'Abre este enlace para elegir una nueva contraseña:',
    textExpires: 'Este enlace caduca en 1 hora.',
    textIgnore: 'Si no pediste restablecer la contraseña, puedes ignorar este correo.',
  },
  de: {
    subject: 'Amorely-Passwort zurücksetzen',
    heading: 'Passwort zurücksetzen',
    subtitle: 'Wähle ein neues Passwort für euren privaten Raum für zwei.',
    button: 'Passwort zurücksetzen',
    footerNote:
      'Dieser Link läuft in 1 Stunde ab. Wenn du kein Zurücksetzen angefordert hast, kannst du diese E-Mail ignorieren.',
    textIntro: 'Wir haben eine Anfrage erhalten, das Passwort für dein Amorely-Konto zurückzusetzen.',
    textAction: 'Öffne diesen Link, um ein neues Passwort zu wählen:',
    textExpires: 'Dieser Link läuft in 1 Stunde ab.',
    textIgnore: 'Wenn du kein Zurücksetzen angefordert hast, kannst du diese E-Mail ignorieren.',
  },
  fr: {
    subject: 'Réinitialisez votre mot de passe Amorely',
    heading: 'Réinitialisez votre mot de passe',
    subtitle: 'Choisissez un nouveau mot de passe pour votre espace privé à deux.',
    button: 'Réinitialiser le mot de passe',
    footerNote:
      'Ce lien expire dans 1 heure. Si vous n’avez pas demandé de réinitialisation, vous pouvez ignorer cet e-mail.',
    textIntro: 'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Amorely.',
    textAction: 'Ouvrez ce lien pour choisir un nouveau mot de passe :',
    textExpires: 'Ce lien expire dans 1 heure.',
    textIgnore: 'Si vous n’avez pas demandé de réinitialisation, vous pouvez ignorer cet e-mail.',
  },
  pt: {
    subject: 'Redefina a palavra-passe da Amorely',
    heading: 'Redefina a palavra-passe',
    subtitle: 'Escolha uma nova palavra-passe para o vosso espaço privado a dois.',
    button: 'Redefinir palavra-passe',
    footerNote:
      'Este link expira em 1 hora. Se não pediu a redefinição, pode ignorar este e-mail.',
    textIntro: 'Recebemos um pedido para redefinir a palavra-passe da sua conta Amorely.',
    textAction: 'Abra este link para escolher uma nova palavra-passe:',
    textExpires: 'Este link expira em 1 hora.',
    textIgnore: 'Se não pediu a redefinição, pode ignorar este e-mail.',
  },
};

export const getVerificationEmailCopy = (locale?: string | null) => {
  const resolved = resolveLocale(locale);
  return {
    locale: resolved,
    htmlLang: EMAIL_HTML_LANG[resolved],
    ...SHARED_COPY[resolved],
    ...VERIFICATION_COPY[resolved],
  };
};

export const getPasswordResetEmailCopy = (locale?: string | null) => {
  const resolved = resolveLocale(locale);
  return {
    locale: resolved,
    htmlLang: EMAIL_HTML_LANG[resolved],
    ...SHARED_COPY[resolved],
    ...PASSWORD_RESET_COPY[resolved],
  };
};
