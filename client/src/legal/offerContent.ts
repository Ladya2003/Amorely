import type { LegalDocument, LegalLocale } from './legalLocale';

const offerRu: LegalDocument = {
  intro:
    'Настоящий документ является публичной офертой (далее — «Оферта») Администрации сервиса Amorely (amorely.love; далее — «Исполнитель») в адрес любого дееспособного физического лица (далее — «Заказчик»). Оферта составлена в соответствии со статьями 396, 407 и 408 Гражданского кодекса Республики Беларусь.',
  sections: [
    {
      title: '1. Предмет',
      paragraphs: [
        'На дату публикации настоящей Оферты все функции Сервиса Amorely предоставляются безвозмездно. Возмездные услуги не оказываются, плата не взимается, договор возмездного оказания услуг не заключается.',
        'Сервис носит развлекательный характер и предназначен для досуга пары.',
        'Если в будущем Исполнитель начнёт оказывать платные услуги, перечень функций, цены и сроки будут опубликованы в новой редакции Оферты и на страницах Сервиса до начала приёма оплаты.',
      ],
    },
    {
      title: '2. Акцепт',
      paragraphs: [
        'Пока услуги предоставляются безвозмездно, акцепт настоящей Оферты как договора возмездного оказания услуг не производится.',
        'Использование бесплатного Сервиса регулируется Условиями пользования. Если появятся платные тарифы, акцептом Оферты станет совершение оплаты выбранного тарифа.',
      ],
    },
    {
      title: '3. Стоимость и порядок оплаты',
      paragraphs: [
        'Стоимость услуг на дату публикации равна нулю. Способы оплаты не предлагаются.',
        'Реквизиты платёжных карт Исполнителю не передаются, поскольку платежи не принимаются.',
      ],
    },
    {
      title: '4. Срок оказания услуги',
      paragraphs: [
        'Бесплатный доступ предоставляется с момента создания учётной записи и действует, пока Сервис функционирует и учётная запись не прекращена в соответствии с Условиями пользования.',
      ],
    },
    {
      title: '5. Возврат денежных средств',
      paragraphs: [
        'Поскольку плата не взимается, возврат денежных средств не применяется.',
        'Если в будущем появятся платные услуги, условия возврата будут изложены в обновлённой Оферте.',
      ],
    },
    {
      title: '6. Права и обязанности сторон',
      paragraphs: [
        'Исполнитель обязуется обеспечивать работоспособность Сервиса с учётом ограничений, изложенных в Условиях пользования.',
        'Заказчик обязуется соблюдать Условия пользования и законодательство Республики Беларусь.',
      ],
    },
    {
      title: '7. Ответственность',
      paragraphs: [
        'Стороны несут ответственность в соответствии с законодательством Республики Беларусь. Исполнитель не отвечает за упущенную выгоду и косвенные убытки Заказчика в пределах, допустимых законом.',
      ],
    },
    {
      title: '8. Обстоятельства непреодолимой силы',
      paragraphs: [
        'Стороны освобождаются от ответственности за неисполнение обязательств, если оно вызвано обстоятельствами непреодолимой силы, включая сбои инфраструктурных провайдеров, не зависящие от Исполнителя.',
      ],
    },
    {
      title: '9. Разрешение споров',
      paragraphs: [
        'Споры разрешаются путём переговоров. При недостижении соглашения — в судах Республики Беларусь в соответствии с подведомственностью.',
      ],
    },
    {
      title: '10. Реквизиты Исполнителя',
      paragraphs: [
        'Администрация сервиса Amorely. Сайт: amorely.love. Email: amorely013@gmail.com.',
      ],
    },
  ],
};

const offerEn: LegalDocument = {
  intro:
    'This document is a public offer (the “Offer”) by the Amorely service administration (amorely.love; the “Provider”) to any capable individual (the “Customer”). It is prepared in accordance with Articles 396, 407 and 408 of the Civil Code of the Republic of Belarus.',
  sections: [
    {
      title: '1. Subject',
      paragraphs: [
        'As of the date of this Offer, all Amorely features are provided free of charge. No paid services are offered, no fees are charged, and no paid service contract is formed.',
        'The Service is recreational and intended for a couple’s leisure.',
        'If the Provider later offers paid services, the feature list, prices, and terms will be published in a new edition of this Offer and on the Service before payments are accepted.',
      ],
    },
    {
      title: '2. Acceptance',
      paragraphs: [
        'While the Service is free, this Offer is not accepted as a paid service contract.',
        'Use of the free Service is governed by the Terms of Use. If paid plans appear, paying for a selected plan will constitute acceptance of the Offer.',
      ],
    },
    {
      title: '3. Price and payment',
      paragraphs: [
        'The price of services as of this publication is zero. No payment methods are offered.',
        'Card details are not sent to the Provider because payments are not accepted.',
      ],
    },
    {
      title: '4. Term',
      paragraphs: [
        'Free access starts when an account is created and continues while the Service operates and the account has not been ended under the Terms of Use.',
      ],
    },
    {
      title: '5. Refunds',
      paragraphs: [
        'Because no fee is charged, refunds do not apply.',
        'If paid services appear later, refund terms will be set out in an updated Offer.',
      ],
    },
    {
      title: '6. Rights and duties',
      paragraphs: [
        'The Provider will keep the Service operational, subject to the limits in the Terms of Use.',
        'The Customer must follow the Terms of Use and the laws of the Republic of Belarus.',
      ],
    },
    {
      title: '7. Liability',
      paragraphs: [
        'The parties are liable under the laws of the Republic of Belarus. To the extent permitted by law, the Provider is not liable for lost profits or the Customer’s indirect losses.',
      ],
    },
    {
      title: '8. Force majeure',
      paragraphs: [
        'A party is not liable for failure caused by force majeure, including infrastructure-provider outages beyond the Provider’s control.',
      ],
    },
    {
      title: '9. Disputes',
      paragraphs: [
        'Disputes are resolved by negotiation and, if that fails, in the courts of the Republic of Belarus as provided by law.',
      ],
    },
    {
      title: '10. Provider details',
      paragraphs: [
        'Amorely service administration. Website: amorely.love. Email: amorely013@gmail.com.',
      ],
    },
  ],
};

export const OFFER_CONTENT: Record<LegalLocale, LegalDocument> = {
  ru: offerRu,
  en: offerEn,
};
