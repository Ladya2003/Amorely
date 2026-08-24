import type { LegalDocument, LegalLocale } from './legalLocale';

const paymentRu: LegalDocument = {
  intro:
    'На дату публикации все функции сервиса Amorely предоставляются совершенно бесплатно. Оплата не принимается, платные тарифы не предлагаются.',
  sections: [
    {
      title: '1. Текущий статус',
      paragraphs: [
        'Создать аккаунт, пригласить партнёра и пользоваться чатом, календарём, лентой, играми, питомцами и идеями для свиданий можно без оплаты.',
        'Скрытых платежей, обязательных подписок и платных ограничений функций нет.',
      ],
    },
    {
      title: '2. Платёжные данные',
      paragraphs: [
        'Страница оплаты платёжного оператора не открывается. Реквизиты банковских карт, данные 3-D Secure и иные платёжные сведения Администрации не передаются и не хранятся.',
      ],
    },
    {
      title: '3. Если оплата появится',
      paragraphs: [
        'Если в будущем Сервис начнёт принимать платежи, на этой странице будут опубликованы доступные способы оплаты, условия безопасной передачи данных и порядок возврата.',
        'До этого момента применяются Условия пользования и Публичная оферта в редакции, согласно которой услуги оказываются безвозмездно.',
      ],
    },
    {
      title: '4. Вопросы',
      paragraphs: [
        'По вопросам Сервиса напишите на amorely013@gmail.com или воспользуйтесь формой на странице «Поддержка».',
      ],
    },
  ],
};

const paymentEn: LegalDocument = {
  intro:
    'As of this publication, every Amorely feature is completely free. Payments are not accepted and no paid plans are offered.',
  sections: [
    {
      title: '1. Current status',
      paragraphs: [
        'You can create an account, invite your partner, and use chat, calendar, feed, games, pets, and dating ideas without paying.',
        'There are no hidden fees, required subscriptions, or paid feature locks.',
      ],
    },
    {
      title: '2. Payment data',
      paragraphs: [
        'No payment-operator checkout is opened. Card numbers, 3-D Secure data, and other payment details are not sent to or stored by the Administration.',
      ],
    },
    {
      title: '3. If payments are added',
      paragraphs: [
        'If the Service later accepts payments, this page will list available methods, data-security terms, and the refund process.',
        'Until then, the Terms of Use and Public Offer apply in the edition that states services are provided free of charge.',
      ],
    },
    {
      title: '4. Questions',
      paragraphs: [
        'For questions about the Service, write to amorely013@gmail.com or use the form on the Support page.',
      ],
    },
  ],
};

export const PAYMENT_CONTENT: Record<LegalLocale, LegalDocument> = {
  ru: paymentRu,
  en: paymentEn,
};
