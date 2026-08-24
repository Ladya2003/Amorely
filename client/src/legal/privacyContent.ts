import type { LegalDocument, LegalLocale } from './legalLocale';

const privacyRu: LegalDocument = {
  intro:
    'Настоящая Политика разработана в соответствии с Законом Республики Беларусь от 7 мая 2021 г. № 99-З «О защите персональных данных» и определяет порядок обработки персональных данных пользователей сервиса Amorely (amorely.love).',
  sections: [
    {
      title: '1. Оператор',
      paragraphs: [
        'Оператором персональных данных является Администрация сервиса Amorely. Контакт ответственного за обработку персональных данных: amorely013@gmail.com.',
      ],
    },
    {
      title: '2. Категории обрабатываемых данных',
      paragraphs: [
        'учётные данные: адрес электронной почты, логин, пароль (в виде хеша) либо идентификатор входа через Google;',
        'профиль: имя, аватар, дата рождения, описание — по желанию пользователя;',
        'контент: фотографии, видео, события календаря, идеи свиданий и иные материалы, добровольно загруженные пользователем;',
        'данные о паре: идентификатор партнёра и совместный контент;',
        'чат: зашифрованная полезная нагрузка сообщений и вложений, а также технические метаданные, необходимые для доставки;',
        'технические данные: IP-адрес, тип устройства, токены push-уведомлений, журналы доступа;',
        'платёжные сведения на дату публикации Политики не обрабатываются: Сервис предоставляется бесплатно, реквизиты карт Оператору не передаются.',
      ],
    },
    {
      title: '3. Правовые основания и цели обработки',
      paragraphs: [
        'Обработка осуществляется на основании согласия субъекта персональных данных (ст. 6 Закона № 99-З), которое выражается путём проставления отметки при регистрации, а также для исполнения условий пользования Сервисом. Цели обработки:',
        'создание и ведение учётной записи, идентификация пользователя;',
        'предоставление функций Сервиса и обмен данными между партнёрами;',
        'отправка сервисных сообщений, писем подтверждения и push-уведомлений;',
        'обеспечение безопасности, предотвращение мошенничества;',
        'исполнение требований законодательства Республики Беларусь.',
      ],
    },
    {
      title: '4. Срок обработки',
      paragraphs: [
        'Персональные данные обрабатываются до момента удаления учётной записи либо до отзыва согласия. После удаления данные стираются в разумный срок, как правило в течение 30 календарных дней, за исключением сведений, подлежащих хранению согласно законодательству. Резервные копии истекают по обычному графику ротации.',
      ],
    },
    {
      title: '5. Передача данных третьим лицам',
      paragraphs: [
        'Оператор привлекает уполномоченных лиц (обработчиков), которые обрабатывают данные по поручению Оператора: поставщики хостинга и базы данных; облачное файловое хранилище; поставщик транзакционной электронной почты; поставщики push-уведомлений; Google — если пользователь выбирает вход через Google.',
        'Возможна трансграничная передача данных уполномоченным лицам в страны, обеспечивающие надлежащий уровень защиты персональных данных, либо с согласия пользователя. Иным третьим лицам данные не передаются, за исключением случаев, предусмотренных законодательством.',
      ],
    },
    {
      title: '6. Права субъекта персональных данных',
      paragraphs: [
        'В соответствии со ст. 11–18 Закона № 99-З пользователь вправе: получать информацию об обработке своих данных; требовать изменения неполных или неточных данных; отозвать согласие на обработку; требовать прекращения обработки и удаления данных; обжаловать действия Оператора в Национальный центр защиты персональных данных Республики Беларусь (cpd.by) либо в суд.',
        'Заявления направляются на адрес amorely013@gmail.com и рассматриваются в срок до 15 рабочих дней.',
      ],
    },
    {
      title: '7. Меры защиты',
      paragraphs: [
        'Применяются организационные и технические меры защиты: шифрование трафика (TLS), хранение паролей в виде хешей, шифрование содержимого чата на стороне клиента, разграничение доступа, резервное копирование. Несмотря на принимаемые меры, абсолютная безопасность сети Интернет не может быть гарантирована.',
      ],
    },
    {
      title: '8. Предупреждение о характере Сервиса',
      paragraphs: [
        'Сервис носит развлекательный характер и не предназначен для хранения важных, юридически значимых, медицинских, финансовых сведений, а также интимных фотографий и изображений обнажённого тела. Пользователь обязуется не загружать такие данные и осознаёт, что делает это на свой страх и риск.',
      ],
    },
    {
      title: '9. Cookies и аналогичные технологии',
      paragraphs: [
        'Сервис использует локальное хранилище браузера (localStorage, IndexedDB) для сохранения сессии, пользовательских настроек и криптографических ключей чата на устройстве. Куки-файлы для рекламного таргетинга не применяются.',
      ],
    },
    {
      title: '10. Изменения Политики',
      paragraphs: [
        'Актуальная редакция Политики публикуется по адресу amorely.love/privacy. О существенных изменениях пользователи уведомляются через Сервис или по электронной почте.',
      ],
    },
  ],
};

