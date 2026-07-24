import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { hashPassword } from '@/lib/security';
import { sendTelegramMessage } from '@/lib/telegram-api';
import { waitUntil } from '@vercel/functions';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const application = await db.updateVolunteerApplication(id, { status });

    // If approved, create the user if not exists
    if (status === 'approved') {
      const existingUser = await db.getUserByTelegramId(Number(application.telegram_id));
      if (!existingUser) {
        const generatedLogin = `vol_${application.telegram_id.toString().slice(-6)}`;
        const plainPassword = crypto.randomBytes(4).toString('hex'); // 8 characters
        
        await db.createUser({
          telegram_id: Number(application.telegram_id),
          full_name: application.full_name,
          phone: application.phone || '',
          role: 'volunteer',
          login: generatedLogin,
          password_hash: hashPassword(plainPassword)
        });
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://volunteer-os-zeta.vercel.app';
        const autoLoginLink = `${appUrl}/api/auth/auto-login?login=${encodeURIComponent(generatedLogin)}&pass=${encodeURIComponent(plainPassword)}`;
        const messageText = `🎉 *Добро пожаловать, ${application.full_name}!* Ваш профиль волонтера успешно создан.

🚀 *Вход на сайт в 1 клик (без ввода логина и пароля):*
${autoLoginLink}

---
Или войдите вручную:
🌐 Сайт: ${appUrl}/login?role=volunteer
👤 Логин: <code>${generatedLogin}</code>
🔑 Пароль: <code>${plainPassword}</code>

Отправьте /tasks в этом боте для просмотра ваших задач!`;
        
        await sendTelegramMessage(Number(application.telegram_id), messageText, undefined, 'HTML').catch(console.error);

        return NextResponse.json({ ...application, generatedPassword: plainPassword, generatedLogin });
      } else {
        // User already exists, but application was just approved
        await sendTelegramMessage(
          Number(application.telegram_id), 
          `🎉 Ваша заявка одобрена! Ваш аккаунт уже существует, вы можете войти в систему.`
        ).catch(console.error);
      }
    } else if (status === 'rejected') {
      await sendTelegramMessage(
        Number(application.telegram_id), 
        `К сожалению, ваша заявка была отклонена. Если у вас есть вопросы, свяжитесь с координатором.`
      ).catch(console.error);
    }

    return NextResponse.json(application);
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
