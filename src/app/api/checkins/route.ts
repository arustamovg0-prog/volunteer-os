import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram-api';
import { requireSessionRequest } from '@/lib/security';

// Haversine formula to calculate distance in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

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

    // Find if there is an active check-in (geofenced) for this project/user
    const activeCheckIn = checkins.find(c => c.status === 'pending' && !c.check_out_at);

    return NextResponse.json({ checkins, activeCheckIn });
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
    const { action, project_id, text_report, hours, lat, lng } = body;
    const user_id = auth.session.role === 'volunteer' ? auth.session.userId : body.user_id;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // --- NEW GEOFENCED CHECK-IN LOGIC ---
    if (action === 'checkin' || action === 'checkout') {
      if (!project_id || lat === undefined || lng === undefined) {
        return NextResponse.json({ error: 'project_id, lat, and lng are required for geofenced operations' }, { status: 400 });
      }

      if (action === 'checkin') {
        // 1. Get Project
        const project = await db.project.findUnique({
          where: { id: project_id },
          select: { latitude: true, longitude: true, allowedRadiusKm: true }
        });

        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        if (project.latitude === null || project.longitude === null) {
          return NextResponse.json({ error: 'У проекта не заданы координаты.' }, { status: 400 });
        }

        // 2. Validate distance
        const distance = getDistanceFromLatLonInKm(lat, lng, project.latitude, project.longitude);
        const allowedRadius = project.allowedRadiusKm || 0.5;

        if (distance > allowedRadius) {
          // Log the failed check-in attempt
          try {
            await db.checkIn.create({
              data: {
                userId: user_id,
                projectId: project_id,
                checkInLat: lat,
                checkInLng: lng,
                status: 'rejected',
                feedback: `Geofence block: ${Math.round(distance * 1000)}m (max ${allowedRadius * 1000}m)`
              }
            });
          } catch (e) {
            console.error('Failed to log blocked check-in', e);
          }

          return NextResponse.json({ 
            error: `Вы находитесь слишком далеко. Допустимый радиус: ${allowedRadius * 1000}м, дистанция: ${Math.round(distance * 1000)}м` 
          }, { status: 400 });
        }

        // 3. Create CheckIn (pending checkout)
        // db.createCheckIn is customized, so we use direct prisma call to allow null hours and text
        const checkin = await db.checkIn.create({
          data: {
            userId: user_id,
            projectId: project_id,
            checkInLat: lat,
            checkInLng: lng,
            status: 'pending'
          }
        });
        return NextResponse.json(checkin, { status: 201 });
      }

      if (action === 'checkout') {
        // Find active checkin
        const checkin = await db.checkIn.findFirst({
          where: { userId: user_id, projectId: project_id, checkOutAt: null }
        });

        if (!checkin) {
          return NextResponse.json({ error: 'Активный чекин не найден' }, { status: 404 });
        }

        const now = new Date();
        const diffMs = now.getTime() - checkin.checkInAt.getTime();
        const calculatedHours = diffMs / (1000 * 60 * 60);

        const updated = await db.checkIn.update({
          where: { id: checkin.id },
          data: {
            checkOutAt: now,
            checkOutLat: lat,
            checkOutLng: lng,
            hours: parseFloat(calculatedHours.toFixed(2)),
            textReport: text_report || 'Отчет о смене'
          }
        });

        // Reward XP
        try {
          await db.addXpToVolunteer(user_id, Math.round(Number(updated.hours) * 15));
        } catch (e) { console.error(e); }

        return NextResponse.json(updated, { status: 200 });
      }
    }

    // --- OLD MANUAL REPORT LOGIC (Fallback) ---
    if (!text_report || hours === undefined) {
      return NextResponse.json({ error: 'report text and hours are required' }, { status: 400 });
    }

    const newCheckIn = await db.createCheckIn({
      user_id,
      project_id: project_id || null,
      text_report,
      hours: Number(hours)
    });

    try {
      await db.addXpToVolunteer(user_id, Math.round(Number(hours) * 15));
    } catch (e) {
      console.error('Failed to reward XP for check-in:', e);
    }

    return NextResponse.json(newCheckIn, { status: 201 });
  } catch (error) {
    console.error('Failed to process check-in:', error);
    return NextResponse.json({ error: 'Failed to process check-in' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { checkInId, kpi_score, feedback, status } = body;
    const reviewed_by = auth.session.userId;

    if (!checkInId || !reviewed_by) {
      return NextResponse.json({ error: 'CheckIn ID and reviewer are required' }, { status: 400 });
    }

    const scoreNum = Number(kpi_score);
    if (scoreNum < 1 || scoreNum > 5) {
      return NextResponse.json({ error: 'KPI score must be between 1 and 5' }, { status: 400 });
    }

    const updateData: any = {
      feedback: feedback || '',
      reviewed_by,
      reviewed_at: new Date().toISOString()
    };

    if (kpi_score !== undefined) {
      updateData.kpi_score = scoreNum;
    }
    
    if (status) {
      updateData.status = status;
    }

    // 1. Update Check-in
    const updatedCheckIn = await db.updateCheckIn(checkInId, updateData);

    const volunteerId = updatedCheckIn.user_id;
    const volunteer = await db.getUser(volunteerId);

    if (volunteer) {
      if (status === 'rejected') {
        if (volunteer.telegram_id) {
          const checkinText = `❌ *ОТЧЕТ ОТКЛОНЕН КООРДИНАТОРОМ!* ❌\n\nВаш отчет о проделанной работе был отклонен.\n\n💬 *Причина:* ${feedback || 'Нет комментария.'}\n\nПожалуйста, свяжитесь с координатором или переделайте отчет.`;
          sendTelegramMessage(volunteer.telegram_id, checkinText);
        }
      } else if (kpi_score !== undefined) {
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
    }

    return NextResponse.json({ success: true, checkIn: updatedCheckIn });
  } catch (error) {
    console.error('Failed to grade check-in:', error);
    return NextResponse.json({ error: 'Failed to grade check-in' }, { status: 500 });
  }
}
