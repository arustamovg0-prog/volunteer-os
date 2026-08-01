import { NextRequest, NextResponse } from 'next/server';
import { db, prisma } from '@/lib/db';
import { requirePrivilegedRequest } from '@/lib/security';
import { sendTelegramMessage, TelegramButton } from '@/lib/telegram-api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requirePrivilegedRequest(req, ['admin', 'manager']);
    if (authError) return authError;

    const { id: projectId } = await params;
    const project = await db.getProject(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    let customText: string | undefined;
    let includeButtons = false;
    let attachment: { buffer: Buffer; fileName: string; fileType: string } | undefined = undefined;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      customText = (formData.get('customText') as string) || undefined;
      includeButtons = formData.get('includeButtons') === 'true';

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        attachment = {
          buffer: Buffer.from(arrayBuffer),
          fileName: file.name,
          fileType: file.type || 'application/octet-stream'
        };
      }
    } else {
      const body = await req.json().catch(() => ({}));
      customText = body.customText;
      includeButtons = body.includeButtons === true;
    }

    // Find all active volunteers with telegram ID
    const volunteers = await prisma.user.findMany({
      where: {
        role: 'volunteer',
        telegramId: { not: null }
      },
      select: {
        id: true,
        telegramId: true,
        fullName: true
      }
    });

    if (volunteers.length === 0) {
      return NextResponse.json({ error: 'Нет волонтеров с привязанным Telegram' }, { status: 400 });
    }

    // Default invitation text if customText is not provided
    const defaultText = `Assalomu alaykum, aziz volontyor! 🩺\n\n🎉 Sizni "${project.title}" loyihasi/tadbiri ishtirokchilari safida ko‘rishdan mamnun bo‘lamiz!\n\n${project.description || ''}\n\nIltimos, ushbu botdagi xabarlarni kuzatib boring.\n\n───────────────────────────\n\nЗдравствуйте, дорогой волонтёр! 🩺\n\n🎉 Будем рады видеть вас среди участников проекта "${project.title}"!\n\n${project.description || ''}\n\nПожалуйста, следите за сообщениями в данном боте.`;

    const textToSend = (customText && typeof customText === 'string' && customText.trim().length > 0)
      ? customText.trim()
      : defaultText;

    const keyboard: TelegramButton[][] | undefined = includeButtons ? [
      [{ text: '✅ Да, буду участвовать', callback_data: `rsvp_yes_${project.id}` }],
      [{ text: '❌ Не смогу', callback_data: `rsvp_no_${project.id}` }]
    ] : undefined;

    let successCount = 0;
    const sendPromises = volunteers.map(async (v) => {
      if (!v.telegramId) return;
      const ok = await sendTelegramMessage(Number(v.telegramId), textToSend, keyboard, 'Markdown', attachment);
      if (ok) successCount++;
    });

    await Promise.all(sendPromises);

    return NextResponse.json({
      success: true,
      count: successCount,
      total: volunteers.length
    });
  } catch (error) {
    console.error('RSVP Invite error:', error);
    return NextResponse.json({ error: 'Ошибка отправки приглашений' }, { status: 500 });
  }
}
