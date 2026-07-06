import { db, KnowledgeBase } from './db';

const DEFAULT_LEADER_MENTIONS = [
  '@admin',
  '@director',
  '@leader',
  '@uva',
  '@uva_uz',
  'руководитель',
  'директор',
  'председатель',
  'ассоциация',
];

const STOP_WORDS = new Set([
  'что', 'как', 'для', 'или', 'это', 'если', 'надо', 'нужно', 'можно', 'кто', 'где',
  'когда', 'почему', 'по', 'на', 'из', 'от', 'до', 'при', 'про', 'нам', 'нам', 'мы',
  'вы', 'они', 'его', 'ее', 'уже', 'еще', 'the', 'and', 'for', 'with',
]);

function normalize(value: string) {
  return value.toLowerCase().replace(/ё/g, 'е');
}

export function isLeaderMention(text: string) {
  const normalized = normalize(text);
  const configured = (process.env.LEADER_TELEGRAM_MENTIONS || '')
    .split(',')
    .map((item) => normalize(item.trim()))
    .filter(Boolean);
  const mentions = configured.length > 0 ? configured : DEFAULT_LEADER_MENTIONS;

  return mentions.some((mention) => normalized.includes(mention));
}

function tokenize(value: string) {
  return Array.from(new Set(
    normalize(value)
      .match(/[\p{L}\p{N}_@#]{3,}/gu)
      ?.filter((token) => !STOP_WORDS.has(token)) || []
  ));
}

function scoreArticle(questionTokens: string[], article: KnowledgeBase) {
  const title = normalize(article.title);
  const category = normalize(article.category);
  const content = normalize(article.content);

  return questionTokens.reduce((score, token) => {
    if (title.includes(token)) score += 5;
    if (category.includes(token)) score += 3;
    if (content.includes(token)) score += 1;
    return score;
  }, 0);
}

function extractUsefulLines(article: KnowledgeBase, questionTokens: string[]) {
  const lines = article.content
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter((line) => line.length > 25 && !line.toLowerCase().startsWith('источник:'));

  const matched = lines
    .map((line) => ({
      line,
      score: questionTokens.reduce((sum, token) => sum + (normalize(line).includes(token) ? 1 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.line);

  return (matched.length > 0 ? matched : lines).slice(0, 2);
}

function buildFallbackGuidance(question: string) {
  const normalized = normalize(question);
  if (/(срочно|не хватает|риск|проблем|срыв|отмен|опозд|чс|опасн)/.test(normalized)) {
    return [
      'Назначить ответственного координатора и подтвердить статус в течение 30 минут.',
      'Зафиксировать потребность: сколько людей, где, когда и какой риск нужно закрыть.',
      'Если не хватает волонтеров, открыть резервный набор и отправить короткий брифинг участникам.',
    ];
  }

  if (/(партнер|донор|отчет|финанс|оплат|бюджет|счет|счёт)/.test(normalized)) {
    return [
      'Проверить владельца партнерского вопроса и дедлайн ответа.',
      'Подготовить краткую справку: статус, цифры, документы, фото или подтверждения.',
      'Не обещать решение без проверки бюджета, договора и ответственного координатора.',
    ];
  }

  return [
    'Уточнить цель запроса, ответственного и срок.',
    'Сверить вопрос с текущими проектами, мероприятиями и базой знаний.',
    'Если вопрос требует решения руководителя, вынести его в агенду ближайшей координации.',
  ];
}

export async function generateLeaderKnowledgeAnswer(question: string) {
  const cleanQuestion = question.replace(/\[Группа:[^\]]+\]/g, '').replace(/@[a-zA-Z0-9_]+/g, '').trim();
  const questionTokens = tokenize(cleanQuestion);
  const articles = await db.getKBArticles();
  const ranked = articles
    .map((article) => ({ article, score: scoreArticle(questionTokens, article) }))
    .sort((a, b) => b.score - a.score);

  const top = ranked.filter((item) => item.score > 0).slice(0, 3);
  const guidance = top.length > 0
    ? top.flatMap((item) => extractUsefulLines(item.article, questionTokens)).slice(0, 3)
    : buildFallbackGuidance(cleanQuestion);

  const sources = top.map((item) => item.article.title).slice(0, 3);
  const answerLines = guidance.map((line, index) => `${index + 1}. ${line}`);

  return {
    matchedArticles: sources,
    text: [
      'Ответ ИИ-ассистента руководителя:',
      '',
      ...answerLines,
      '',
      sources.length > 0
        ? `Основано на базе знаний: ${sources.join('; ')}.`
        : 'В базе знаний нет точного совпадения, поэтому ответ сформирован по общим операционным правилам.',
      'Если вопрос срочный, отметьте ответственного и срок прямо в группе.',
    ].join('\n'),
  };
}
