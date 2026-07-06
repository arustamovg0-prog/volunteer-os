import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram-api';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const userId = auth.session.role === 'volunteer' ? auth.session.userId : searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    let checkins = await db.getCheckIns();

    if (userId) {
      checkins = checkins.filter(c => c.user_id === userId);
    }

    if (projectId) {
      checkins = checkins.filter(c => c.project_id === projectId);
    }

    // Sort by created date descending
    checkins.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(checkins);
  } catch (error) {
    console.error('Failed to fetch check-ins:', error);
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { project_id, text_report, hours } = body;
    const user_id = auth.session.role === 'volunteer' ? auth.session.userId : body.user_id;

    if (!user_id || !text_report || hours === undefined) {
      return NextResponse.json({ error: 'User ID, report text, and hours are required' }, { status: 400 });
    }

    const newCheckIn = await db.createCheckIn({
      user_id,
      project_id: project_id || null,
      text_report,
      hours: Number(hours)
    });

    // Reward volunteer with XP (15 XP per hour of work)
    try {
      await db.addXpToVolunteer(user_id, Math.round(Number(hours) * 15));
    } catch (e) {
      console.error('Failed to reward XP for check-in:', e);
    }

    return NextResponse.json(newCheckIn, { status: 201 });
  } catch (error) {
    console.error('Failed to create check-in:', error);
    return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { checkInId, kpi_score, feedback } = body;
    const reviewed_by = auth.session.userId;

    if (!checkInId || kpi_score === undefined || !reviewed_by) {
      return NextResponse.json({ error: 'CheckIn ID, KPI score, and reviewer are required' }, { status: 400 });
    }

    const scoreNum = Number(kpi_score);
    if (scoreNum < 1 || scoreNum > 5) {
      return NextResponse.json({ error: 'KPI score must be between 1 and 5' }, { status: 400 });
    }

    // 1. Update Check-in
    const updatedCheckIn = await db.updateCheckIn(checkInId, {
      kpi_score: scoreNum,
      feedback: feedback || '',
      reviewed_by,
      reviewed_at: new Date().toISOString()
    });

    const volunteerId = updatedCheckIn.user_id;
    const volunteer = await db.getUser(volunteerId);

    if (volunteer) {
      // 2. Award XP based on rating score
      let xpReward = 10;
      if (scoreNum === 5) xpReward = 50;
      else if (scoreNum === 4) xpReward = 30;
      else if (scoreNum === 3) xpReward = 15;
      
      await db.addXpToVolunteer(volunteerId, xpReward);

      // 3. Recalculate average rating of the volunteer
      const volunteerCheckIns = (await db.getCheckIns()).filter(c => c.user_id === volunteerId);
      const gradedCheckIns = volunteerCheckIns.filter(c => c.kpi_score !== undefined && c.kpi_score !== null);
      if (gradedCheckIns.length > 0) {
        const totalScore = gradedCheckIns.reduce((sum, c) => sum + (c.kpi_score || 0), 0);
        const averageRating = Math.round((totalScore / gradedCheckIns.length) * 100) / 100;
        await db.updateUser(volunteerId, { rating: averageRating });
      }

      // 4. Send Simulated/Real Telegram Bot notification
      if (volunteer.telegram_id) {
        const checkinText = `⭐️ *ОТЧЕТ ОЦЕНЕН КООРДИНАТОРОМ!* ⭐️\n\nВаш отчет о проделанной работе был проверен.\n\n📊 *KPI Оценка:* ${'★'.repeat(scoreNum)} (${scoreNum}/5)\n💬 *Отзыв:* ${feedback || 'Нет комментария.'}\n🎁 *Награда:* +${xpReward} XP\n\nСпасибо за ваш вклад!`;
        sendTelegramMessage(volunteer.telegram_id, checkinText);
      }
    }

    return NextResponse.json({ success: true, checkIn: updatedCheckIn });
  } catch (error) {
    console.error('Failed to grade check-in:', error);
    return NextResponse.json({ error: 'Failed to grade check-in' }, { status: 500 });
  }
}
