import type { LegalDocument, LegalLocale } from './legalLocale';

const termsRu: LegalDocument = {
  intro:
    'Настоящие Условия пользования (далее — «Условия») регулируют отношения между Администрацией сервиса Amorely, размещённого по адресу amorely.love (далее — «Администрация», «мы»), и физическим лицом — пользователем сервиса Amorely (далее — «Сервис»). Использование Сервиса означает полное и безоговорочное принятие настоящих Условий в порядке статьи 408 Гражданского кодекса Республики Беларусь.',
  sections: [
    {
      title: '1. Назначение Сервиса',
      paragraphs: [
        'Amorely — частный онлайн-сервис для двух пользователей, состоящих в романтических отношениях. Сервис предназначен для совместного досуга: общей ленты воспоминаний, зашифрованного чата, календаря, игр, виртуальных питомцев, идей для свиданий и подобных функций.',
        'Сервис не предназначен для хранения важных, юридически значимых, медицинских, финансовых или иных конфиденциальных данных, а также для хранения интимных фотографий, изображений обнажённого тела и любых сведений, утрата или раскрытие которых может причинить вред. Пользователь самостоятельно оценивает риски и не должен загружать в Сервис такие материалы.',
      ],
    },
    {
      title: '2. Возраст и регистрация',
      paragraphs: [
        'Пользоваться Сервисом могут лица, достигшие 16 лет. Регистрируясь, пользователь подтверждает совершеннолетие либо полную дееспособность, либо наличие согласия законного представителя.',
        'Пользователь обязан указывать достоверные данные и не вправе передавать доступ к учётной записи третьим лицам. Регистрация возможна по адресу электронной почты или через вход с аккаунтом Google.',
      ],
    },
    {
      title: '3. Подключение партнёра',
      paragraphs: [
        'Большинство функций становятся доступны после связывания учётной записи с партнёром. Принимая приглашение, пользователь соглашается на совместный доступ партнёра к данным, которые Сервис передаёт по своей логике (сообщения, фото, события календаря, питомцы, идеи свиданий и т. п.).',
        'Разрыв пары возможен в любой момент в настройках. Ранее переданный контент может остаться у второй стороны в объёме, предусмотренном логикой Сервиса.',
      ],
    },
    {
      title: '4. Чат, игры и шифрование',
      paragraphs: [
        'Чат предназначен для добровольного личного общения пары. Сообщения могут передаваться и храниться в зашифрованном виде. Техническая реализация может не предполагать возможности расшифровки содержимого переписки со стороны Администрации.',
        'Это не означает анонимность в отношении сведений, которые пользователь предоставляет при регистрации, обращениях в поддержку или которые иным образом обрабатываются Сервисом в соответствии с Политикой конфиденциальности. Метаданные и технические сведения (например, время обращения к Сервису) могут обрабатываться в объёме, необходимом для работы Сервиса и исполнения требований закона.',
        'В чате доступны игры и иные интерактивные функции. Пользователь обязуется использовать их добросовестно и не злоупотреблять функциональностью Сервиса.',
        'Администрация вправе ограничивать доступ к чату или иным функциям при нарушении настоящих Условий либо по иным основаниям, предусмотренным законом.',
      ],
    },
    {
      title: '5. Пользовательский контент',
      paragraphs: [
        'Все права на загружаемый контент сохраняются за пользователем. Загружая контент, пользователь предоставляет Администрации безвозмездную неисключительную лицензию на его хранение, передачу, резервное копирование и отображение в объёме, необходимом для работы Сервиса.',
        'Пользователь подтверждает, что обладает всеми правами на загружаемый контент и что он не нарушает законодательство и права третьих лиц.',
      ],
    },
    {
      title: '6. Запрещённые действия',
      paragraphs: [
        'Запрещается использовать Сервис для: загрузки незаконных, экстремистских или оскорбительных материалов; распространения порнографии, материалов сексуального характера с участием несовершеннолетних, изображений обнажённого тела без согласия изображённого лица; распространения сведений, составляющих охраняемую законом тайну; оскорблений, угроз, преследования, спама и мошенничества; попыток обхода ограничений, реверс-инжиниринга, автоматизированного сбора данных; загрузки вредоносного программного обеспечения; использования Сервиса в коммерческих целях без письменного согласия Администрации.',
        'Администрация вправе без предупреждения удалить контент, заблокировать или удалить учётную запись при нарушении настоящих Условий или законодательства Республики Беларусь.',
      ],
    },
    {
      title: '7. Платные функции',
      paragraphs: [
        'На дату публикации настоящих Условий все функции Сервиса предоставляются безвозмездно. Платные услуги не оказываются, плата не взимается.',
        'Если в будущем появятся платные функции, их цены, сроки и порядок оплаты будут опубликованы в Публичной оферте и на странице «Оплата».',
      ],
    },
    {
      title: '8. Персональные данные',
      paragraphs: [
        'Обработка персональных данных осуществляется в соответствии с Законом Республики Беларусь от 7 мая 2021 г. № 99-З «О защите персональных данных» и Политикой конфиденциальности, размещённой по адресу /privacy.',
      ],
    },
    {
      title: '9. Отсутствие гарантий',
      paragraphs: [
        'Сервис предоставляется «как есть» и «по мере доступности». Администрация не гарантирует бесперебойную, безошибочную работу Сервиса, а также сохранность контента и сообщений. Пользователь самостоятельно отвечает за создание резервных копий важных для него данных за пределами Сервиса.',
      ],
    },
    {
      title: '10. Ограничение ответственности',
      paragraphs: [
        'В пределах, допустимых законодательством Республики Беларусь, Администрация не несёт ответственности за упущенную выгоду, моральный вред, утрату данных, конфликты между пользователями и иные косвенные убытки.',
      ],
    },
    {
      title: '11. Прекращение использования',
      paragraphs: [
        'Пользователь может в любое время прекратить использование Сервиса. Для удаления данных направьте обращение на amorely013@gmail.com. Администрация вправе приостановить или прекратить доступ при нарушении настоящих Условий, требований законодательства или по техническим причинам.',
      ],
    },
    {
      title: '12. Изменение условий',
      paragraphs: [
        'Администрация вправе в одностороннем порядке изменять настоящие Условия. Актуальная редакция всегда доступна по адресу amorely.love/terms. Продолжение использования Сервиса после публикации изменений означает согласие с ними.',
      ],
    },
    {
      title: '13. Применимое право и разрешение споров',
      paragraphs: [
        'К настоящим Условиям применяется законодательство Республики Беларусь. Споры разрешаются путём переговоров, а при недостижении соглашения — в судах Республики Беларусь в соответствии с подведомственностью, установленной законодательством.',
      ],
    },
    {
      title: '14. Контакты',
      paragraphs: [
        'Администрация сервиса Amorely. Сайт: amorely.love. Email: amorely013@gmail.com. Также доступна форма на странице «Поддержка».',
      ],
    },
  ],
};

