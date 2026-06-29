export const APP_FONT_FAMILY = '"Inter", "Segoe UI", system-ui, sans-serif';

/** Типографика по дизайн-системе: Inter, трекинг в % → em */
export const typographyScale = {
  heading1: {
    fontWeight: 700,
    letterSpacing: '-0.03em',
    fontSize: '2rem',
    lineHeight: 1.15,
  },
  heading2: {
    fontWeight: 600,
    letterSpacing: '-0.05em',
    fontSize: '1.6rem',
    lineHeight: 1.2,
  },
  heading3: {
    fontWeight: 500,
    letterSpacing: '-0.07em',
    fontSize: '1.25rem',
    lineHeight: 1.25,
  },
  heading4: {
    fontWeight: 400,
    letterSpacing: '-0.07em',
    fontSize: '1.25rem',
    lineHeight: 1.25,
  },
  minitext: {
    fontWeight: 500,
    letterSpacing: '0.02em',
    fontSize: '0.75rem',
    lineHeight: 1.3,
    textTransform: 'uppercase' as const,
  },
  miniMinitext: {
    fontWeight: 500,
    letterSpacing: '0.04em',
    fontSize: '0.625rem',
    lineHeight: 1.3,
    textTransform: 'uppercase' as const,
  },
};
