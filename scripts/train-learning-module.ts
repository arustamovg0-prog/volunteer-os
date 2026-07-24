import { recordAndLearnQueryResponse, runLearningCycle, loadLocalKnowledgeBase } from '../src/lib/learning-module';
import { db } from '../src/lib/db';

async function main() {
  console.log('🚀 [Train Learning Module] Старт автоматического модуля обучения Volunteer OS');

  // 1. Record user's instruction and response requirement into knowledge base
  const userRequest = `Обучение и Фиксации запросов. Анализировать каждый запрос и ответ, фиксировать и запоминать, обучаться на них. Формировать базу знаний и шпаргалку. Запускать модуль обучения после каждого запроса.`;
  const systemSolution = `Внедрен автоматический Модуль Обучения (src/lib/learning-module.ts). Все входящие запросы и ответы авто-индексируются в локальную базу знаний docs/AI_KNOWLEDGE_BASE.md, docs/ai_knowledge_base.json и базу данных PostgreSQL. После каждого вызова скрипт train-learning-module.ts запускает переобучение и обновление базы решений.`;

  await recordAndLearnQueryResponse({
    query: userRequest,
    response: systemSolution,
    category: 'Системное Обучение и Модули',
    source: 'user_instruction',
  });

  // 2. Scan MockMessages from Telegram bot to learn common bot interactions
  try {
    const mockMessages = await db.getAllMockMessages();
    console.log(`📥 [Train Learning Module] Найдено ${mockMessages.length} Telegram сообщений для анализа.`);

    for (let i = 0; i < mockMessages.length - 1; i++) {
      const current = mockMessages[i];
      const next = mockMessages[i + 1];

      if (current.sender === 'user' && next.sender === 'bot' && current.telegram_id === next.telegram_id) {
        if (current.text.length > 5 && next.text.length > 5) {
          await recordAndLearnQueryResponse({
            query: current.text,
            response: next.text,
            category: 'Telegram Бот - Частые Вопросы',
            source: `telegram_history:${current.id}`,
          });
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ [Train Learning Module] Предупреждение при чтении историй сообщений:', err);
  }

  // 3. Scan all internal CRM & Project Chats
  try {
    const chats = await db.getChats();
    console.log(`💬 [Train Learning Module] Анализируется ${chats.length} внутренних чатов платформы.`);

    for (const chat of chats) {
      const messages = await db.getChatMessages(chat.id);
      for (let i = 0; i < messages.length - 1; i++) {
        const msg = messages[i];
        const nextMsg = messages[i + 1];
        if (msg.text && nextMsg && nextMsg.text && msg.senderRole !== nextMsg.senderRole) {
          await recordAndLearnQueryResponse({
            query: msg.text,
            response: nextMsg.text,
            category: `Чат Проекта: ${chat.title}`,
            source: `crm_chat:${chat.id}`,
          });
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ [Train Learning Module] Предупреждение при чтении CRM чатов:', err);
  }

  // 3. Run full learning cycle
  const stats = await runLearningCycle();

  console.log('\n======================================================');
  console.log('🎉 [Train Learning Module] Модуль обучения успешно выполнен!');
  console.log(`📌 Всего зафиксировано элементов знаний: ${stats.totalLocalKnowledgeItems}`);
  console.log(`📚 База знаний в БД (KnowledgeBase): ${stats.databaseKBArticles}`);
  console.log(`📄 Шпаргалка сохранена в: docs/AI_KNOWLEDGE_BASE.md`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('❌ [Train Learning Module] Ошибка выполнения:', err);
  process.exit(1);
});