const termsEn: LegalDocument = {
  intro:
    'These Terms of Use (“Terms”) govern the relationship between the Amorely service administration (amorely.love; the “Administration”, “we”) and the individual user of the Amorely service (the “Service”). Using the Service means full and unconditional acceptance of these Terms in accordance with Article 408 of the Civil Code of the Republic of Belarus.',
  sections: [
    {
      title: '1. Purpose of the Service',
      paragraphs: [
        'Amorely is a private online service for two people in a romantic relationship. It is meant for shared leisure: a memories feed, encrypted chat, calendar, games, virtual pets, dating ideas, and similar features.',
        'The Service is not intended for storing important legal, medical, financial, or other sensitive data, or intimate photos, images of nudity, or any information whose loss or disclosure could cause harm. You assess those risks yourself and must not upload such materials.',
      ],
    },
    {
      title: '2. Age and registration',
      paragraphs: [
        'The Service may be used by persons aged 16 or older. By registering, you confirm that you are of legal age or fully capable, or that you have a legal representative’s consent.',
        'You must provide accurate information and must not share account access with third parties. Registration is possible with an email address or via Google sign-in.',
      ],
    },
    {
      title: '3. Linking a partner',
      paragraphs: [
        'Most features become available after you link your account with a partner. By accepting an invitation, you agree that your partner can access data the Service shares by design (messages, photos, calendar events, pets, dating ideas, and similar).',
        'You may end the pair at any time in Settings. Content already shared may remain available to the other person as the Service’s logic provides.',
      ],
    },
    {
      title: '4. Chat, games, and encryption',
      paragraphs: [
        'Chat is for voluntary private conversation between partners. Messages may be transmitted and stored in encrypted form. The technical design may not allow the Administration to decrypt message contents.',
        'This does not mean anonymity for information you provide at registration, in support requests, or that is otherwise processed under the Privacy Policy. Metadata and technical data (for example, time of access) may be processed as needed to run the Service and comply with the law.',
        'Chat may include games and other interactive features. You must use them in good faith and not abuse the Service.',
        'The Administration may restrict access to chat or other features if these Terms are violated or as otherwise required by law.',
      ],
    },
    {
      title: '5. User content',
      paragraphs: [
        'You keep all rights to content you upload. By uploading content, you grant the Administration a royalty-free, non-exclusive licence to store, transmit, back up, and display it as needed to operate the Service.',
        'You confirm that you have all rights to the uploaded content and that it does not violate the law or third-party rights.',
      ],
    },
    {
      title: '6. Prohibited conduct',
      paragraphs: [
        'You may not use the Service to: upload illegal, extremist, or abusive materials; distribute pornography, sexual content involving minors, or images of nudity without the depicted person’s consent; disclose legally protected secrets; insult, threaten, harass, spam, or defraud; bypass restrictions, reverse-engineer, or scrape data; upload malware; or use the Service commercially without written consent.',
        'The Administration may delete content and block or delete an account without notice if these Terms or the laws of the Republic of Belarus are violated.',
      ],
    },
    {
      title: '7. Paid features',
      paragraphs: [
        'As of the date of these Terms, all Service features are provided free of charge. No paid services are offered and no fees are charged.',
        'If paid features appear later, their prices, terms, and payment process will be published in the Public Offer and on the Payment page.',
      ],
    },
    {
      title: '8. Personal data',
      paragraphs: [
        'Personal data is processed in accordance with the Law of the Republic of Belarus of 7 May 2021 No. 99-Z “On Personal Data Protection” and the Privacy Policy at /privacy.',
      ],
    },
    {
      title: '9. No warranties',
      paragraphs: [
        'The Service is provided “as is” and “as available”. The Administration does not guarantee uninterrupted or error-free operation, or the preservation of content and messages. You are responsible for keeping your own backups of data that matters to you.',
      ],
    },
    {
      title: '10. Limitation of liability',
      paragraphs: [
        'To the extent permitted by the laws of the Republic of Belarus, the Administration is not liable for lost profits, moral harm, data loss, conflicts between users, or other indirect losses.',
      ],
    },
    {
      title: '11. Ending use',
      paragraphs: [
        'You may stop using the Service at any time. To request deletion of your data, write to amorely013@gmail.com. The Administration may suspend or end access if these Terms or the law are violated, or for technical reasons.',
      ],
    },
    {
      title: '12. Changes to the Terms',
      paragraphs: [
        'The Administration may change these Terms. The current version is always available at amorely.love/terms. Continued use after publication means you accept the changes.',
      ],
    },
    {
      title: '13. Governing law and disputes',
      paragraphs: [
        'These Terms are governed by the laws of the Republic of Belarus. Disputes are resolved by negotiation and, if that fails, in the courts of the Republic of Belarus as provided by law.',
      ],
    },
    {
      title: '14. Contacts',
      paragraphs: [
        'Amorely service administration. Website: amorely.love. Email: amorely013@gmail.com. A contact form is also available on the Support page.',
      ],
    },
  ],
};

export const TERMS_CONTENT: Record<LegalLocale, LegalDocument> = {
  ru: termsRu,
  en: termsEn,
};
