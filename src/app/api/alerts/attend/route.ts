import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram-api';
import { requireSessionRequest } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { alertId } = body;
    const volunteerId = auth.session.role === 'volunteer' ? auth.session.userId : body.volunteerId;

    if (!alertId || !volunteerId) {
      return NextResponse.json({ error: 'Alert ID and Volunteer ID are required' }, { status: 400 });
    }

    const alerts = await db.getEmergencyAlerts();
    const alert = alerts.find(a => a.id === alertId);

    if (!alert) {
      return NextResponse.json({ error: 'Emergency alert not found' }, { status: 404 });
    }

    const attending = alert.attending_volunteer_ids || [];
    if (!attending.includes(volunteerId)) {
      attending.push(volunteerId);
    }

    // Update alert attendance in DB
    const updated = await db.updateEmergencyAlert(alertId, {
      attending_volunteer_ids: attending
    });

    // Notify simulator bot that user confirmed attendance
    const volunteer = await db.getUser(volunteerId);
    if (volunteer && volunteer.telegram_id) {
      await db.createMockMessage(
        volunteer.telegram_id,
        'user',
        `🚨 Я выехал на место сбора по тревоге: "${alert.title}"`
      );
      sendTelegramMessage(
        volunteer.telegram_id,
        `👍 Спасибо за быстрый отклик, *${volunteer.full_name}*! Координатор проинформирован. Пожалуйста, соблюдайте технику безопасности при выезде.`
      );
    }

    return NextResponse.json({ success: true, alert: updated });
  } catch (error) {
    console.error('Failed to register alert attendance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
