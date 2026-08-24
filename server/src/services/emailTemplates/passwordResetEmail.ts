import { getPasswordResetEmailCopy } from './emailCopy';
import { buildTransactionalEmailHtml } from './emailLayout';

export const buildPasswordResetEmailSubject = (locale?: string | null): string =>
  getPasswordResetEmailCopy(locale).subject;

export const buildPasswordResetEmailText = (resetUrl: string, locale?: string | null): string => {
  const copy = getPasswordResetEmailCopy(locale);
  return [
    copy.subject,
    '',
    copy.textIntro,
    copy.textAction,
    resetUrl,
    '',
    copy.textExpires,
    '',
    copy.textIgnore,
    '',
    copy.signoff,
  ].join('\n');
};

export const buildPasswordResetEmailHtml = (resetUrl: string, locale?: string | null): string => {
  const copy = getPasswordResetEmailCopy(locale);
  return buildTransactionalEmailHtml({
    htmlLang: copy.htmlLang,
    title: copy.subject,
    heading: copy.heading,
    subtitle: copy.subtitle,
    buttonLabel: copy.button,
    linkHint: copy.linkHint,
    footerNote: copy.footerNote,
    madeForCouples: copy.madeForCouples,
    actionUrl: resetUrl,
  });
};
