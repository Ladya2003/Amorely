import { getVerificationEmailCopy } from './emailCopy';
import { buildTransactionalEmailHtml } from './emailLayout';

export const buildVerificationEmailSubject = (locale?: string | null): string =>
  getVerificationEmailCopy(locale).subject;

export const buildVerificationEmailText = (verifyUrl: string, locale?: string | null): string => {
  const copy = getVerificationEmailCopy(locale);
  return [
    copy.textWelcome,
    '',
    copy.textIntro,
    verifyUrl,
    '',
    copy.textExpires,
    '',
    copy.textIgnore,
    '',
    copy.signoff,
  ].join('\n');
};

export const buildVerificationEmailHtml = (verifyUrl: string, locale?: string | null): string => {
  const copy = getVerificationEmailCopy(locale);
  return buildTransactionalEmailHtml({
    htmlLang: copy.htmlLang,
    title: copy.subject,
    heading: copy.heading,
    subtitle: copy.subtitle,
    buttonLabel: copy.button,
    linkHint: copy.linkHint,
    footerNote: copy.footerNote,
    madeForCouples: copy.madeForCouples,
    actionUrl: verifyUrl,
  });
};
