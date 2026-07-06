const fs = require('fs');
const PDFDocument = require('pdfkit');

function generateGuide() {
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  const stream = fs.createWriteStream('/Users/akmalrustamov/Documents/Volunteer OS/volunteer_os_user_guide.pdf');
  
  doc.pipe(stream);

  // Register fonts with Cyrillic support (native macOS fonts)
  doc.registerFont('Arial', '/System/Library/Fonts/Supplemental/Arial.ttf');
  doc.registerFont('Arial-Bold', '/System/Library/Fonts/Supplemental/Arial Bold.ttf');

  // Colors
  const primaryColor = '#0F172A'; // Slate 900
  const secondaryColor = '#2563EB'; // Blue 600
  const textColor = '#334155'; // Slate 700
  const accentColor = '#DC2626'; // Red 600

  // Helper for headers
  const writeHeader = (title, level = 1) => {
    doc.moveDown(1.5);
    if (level === 1) {
      doc.font('Arial-Bold').fontSize(16).fillColor(primaryColor).text(title);
      // Draw underline
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 50, doc.y + 2);
      doc.strokeColor('#E2E8F0');
      doc.lineWidth(1.5);
      doc.stroke();
      doc.moveDown(0.8);
    } else {
      doc.font('Arial-Bold').fontSize(12).fillColor(secondaryColor).text(title);
      doc.moveDown(0.5);
    }
  };

  // Helper for normal text
  const writeText = (text, options = {}) => {
    doc.font('Arial').fontSize(10).fillColor(textColor).text(text, { lineGap: 3, ...options });
  };

  const writeBullet = (label, desc) => {
    doc.font('Arial-Bold').fontSize(10).fillColor(primaryColor).text(`• ${label}: `, { continued: true });
    doc.font('Arial').fillColor(textColor).text(desc, { lineGap: 2 });
  };

  // --- COVER PAGE ---
  // Background/Border
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40);
  doc.strokeColor('#CBD5E1');
  doc.lineWidth(1);
  doc.stroke();
  
  doc.moveDown(6);
  doc.font('Arial-Bold').fontSize(24).fillColor(primaryColor).text('VOLUNTEER OS', { align: 'center', tracking: 2 });
  doc.fontSize(10).font('Arial').fillColor(secondaryColor).text('ИНСТРУКЦИЯ ПОЛЬЗОВАТЕЛЯ ДЛЯ «ЧАЙНИКОВ»', { align: 'center', tracking: 1 });
  
  doc.moveDown(3);
  doc.font('Arial-Bold').fontSize(14).fillColor(textColor).text('Быстрый старт, авторизация и работа в системе', { align: 'center' });
  
  doc.moveDown(6);
  // Divider
  doc.moveTo(150, doc.y).lineTo(doc.page.width - 150, doc.y);
  doc.strokeColor(secondaryColor);
  doc.lineWidth(2);
  doc.stroke();
  
  doc.moveDown(4);
  doc.font('Arial').fontSize(9).fillColor('#64748B').text('Платформа: volunteer-os-zeta.vercel.app', { align: 'center' });
  doc.text(`Версия документа: 1.0 (Июль 2026)`, { align: 'center' });
  doc.text('Ассоциация Волонтеров — Операционное Управление', { align: 'center' });

  // --- PAGE 2 ---
  doc.addPage();
  writeHeader('1. Введение в платформу');
  writeText('Volunteer OS — это современная операционная система для координации волонтерской деятельности, управления социальными проектами, ведения цифрового архива и быстрого сбора по тревоге в случае чрезвычайных ситуаций.');
  doc.moveDown(0.5);
  writeText('Платформа состоит из двух ключевых частей:');
  doc.moveDown(0.5);
  writeBullet('Веб-интерфейс', 'Сайт для координаторов (панель управления) и волонтеров (личный мобильный кабинет).');
  writeBullet('Telegram-бот', 'Удобный инструмент для волонтеров, позволяющий получать новые задачи и сдавать отчеты с помощью текста или голосовых сообщений (с автоматической расшифровкой ИИ).');

  writeHeader('2. Адрес и быстрый вход');
  writeText('Для перехода на платформу откройте в браузере (на компьютере или телефоне) следующую ссылку:');
  doc.moveDown(0.5);
  doc.font('Arial-Bold').fontSize(11).fillColor(secondaryColor).text('https://volunteer-os-zeta.vercel.app', { align: 'center' });
  doc.moveDown(0.8);
  writeText('На странице входа выберите нужную вкладку в зависимости от вашей роли:');
  writeBullet('Вход для координаторов', 'Используется руководителем (admin) и координаторами/менеджерами (alexey, ekaterina).');
  writeBullet('Вход для волонтеров', 'Используется волонтерами (ivan, maria, anna).');

  writeHeader('3. Логины и пароли по умолчанию');
  writeText('Используйте эти данные для первого входа на платформу:');
  doc.moveDown(0.5);
  
  // Table
  const tableTop = doc.y;
  doc.rect(50, tableTop, 500 - 50, 95).fill('#F8FAFC');
  doc.rect(50, tableTop, 500 - 50, 20).fill('#0F172A');
  
  doc.font('Arial-Bold').fontSize(9).fillColor('#FFFFFF');
  doc.text('Роль / Пользователь', 60, tableTop + 5, { width: 150 });
  doc.text('Логин', 220, tableTop + 5, { width: 100 });
  doc.text('Пароль', 340, tableTop + 5, { width: 120 });
  
  doc.font('Arial').fontSize(9).fillColor(textColor);
  
  // Row 1
  doc.text('Руководитель (Дмитрий)', 60, tableTop + 25);
  doc.font('Arial-Bold').text('admin', 220, tableTop + 25);
  doc.font('Arial').text('admin123', 340, tableTop + 25);
  
  // Row 2
  doc.text('Координатор (Алексей)', 60, tableTop + 42);
  doc.font('Arial-Bold').text('alexey', 220, tableTop + 42);
  doc.font('Arial').text('coord123', 340, tableTop + 42);

  // Row 3
  doc.text('Координатор (Екатерина)', 60, tableTop + 59);
  doc.font('Arial-Bold').text('ekaterina', 220, tableTop + 59);
  doc.font('Arial').text('coord123', 340, tableTop + 59);

  // Row 4
  doc.text('Волонтеры (Иван, Мария, Анна)', 60, tableTop + 76);
  doc.font('Arial-Bold').text('ivan / maria / anna', 220, tableTop + 76);
  doc.font('Arial').text('volunteer123', 340, tableTop + 76);

  doc.y = tableTop + 105;

  // --- PAGE 3 ---
  doc.addPage();
  writeHeader('4. Руководство для волонтера');
  writeText('После входа в систему волонтер попадает в мобильный личный кабинет. Основные возможности:');
  doc.moveDown(0.5);
  writeBullet('Просмотр профиля', 'На главном экране отображается ваш уровень, опыт (XP), рейтинг эффективности и полученные награды (бейджи).');
  writeBullet('ИИ-Рекомендации', 'Система автоматически анализирует ваши навыки и интересы и предлагает наиболее подходящие задачи.');
  writeBullet('Взятие задач', 'В разделе «Проекты» вы можете переключаться между списком проектов и интерактивной картой Ташкента. Настройте радиус поиска (slider) и категорию, выберите проект на карте и нажмите «Взять себе задачи».');
  writeBullet('Сдача отчетов', 'Для сданной задачи нажмите кнопку «Сдать отчет», укажите количество затраченных часов и опишите результаты. Часы будут зафиксированы, а вы получите очки опыта (XP).');
  
  writeHeader('5. Руководство для координатора');
  writeText('Координаторы имеют доступ к полноценной CRM-системе на ПК и телефонах:');
  doc.moveDown(0.5);
  writeBullet('Панель управления', 'Сводная аналитика по часам, волонтерам, проектам и задачам.');
  writeBullet('Канбан-доска', 'Удобный таск-трекер для распределения задач по стадиям.');
  writeBullet('Управление складом', 'Контроль за выдачей и возвратом инвентаря (лопат, мешков и т.д.) волонтерам.');
  writeBullet('Чрезвычайные ситуации', 'В разделе «Чрезвычайные Ситуации» можно отправить экстренный сбор по тревоге. Выберите точку сбора на карте, укажите радиус (в км) и требуемые навыки. Система автоматически найдет подходящих волонтеров, отправит им уведомление в Telegram и выведет красный баннер в их личном кабинете.');

  writeHeader('6. Работа с Telegram-ботом');
  writeText('Telegram-бот (@VolunteerOSBot) синхронизирован с вашим аккаунтом на сайте.');
  doc.moveDown(0.5);
  writeBullet('Запуск бота', 'Найдите бота в Telegram, введите команду /start и нажмите кнопку «Поделиться контактом», чтобы привязать профиль.');
  writeBullet('Уведомления', 'Бот будет автоматически присылать уведомления о новых задачах и сигналах тревоги.');
  writeBullet('Сдача отчетов голосом', 'Вы можете отправить боту обычное голосовое сообщение с отчетом. ИИ-секретарь сам расшифрует его, выделит ключевое и сохранит отчет на платформе.');

  // Footer for pages
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    if (i > 0) { // Don't print header/footer on cover
      doc.font('Arial').fontSize(8).fillColor('#94A3B8');
      doc.text(`Страница ${i + 1} из ${range.count}`, 50, doc.page.height - 40, { align: 'right' });
      doc.text('Volunteer OS — Инструкция пользователя', 50, doc.page.height - 40, { align: 'left' });
    }
  }

  doc.end();
  console.log('PDF Generated successfully.');
}

generateGuide();
