const baseURL = 'http://localhost:3000';

const endpoints = [
  { path: '/api/users', name: 'Users (Волонтеры/Координаторы)' },
  { path: '/api/users?role=volunteer', name: 'Volunteers List (Список волонтеров)' },
  { path: '/api/projects', name: 'Projects (Проекты)' },
  { path: '/api/tasks', name: 'Tasks (Задачи)' },
  { path: '/api/checkins', name: 'Check-ins (Чек-ины / Отчеты)' },
  { path: '/api/alerts', name: 'Alerts (Экстренные оповещения)' },
  { path: '/api/meetings', name: 'Meetings (Встречи / Собрания)' },
  { path: '/api/organizations', name: 'Organizations (Волонтерские организации)' },
  { path: '/api/organizations/news', name: 'Organization News (Новости организаций)' },
  { path: '/api/organizations/memberships', name: 'Organization Memberships (Заявки на членство)' },
  { path: '/api/partners', name: 'Partners (Партнеры CRM)' },
  { path: '/api/hr-documents', name: 'HR Documents (Кадровые документы)' },
  { path: '/api/finance', name: 'Finance / Invoices (Дидокс финансы)' },
  { path: '/api/inventory', name: 'Inventory / Resources (Склад ресурсов)' },
  { path: '/api/kb/categories', name: 'Knowledge Base Categories (Категории базы знаний)' },
  { path: '/api/telegram/config', name: 'Telegram Bot Configuration (Настройки бота)' },
  { path: '/api/telegram/webhook/setup', name: 'Telegram Webhook Status (Статус вебхука)' },
  { path: '/api/access-keys', name: 'Access Keys / Passwords (Менеджер паролей)' },
  { path: '/api/archive', name: 'Archive / Digital Archive (Цифровой архив)' }
];

async function runTests() {
  console.log("=== ЗАПУСК ДИАГНОСТИКИ API ЭНДПОИНТОВ ===");
  console.log(`Сервер: ${baseURL}\n`);
  
  let successCount = 0;
  let failedCount = 0;
  
  // 1. Test standard GET endpoints
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${baseURL}${ep.path}`);
      const status = res.status;
      let body;
      try {
        body = await res.json();
      } catch (e) {
        body = null;
      }
      
      if (res.ok && body && !body.error) {
        const itemCount = Array.isArray(body) ? `(${body.length} эл.)` : '';
        console.log(`✅ [${status}] ${ep.name}: Успешно ${itemCount}`);
        successCount++;
      } else {
        const errorMsg = body && body.error ? body.error : 'Некорректный JSON/Ошибка';
        console.warn(`❌ [${status}] ${ep.name}: Ошибка -> ${errorMsg}`);
        failedCount++;
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${ep.name}: Не удалось отправить запрос ->`, err.message);
      failedCount++;
    }
  }
  
  // 2. Test dynamic/parameterized endpoints using fetched data
  console.log("\n=== ПРОВЕРКА ДИНАМИЧЕСКИХ ЭНДПОИНТОВ ===");
  
  try {
    // Get a volunteer ID for testing
    const usersRes = await fetch(`${baseURL}/api/users?role=volunteer`);
    const users = await usersRes.json();
    if (Array.isArray(users) && users.length > 0) {
      const testVolunteerId = users[0].id;
      
      // Test Recommendation API
      const recsRes = await fetch(`${baseURL}/api/tasks/recommend?volunteerId=${testVolunteerId}`);
      if (recsRes.ok) {
        const recs = await recsRes.json();
        console.log(`✅ [200] Рекомендации для волонтера (${testVolunteerId}): Успешно (${recs.recommendations?.length || 0} рек.)`);
        successCount++;
      } else {
        console.warn(`❌ [${recsRes.status}] Рекомендации для волонтера: Ошибка`);
        failedCount++;
      }
    } else {
      console.warn("⚠️ Пропуск динамических тестов: волонтеры не найдены");
    }
    
    // Get a project ID for testing
    const projRes = await fetch(`${baseURL}/api/projects`);
    const projects = await projRes.json();
    if (Array.isArray(projects) && projects.length > 0) {
      const testProjectId = projects[0].id;
      
      // Test Tasks by project
      const tasksRes = await fetch(`${baseURL}/api/tasks?projectId=${testProjectId}`);
      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        console.log(`✅ [200] Задачи проекта (${testProjectId}): Успешно (${tasks.length} эл.)`);
        successCount++;
      } else {
        console.warn(`❌ [${tasksRes.status}] Задачи проекта: Ошибка`);
        failedCount++;
      }
    }
    
  } catch (err) {
    console.error("❌ Ошибка при выполнении динамических тестов:", err.message);
  }

  console.log(`\n=== РЕЗУЛЬТАТЫ ДИАГНОСТИКИ ===`);
  console.log(`Всего тестов пройдено: ${successCount}`);
  console.log(`Всего ошибок: ${failedCount}`);
  if (failedCount === 0) {
    console.log("🎉 Все разделы и функции полностью работоспособны!");
  } else {
    console.log("⚠️ Обнаружены ошибки. Требуется проверка.");
  }
}

runTests();
