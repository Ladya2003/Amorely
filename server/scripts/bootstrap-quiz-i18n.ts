/**
 * Writes ru/en-only quiz i18n files from existing content (before full locale generation).
 * Run: npx ts-node scripts/bootstrap-quiz-i18n.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { QUIZ_QUESTIONS } from '../src/games/quizGameConfig';
import { QUIZ_ANSWER_EN } from '../src/i18n/generated/quizAnswersEn';
import { QUIZ_QUESTION_EN } from '../src/i18n/generated/quizQuestionsEn';

const escapeTs = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const outDir = path.join(__dirname, '../src/i18n/generated');

const questionLines = QUIZ_QUESTIONS.map((question) => {
  const en = QUIZ_QUESTION_EN[question.id] ?? question.text;
  return `  '${question.id}': { ru: '${escapeTs(question.text)}', en: '${escapeTs(en)}' },`;
});

const answerLines = QUIZ_QUESTIONS.map((question) => {
  const en = QUIZ_ANSWER_EN[question.id] ?? question.answers[0];
  return `  '${question.id}': { en: '${escapeTs(en)}' },`;
});

fs.writeFileSync(
  path.join(outDir, 'quizQuestionsI18n.ts'),
  `/** Bootstrap — run generate-quiz-i18n.ts for full locales. */
import type { AppLocale } from '../locales';

export const QUIZ_QUESTION_I18N: Record<string, Partial<Record<AppLocale, string>>> = {
${questionLines.join('\n')}
};
`
);

fs.writeFileSync(
  path.join(outDir, 'quizAnswersI18n.ts'),
  `/** Bootstrap — run generate-quiz-i18n.ts for full locales. */
import type { AppLocale } from '../locales';

export const QUIZ_ANSWER_I18N: Record<string, Partial<Record<AppLocale, string>>> = {
${answerLines.join('\n')}
};
`
);

console.log(`Bootstrapped ${QUIZ_QUESTIONS.length} quiz question/answer entries.`);