const privacyEn: LegalDocument = {
  intro:
    'This Policy is prepared in accordance with the Law of the Republic of Belarus of 7 May 2021 No. 99-Z “On Personal Data Protection” and describes how Amorely (amorely.love) processes users’ personal data.',
  sections: [
    {
      title: '1. Controller',
      paragraphs: [
        'The personal data controller is the Amorely service administration. Contact for data-protection matters: amorely013@gmail.com.',
      ],
    },
    {
      title: '2. Categories of data',
      paragraphs: [
        'account data: email address, username, password (stored as a hash), or a Google sign-in identifier;',
        'profile: name, avatar, date of birth, bio — if you choose to provide them;',
        'content: photos, videos, calendar events, dating ideas, and other materials you upload voluntarily;',
        'pair data: partner identifier and shared content;',
        'chat: encrypted message and attachment payloads, plus technical metadata needed for delivery;',
        'technical data: IP address, device type, push-notification tokens, access logs;',
        'as of this Policy, payment data is not processed: the Service is free and card details are not sent to the controller.',
      ],
    },
    {
      title: '3. Legal bases and purposes',
      paragraphs: [
        'Processing is based on the data subject’s consent (Article 6 of Law No. 99-Z), given by checking the box at registration, and on providing the Service under the Terms. Purposes include:',
        'creating and maintaining an account and identifying the user;',
        'providing Service features and exchanging data between partners;',
        'sending service messages, verification emails, and push notifications;',
        'security and fraud prevention;',
        'complying with the laws of the Republic of Belarus.',
      ],
    },
    {
      title: '4. Retention',
      paragraphs: [
        'Personal data is processed until the account is deleted or consent is withdrawn. After deletion, data is erased within a reasonable time, usually 30 calendar days, except records that must be kept by law. Backups expire on the normal rotation schedule.',
      ],
    },
    {
      title: '5. Recipients',
      paragraphs: [
        'The controller uses processors that handle data on its instructions: hosting and database providers; cloud file storage; transactional email; push-notification providers; and Google if you choose Google sign-in.',
        'Cross-border transfers to processors may occur where an adequate level of protection applies, or with your consent. Data is not shared with other third parties except as required by law.',
      ],
    },
    {
      title: '6. Your rights',
      paragraphs: [
        'Under Articles 11–18 of Law No. 99-Z you may: obtain information about processing; request correction of incomplete or inaccurate data; withdraw consent; request that processing stop and data be deleted; and appeal to the National Personal Data Protection Centre of the Republic of Belarus (cpd.by) or to a court.',
        'Requests should be sent to amorely013@gmail.com and are reviewed within 15 business days.',
      ],
    },
    {
      title: '7. Security measures',
      paragraphs: [
        'We apply organisational and technical measures: TLS in transit, hashed passwords, client-side encryption of chat contents, access control, and backups. Absolute security on the internet cannot be guaranteed.',
      ],
    },
    {
      title: '8. Nature of the Service',
      paragraphs: [
        'The Service is recreational and is not intended for important legal, medical, or financial information, or for intimate photos and images of nudity. You agree not to upload such data and understand that you do so at your own risk.',
      ],
    },
    {
      title: '9. Cookies and similar technologies',
      paragraphs: [
        'The Service uses browser storage (localStorage, IndexedDB) for the session, preferences, and on-device chat cryptographic keys. Advertising-targeting cookies are not used.',
      ],
    },
    {
      title: '10. Changes',
      paragraphs: [
        'The current Policy is published at amorely.love/privacy. Material changes will be announced in the Service or by email.',
      ],
    },
  ],
};

export const PRIVACY_CONTENT: Record<LegalLocale, LegalDocument> = {
  ru: privacyRu,
  en: privacyEn,
};
