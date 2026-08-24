import type { LegalDocument, LegalLocale } from './legalLocale';
import { OFFER_CONTENT } from './offerContent';
import { PAYMENT_CONTENT } from './paymentContent';
import { PRIVACY_CONTENT } from './privacyContent';
import { TERMS_CONTENT } from './termsContent';

export type LegalDocId = 'terms' | 'privacy' | 'offer' | 'payment';

export const getLegalDocument = (id: LegalDocId, locale: LegalLocale): LegalDocument => {
  switch (id) {
    case 'terms':
      return TERMS_CONTENT[locale];
    case 'privacy':
      return PRIVACY_CONTENT[locale];
    case 'offer':
      return OFFER_CONTENT[locale];
    case 'payment':
      return PAYMENT_CONTENT[locale];
    default: {
      const _never: never = id;
      return _never;
    }
  }
};
