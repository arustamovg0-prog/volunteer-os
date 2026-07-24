import fs from 'fs';
import path from 'path';
import { db, prisma, KnowledgeBase } from './db';
import { logSystemEvent } from './logger';

export interface LearnedKnowledgeItem {
  id: string;
  timestamp: string;
  category: string;
  query: string;
  solution: string;
  tags: string[];
  source: string;
}

const LOCAL_KB_PATH = path.join(process.cwd(), 'docs', 'ai_knowledge_base.json');
const LOCAL_KB_MD_PATH = path.join(process.cwd(), 'docs', 'AI_KNOWLEDGE_BASE.md');

function ensureDocsDir() {
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
}

export function loadLocalKnowledgeBase(): LearnedKnowledgeItem[] {
  ensureDocsDir();
  if (fs.existsSync(LOCAL_KB_PATH)) {
    try {
      const content = fs.readFileSync(LOCAL_KB_PATH, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveLocalKnowledgeBase(items: LearnedKnowledgeItem[]) {
  ensureDocsDir();
  fs.writeFileSync(LOCAL_KB_PATH, JSON.stringify(items, null, 2), 'utf-8');

  // Also update markdown cheat sheet for quick reference
  let markdownContent = `# База Знаний и Шпаргалка Volunteer OS (ИИ-Обучение)\n\n`;
  markdownContent += `*Последнее обновление: ${new Date().toISOString()}*\n`;
  markdownContent += `*Всего зафиксировано знаний: ${items.length}*\n\n`;
  markdownContent += `---\n\n`;

  const categorized = items.reduce((acc, item) => {
    const cat = item.category || 'Общие вопросы';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, LearnedKnowledgeItem[]>);

  for (const [category, list] of Object.entries(categorized)) {
    markdownContent += `## 📁 Категория: ${category}\n\n`;
    for (const item of list) {
      markdownContent += `### ❓ Запрос: ${item.query}\n`;
      markdownContent += `**📅 Дата:** ${item.timestamp} | **Источник:** ${item.source}\n`;
      if (item.tags.length > 0) {
        markdownContent += `**🏷 Теги:** ${item.tags.map((t) => `\`${t}\``).join(', ')}\n`;
      }
      markdownContent += `\n**💡 Решение / Ответ:**\n${item.solution}\n\n`;
      markdownContent += `---\n\n`;
    }
  }

  fs.writeFileSync(LOCAL_KB_MD_PATH, markdownContent, 'utf-8');
}

function extractTags(query: string, response: string): string[] {
  const text = `${query} ${response}`.toLowerCase();
  const tags: string[] = [];

  if (text.includes('telegram') || text.includes('бот')) tags.push('telegram-bot');
  if (text.includes('проект') || text.includes('project')) tags.push('projects');
  if (text.includes('волонтер') || text.includes('volunteer')) tags.push('volunteers');
  if (text.includes('чекин') || text.includes('checkin')) tags.push('checkins');
  if (text.includes('чс') || text.includes('авария') || text.includes('alert')) tags.push('emergency');
  if (text.includes('ошибка') || text.includes('баг') || text.includes('error')) tags.push('bugfix');
  if (text.includes('обучение') || text.includes('база знаний')) tags.push('ai-learning');
  if (text.includes('руковод') || text.includes('директор')) tags.push('leadership');

  return Array.from(new Set(tags));
}

export async function recordAndLearnQueryResponse(data: {
  query: string;
  response: string;
  category?: string;
  source?: string;
}): Promise<LearnedKnowledgeItem> {
  const { query, response, category = 'Обучение и Аналитика', source = 'system' } = data;

  const tags = extractTags(query, response);
  const newItem: LearnedKnowledgeItem = {
    id: `kb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    category,
    query: query.trim(),
    solution: response.trim(),
    tags,
    source,
  };

  // 1. Save to local JSON & Markdown Knowledge Base file
  const localItems = loadLocalKnowledgeBase();
  const existingIdx = localItems.findIndex((i) => i.query === newItem.query);
  if (existingIdx >= 0) {
    localItems[existingIdx] = newItem;
  } else {
    localItems.push(newItem);
  }
  saveLocalKnowledgeBase(localItems);

  // 2. Sync to Postgres/Prisma KnowledgeBase database table if DB is accessible
  try {
    const dbArticles = await db.getKBArticles();
    const existingDbArticle = dbArticles.find((a) => a.title === newItem.query);
    if (existingDbArticle) {
      await db.updateKBArticle(existingDbArticle.id, {
        content: newItem.solution,
        category: newItem.category,
      });
    } else {
      await db.createKBArticle({
        category: newItem.category,
        title: newItem.query.length > 100 ? `${newItem.query.substring(0, 97)}...` : newItem.query,
        content: `**Запрос:** ${newItem.query}\n\n**Решение:**\n${newItem.solution}\n\n*Теги: ${newItem.tags.join(', ')}*`,
      });
    }
  } catch (err) {
    console.error('Failed to sync knowledge item to DB:', err);
  }

  // 3. Log event using system logger
  try {
    await logSystemEvent(
      'INFO',
      `[AI Learning Module] Зафиксирован запрос и ответ в Базу Знаний: "${newItem.query.substring(0, 50)}..."`,
      { query: newItem.query, tags: newItem.tags, source: newItem.source },
      'learning-module'
    );
  } catch (err) {
    console.error('Failed to log system learning event:', err);
  }

  return newItem;
}

export async function runLearningCycle() {
  console.log('🔄 [Learning Module] Запуск цикла анализа, фиксации и обучения...');

  const localItems = loadLocalKnowledgeBase();
  let dbCount = 0;
  let mockMsgCount = 0;
  let logsCount = 0;

  try {
    const dbArticles = await db.getKBArticles();
    dbCount = dbArticles.length;
  } catch {}

  try {
    const mockMsgs = await db.getAllMockMessages();
    mockMsgCount = mockMsgs.length;
  } catch {}

  try {
    const logs = await prisma.systemLog.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
    logsCount = logs.length;
  } catch {}

  const summaryReport = {
    timestamp: new Date().toISOString(),
    status: 'ACTIVE_TRAINING_ENABLED',
    totalLocalKnowledgeItems: localItems.length,
    databaseKBArticles: dbCount,
    processedMockMessages: mockMsgCount,
    recentSystemLogs: logsCount,
    latestCategories: Array.from(new Set(localItems.map((i) => i.category))),
  };

  console.log('✅ [Learning Module] Результаты обучения:', summaryReport);
  return summaryReport;
}
