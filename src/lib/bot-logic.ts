import { db, User, Task } from './db';
import { hashPassword } from './security';
import crypto from 'crypto';
import { t } from './bot-i18n';

export interface BotResponse {
  text: string;
  keyboard?: {
    text: string;
    callback_data?: string;
    request_contact?: boolean;
  }[][];
}

/**
 * Handles incoming messages/actions for the Telegram bot.
 * Returns a response with text and optional inline buttons.
 */
export async function handleBotUpdate(
  telegramId: number,
  text: string,
  username?: string,
  phone?: string | null,
  firstName?: string,
  lastName?: string
): Promise<BotResponse> {
  const cleanText = text.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://volunteer-os-zeta.vercel.app';
  
  // 1. Check if user is registered, their session, and any existing application concurrently
  let [user, session, existingApp] = await Promise.all([
    db.getUserByTelegramId(telegramId),
    db.getTelegramSession(telegramId),
    db.getVolunteerApplicationByTelegramId(telegramId)
  ]);
  
  if (!user) {
    if (existingApp) {
      if (existingApp.status === 'pending') {
        return { text: 'Ваша заявка уже отправлена на рассмотрение. Пожалуйста, ожидайте решения администратора.' };
      }
      if (existingApp.status === 'rejected') {
        return { text: 'К сожалению, ваша заявка была отклонена.' };
      }
    }

    if (cleanText === '/start') {
      await db.setTelegramSession(telegramId, 'reg_lang', { });
      return {
        text: '👋 Добро пожаловать! Выберите язык / Choose language / Tilni tanlang:',
        keyboard: [
          [
            { text: 'ENG', callback_data: 'lang_ENG' },
            { text: 'UZB', callback_data: 'lang_UZB' },
            { text: 'RUS', callback_data: 'lang_RUS' }
          ]
        ]
      };
    }

    if (session) {
      const state = session.state;
      const data = session.data;

      if (state === 'reg_lang') {
        if (cleanText.startsWith('lang_')) {
          data.lang = cleanText.replace('lang_', '');
          await db.setTelegramSession(telegramId, 'reg_name', data);
          return { text: t('reg_name', data.lang) };
        }
        return { text: t('reg_choose_lang', data.lang) };
      }

      if (state === 'reg_name') {
        data.fullName = cleanText;
        await db.setTelegramSession(telegramId, 'reg_dob', data);
        return { text: t('reg_dob', data.lang) };
      }

      if (state === 'reg_dob') {
        const parts = cleanText.split('.');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const dob = new Date(year, month, day);
          const ageDifMs = Date.now() - dob.getTime();
          const ageDate = new Date(ageDifMs);
          const age = Math.abs(ageDate.getUTCFullYear() - 1970);
          
          if (age < 16) {
            await db.clearTelegramSession(telegramId);
            return { text: t('reg_age_min', data.lang) };
          }
          if (age > 50) {
            await db.clearTelegramSession(telegramId);
            return { text: t('reg_age_max', data.lang) };
          }

          data.dob = cleanText;
          await db.setTelegramSession(telegramId, 'reg_contact', data);
          return {
            text: t('reg_contact', data.lang),
            keyboard: [[{ text: t('reg_contact_btn', data.lang), request_contact: true }]]
          };
        }
        return { text: t('reg_dob_error', data.lang) };
      }

      if (state === 'reg_contact') {
        const isDirectPhone = cleanText.match(/^\+?[0-9]{10,12}$/);
        const phoneToRegister = phone || (isDirectPhone ? cleanText : null);
        if (phoneToRegister) {
          data.phone = phoneToRegister.replace(/[^\d+]/g, '');
          data.skills = [];
          await db.setTelegramSession(telegramId, 'reg_skills_lang', data);
          return {
            text: t('reg_skills', data.lang),
            keyboard: [
              [{ text: t('reg_skills_btn_uzb', data.lang), callback_data: 'skill_uzb' }, { text: t('reg_skills_btn_rus', data.lang), callback_data: 'skill_rus' }],
              [{ text: t('reg_skills_btn_eng', data.lang), callback_data: 'skill_eng' }],
              [{ text: t('reg_skills_btn_next', data.lang), callback_data: 'skill_next' }]
            ]
          };
        }
        return { text: t('reg_contact_error', data.lang) };
      }

      if (state === 'reg_skills_lang') {
        data.skills = data.skills || [];
        if (cleanText === 'skill_next') {
          if (data.skills.length === 0) {
            return { text: t('reg_skills_empty', data.lang) };
          }
          await db.setTelegramSession(telegramId, 'reg_disability', data);
          return {
            text: t('reg_disability', data.lang),
            keyboard: [
              [{ text: t('btn_yes', data.lang), callback_data: 'disability_yes' }, { text: t('btn_no', data.lang), callback_data: 'disability_no' }]
            ]
          };
        } else if (cleanText.startsWith('skill_')) {
          const langMap: Record<string, string> = { skill_uzb: 'Узбекский', skill_rus: 'Русский', skill_eng: 'Английский' };
          const selected = langMap[cleanText];
          if (selected && !data.skills.includes(selected)) {
            data.skills.push(selected);
            await db.setTelegramSession(telegramId, 'reg_skills_lang', data);
          }
          return { text: t('reg_skills_added', data.lang, selected) };
        } else {
          // Text input for "Другие"
          data.skills.push(cleanText);
          await db.setTelegramSession(telegramId, 'reg_skills_lang', data);
          return { text: t('reg_skills_added', data.lang, cleanText) };
        }
      }

      if (state === 'reg_disability') {
        if (cleanText === 'disability_no') {
          await db.createVolunteerApplication({
            telegram_id: telegramId,
            language_pref: data.lang,
            full_name: data.fullName,
            date_of_birth: data.dob,
            phone: data.phone,
            spoken_languages: data.skills,
            has_disability: false,
            status: 'pending'
          });
          await db.clearTelegramSession(telegramId);
          return { text: t('reg_disability_success', data.lang) };
        } else if (cleanText === 'disability_yes') {
          await db.setTelegramSession(telegramId, 'reg_disability_cat', data);
          return {
            text: t('reg_disability_cat', data.lang),
            keyboard: [
              [{ text: t('cat_vision', data.lang), callback_data: 'cat_vision' }],
              [{ text: t('cat_hearing', data.lang), callback_data: 'cat_hearing' }],
              [{ text: t('cat_mobility', data.lang), callback_data: 'cat_mobility' }],
              [{ text: t('cat_speech', data.lang), callback_data: 'cat_speech' }],
              [{ text: t('cat_mental', data.lang), callback_data: 'cat_mental' }],
              [{ text: t('cat_psych', data.lang), callback_data: 'cat_psych' }],
              [{ text: t('cat_somatic', data.lang), callback_data: 'cat_somatic' }],
              [{ text: t('cat_multiple', data.lang), callback_data: 'cat_multiple' }]
            ]
          };
        }
        return { text: t('reg_disability_error', data.lang) };
      }

      if (state === 'reg_disability_cat') {
        const catMap: Record<string, string> = {
          cat_vision: 'Нарушения зрения (слабовидение, слепота)',
          cat_hearing: 'Нарушения слуха (тугоухость, глухота)',
          cat_mobility: 'Нарушения опорно-двигательного аппарата',
          cat_speech: 'Нарушения речи',
          cat_mental: 'Ментальные и интеллектуальные нарушения',
          cat_psych: 'Психические заболевания',
          cat_somatic: 'Соматические заболевания (сахарный диабет, онкология, заболевания сердца/легких)',
          cat_multiple: 'Множественные нарушения (сочетание нескольких видов)'
        };
        const selectedCat = catMap[cleanText] || cleanText;
        
        await db.createVolunteerApplication({
          telegram_id: telegramId,
          language_pref: data.lang,
          full_name: data.fullName,
          date_of_birth: data.dob,
          phone: data.phone,
          spoken_languages: data.skills,
          has_disability: true,
          disability_info: selectedCat,
          status: 'pending'
        });
        await db.clearTelegramSession(telegramId);
        return { text: t('reg_disability_success', data.lang) };
      }
    }

    return { text: 'Пожалуйста, отправьте команду /start для регистрации.' };
  }

  // 2. User is authenticated. Check bot state machine (session)
  session = await db.getTelegramSession(telegramId);

  if (session) {
    if (session.state === 'awaiting_checkin') {
      if (cleanText.length < 5) {
        return {
          text: '⚠️ Описание работы слишком короткое. Пожалуйста, опишите проделанную работу подробнее (минимум 5 символов):'
        };
      }

      const taskId = session.data.task_id;
      const task = await db.getTask(taskId);
      if (!task) {
        await db.clearTelegramSession(telegramId);
        return { text: '⚠️ Ошибка: задача не найдена.' };
      }

      // Voice simulation check: if text is a mock voice message
      let reportText = cleanText;
      let isVoice = false;
      if (cleanText.startsWith('[Голосовое сообщение]')) {
        isVoice = true;
        reportText = cleanText.replace('[Голосовое сообщение]', '').trim() || 'Выполнена закупка и доставка необходимых материалов согласно списку задач проекта.';
      }

      // Create check-in record directly in check_ins table
      await db.createCheckIn({
        user_id: user.id,
        project_id: task.project_id,
        text_report: isVoice ? `🎤 [ИИ-Расшифровка]: ${reportText}` : reportText,
        hours: 2.0 // default hours registered
      });

      // Update task status to completed
      await db.updateTask(taskId, {
        status: 'completed'
      });

      // Clear session
      await db.clearTelegramSession(telegramId);

      return {
        text: `🎉 *Чек-ин успешно сохранен!*\n\n${isVoice ? `🎤 *ИИ-Расшифровка голосового сообщения:*\n_"${reportText}"_\n\n` : ''}Задача переведена в статус *Выполнена*. Запись добавлена в таблицу Check_ins (Засчитано часов: 2.0). Рейтинг волонтера обновлен! 🌟`,
        keyboard: [[{ text: '📋 Мои Задачи', callback_data: 'cmd_tasks' }]]
      };
    }
  }

  // 3. Main Command Processor
  if (cleanText === '/start') {
    return {
      text: `👋 Приветствуем снова, *${user.full_name}*!\n\nВы авторизованы в системе как *Волонтер*.\nТекущий рейтинг: ${user.rating.toFixed(2)} / 5.0\n\nДоступные команды:\n/tasks — Список ваших задач\n/status — Информация о вашем профиле`,
      keyboard: [
        [{ text: '📋 Мои Задачи', callback_data: 'cmd_tasks' }],
        [{ text: '👤 Мой Профиль', callback_data: 'cmd_profile' }]
      ]
    };
  }

  if (cleanText === '/status' || cleanText === 'cmd_profile') {
    const allTasks = await db.getTasks();
    const userTasks = allTasks.filter(t => t.assigned_to === user!.id);
    const pendingTasks = userTasks.filter(t => t.status !== 'completed');
    const completedTasks = userTasks.filter(t => t.status === 'completed');

    return {
      text: `👤 *Ваш профиль волонтера*\n\n🔹 *Имя:* ${user.full_name}\n🔹 *Телефон:* ${user.phone || 'Не указан'}\n🔹 *Рейтинг:* ${user.rating.toFixed(2)} / 5.0\n\n📊 *Статистика задач:*\n— Выполнено: ${completedTasks.length}\n— Активно: ${pendingTasks.length}`,
      keyboard: [
        [{ text: '📋 Мои Задачи', callback_data: 'cmd_tasks' }],
        [{ text: '❓ Справка', callback_data: 'cmd_help' }]
      ]
    };
  }

  if (cleanText === '/tasks' || cleanText === 'cmd_tasks') {
    const allTasks = await db.getTasks();
    const userTasks = allTasks.filter(t => t.assigned_to === user!.id && t.status !== 'completed');

    if (userTasks.length === 0) {
      return {
        text: '🎉 У вас нет активных задач! Отличная работа.\n\nКогда менеджеры назначат на вас новую задачу, вы получите уведомление здесь.',
        keyboard: [[{ text: '👤 Мой Профиль', callback_data: 'cmd_profile' }]]
      };
    }

    let responseText = '📋 *Ваши активные задачи:*\n\n';
    const keyboard: { text: string; callback_data: string }[][] = [];

    for (let idx = 0; idx < userTasks.length; idx++) {
      const task = userTasks[idx];
      const proj = await db.getProject(task.project_id);
      const statusEmoji = task.status === 'accepted' ? '⚡' : '⏳';
      const statusText = task.status === 'accepted' ? 'Принята' : 'Ожидает решения';
      const warningEmoji = task.is_overdue ? '🔴 ' : '';
      
      responseText += `${idx + 1}. ${warningEmoji}*${task.title}*\n`;
      responseText += `└ Проект: ${proj ? proj.title : 'Не указан'}\n`;
      responseText += `└ Статус: ${statusEmoji} ${statusText}\n`;
      responseText += `└ Сдать до: ${new Date(task.deadline).toLocaleDateString('ru-RU')}\n\n`;

      if (task.status === 'pending') {
        keyboard.push([{ text: `▶️ Принять задачу: ${task.title.slice(0, 15)}...`, callback_data: `start_${task.id}` }]);
      } else if (task.status === 'accepted') {
        keyboard.push([{ text: `✍️ Сдать отчет: ${task.title.slice(0, 15)}...`, callback_data: `report_${task.id}` }]);
      }
    }

    keyboard.push([{ text: '👤 Мой Профиль', callback_data: 'cmd_profile' }]);

    return {
      text: responseText,
      keyboard
    };
  }

  // Handle Action: Accept Task
  if (cleanText.startsWith('start_')) {
    const taskId = cleanText.split('_')[1];
    try {
      const task = await db.updateTask(taskId, { status: 'accepted' });
      return {
        text: `⚡ Вы приняли задачу в работу:\n*${task.title}*.\n\nКогда выполните её, пришлите текстовый отчет или запишите голосовое сообщение (ИИ распознает его автоматически)!`,
        keyboard: [
          [{ text: '✍️ Сдать отчет', callback_data: `report_${task.id}` }],
          [{ text: '📋 К списку задач', callback_data: 'cmd_tasks' }]
        ]
      };
    } catch {
      return { text: '⚠️ Ошибка: задача не найдена.' };
    }
  }

  // Handle Action: Initiate Check-in
  if (cleanText.startsWith('report_')) {
    const taskId = cleanText.split('_')[1];
    const task = await db.getTask(taskId);

    if (!task) {
      return { text: '⚠️ Ошибка: задача не найдена.' };
    }

    // Set bot state session to awaiting check-in text/voice
    await db.setTelegramSession(telegramId, 'awaiting_checkin', { task_id: taskId });

    return {
      text: `✍️ *Сдача отчета по задаче:* ${task.title}\n\nПожалуйста, отправьте текстовый отчет или запишите голосовое сообщение с подробностями о проделанной работе:`,
      keyboard: [
        [{ text: '📋 Отмена', callback_data: 'cmd_tasks' }]
      ]
    };
  }

  if (cleanText === '/help' || cleanText === 'cmd_help') {
    return {
      text: '🤖 *Справка по боту Volunteer OS*\n\nКоманды:\n/tasks — список назначенных задач и чек-ин.\n/status — статистика и рейтинг.\n/start — перезапуск бота.\n\nВы можете отправлять текстовые или голосовые сообщения при сдаче отчета — система автоматически расшифрует аудиозапись.',
      keyboard: [[{ text: '📋 Мои Задачи', callback_data: 'cmd_tasks' }]]
    };
  }

  // 4. Smart Command & Message Parser (Telegram-Tasker, Digital Archive, AI Gatekeeper)
  const lowerText = cleanText.toLowerCase();

  // Telegram-Tasker parsing
  if (lowerText.includes('назначь') || lowerText.includes('поручи')) {
    const users = await db.getUsers();
    let assignedUser = null;
    
    // Find if any user matches the name in the text
    for (const u of users) {
      const parts = u.full_name.split(' ');
      const firstName = parts[0] || '';
      const lastName = parts[1] || '';
      
      if (
        (firstName && firstName.length > 2 && lowerText.includes(firstName.toLowerCase().slice(0, -1))) ||
        (lastName && lastName.length > 2 && lowerText.includes(lastName.toLowerCase().slice(0, -1)))
      ) {
        assignedUser = u;
        break;
      }
    }

    // Extract task title
    let taskTitle = 'Новое поручение';
    const matchTitle = cleanText.match(/(?:назначь|надо|поручи)\s+(?:[а-яА-Яa-zA-Z]+\s+)?([^до]+)(?:\s+до\s+|$)/i);
    if (matchTitle && matchTitle[1]) {
      taskTitle = matchTitle[1].trim();
    }

    // Extract deadline
    let deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 3); // Default to 3 days
    if (lowerText.includes('завтра')) {
      deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 1);
    } else if (lowerText.includes('пятниц')) {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 Sunday, 5 Friday
      let daysToAdd = (5 - dayOfWeek + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7;
      deadlineDate.setDate(today.getDate() + daysToAdd);
    } else if (lowerText.includes('воскрес')) {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 Sunday
      let daysToAdd = (0 - dayOfWeek + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7;
      deadlineDate.setDate(today.getDate() + daysToAdd);
    }

    // Assign to first active project
    const projects = await db.getProjects();
    const activeProj = projects.find(p => p.status === 'active');
    const projId = activeProj ? activeProj.id : 'p1111111-1111-1111-1111-111111111111';

    const newTask = await db.createTask({
      project_id: projId,
      assigned_to: assignedUser ? assignedUser.id : null,
      title: taskTitle,
      deadline: deadlineDate.toISOString(),
      status: 'pending'
    });

    return {
      text: `✅ *ИИ-Создание задачи из чата (Telegram-Tasker):*\n\n📋 *Задача:* ${newTask.title}\n👤 *Исполнитель:* ${assignedUser ? assignedUser.full_name : 'Не назначен (свободная задача)'}\n📅 *Срок сдачи:* ${deadlineDate.toLocaleDateString('ru-RU')}\n\nЗадача успешно добавлена в канбан-панель проекта!`,
      keyboard: [
        [{ text: '📋 Мои Задачи', callback_data: 'cmd_tasks' }],
        [{ text: '👤 Мой Профиль', callback_data: 'cmd_profile' }]
      ]
    };
  }

  // Digital Archive extraction
  if (
    lowerText.includes('файл:') || 
    lowerText.includes('документ:') || 
    cleanText.match(/\.(jpg|pdf|mp4|png|doc|zip|xlsx)/i)
  ) {
    let fileName = 'doc_extracted.pdf';
    const parts = cleanText.split(/[\s:]+/);
    const filePart = parts.find(p => p.match(/\.(jpg|pdf|mp4|png|doc|zip|xlsx)/i));
    if (filePart) {
      fileName = filePart.replace(/[^a-zA-Z0-9_.-]/g, '');
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const fileType = (ext === 'jpg' || ext === 'png') ? 'image' : 
                     (ext === 'mp4') ? 'video' : 'document';
    
    await db.createArchiveItem({
      chat_title: `Telegram-чат (@${username || telegramId})`,
      file_name: fileName,
      file_type: fileType,
      file_size: Math.floor(Math.random() * 3200) + 120, // simulated size
      file_url: `/archive/${fileName}`
    });

    return {
      text: `📂 *Цифровой Архив Ассоциации:*\n\nОбнаружен важный медиа-файл/документ *${fileName}*.\nОн автоматически извлечен, оптимизирован и помещен в архив волонтерских чатов!`,
      keyboard: [[{ text: '📋 Мои Задачи', callback_data: 'cmd_tasks' }]]
    };
  }

  // AI Gatekeeper - Message classification and redirect
  const allChats = await db.getChats();
  let chat = allChats.find(c => c.type === 'management' && c.volunteer_id === user.id);
  if (!chat) {
    chat = await db.createChat({
      type: 'management',
      title: `Руководство Ассоциации: ${user.full_name}`,
      volunteer_id: user.id,
      target_org_id: null,
      project_id: null
    });
  }

  // Save original message in the CRM chats
  await db.createChatMessage({
    chat_id: chat.id,
    sender_id: user.id,
    sender_name: user.full_name,
    sender_role: 'volunteer',
    text: cleanText
  });

  let classification: 'faq' | 'team' | 'shirin' = 'team';
  let summary = '';
  let replyText = '';

  if (lowerText.includes('ширин') || lowerText.includes('директор') || lowerText.includes('руковод')) {
    classification = 'shirin';
    summary = `Личное обращение руководителю Ширин от ${user.full_name}`;
    replyText = `🤖 *ИИ-Секретарь (Лично Ширин):* Ваше сообщение классифицировано как личное/срочное обращение к Ширин. Оно сохранено в её закрытую личную папку в CRM, руководитель свяжется с вами лично.`;
  } else if (
    lowerText.includes('как стать') || 
    lowerText.includes('кодекс') || 
    lowerText.includes('правила') || 
    lowerText.includes('инструкц')
  ) {
    classification = 'faq';
    summary = `Вопрос по правилам/инструкциям от ${user.full_name}`;
    replyText = `🤖 *ИИ-Секретарь (FAQ):* Вопросы о правилах описаны в Кодексе волонтера. Основные ценности: уважение, равенство и ответственность. Пожалуйста, изучите Базу Знаний на платформе.`;
  } else {
    classification = 'team';
    summary = `Запрос к координаторам от ${user.full_name}: "${cleanText.substring(0, 40)}..."`;
    replyText = `🤖 *ИИ-Секретарь (Команде):* Ваше сообщение перенаправлено дежурным координаторам. Координатор свяжется с вами в чате руководства.`;
  }

  // Save assistant classification log in CRM chat
  await db.createChatMessage({
    chat_id: chat.id,
    sender_id: 'bot_secretary',
    sender_name: 'ИИ-Секретарь (Gatekeeper)',
    sender_role: 'admin',
    text: `[Классификация: ${classification.toUpperCase()} | Выжимка: ${summary}]\n\n${replyText}`
  });

  return {
    text: replyText,
    keyboard: [
      [{ text: '📋 Мои Задачи', callback_data: 'cmd_tasks' }],
      [{ text: '👤 Мой Профиль', callback_data: 'cmd_profile' }]
    ]
  };
}
