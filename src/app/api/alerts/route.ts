import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram-api';
import { requirePrivilegedRequest } from '@/lib/security';

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function GET(req: NextRequest) {
  try {
    const alerts = await db.getEmergencyAlerts();
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Failed to fetch emergency alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = requirePrivilegedRequest(req, ['admin', 'manager']);
    if (authError) return authError;

    const body = await req.json();
    const { title, description, latitude, longitude, required_skills, radius_km } = body;

    if (!title || !description || latitude === undefined || longitude === undefined || !required_skills || !radius_km) {
      return NextResponse.json({ error: 'Missing required alert fields' }, { status: 400 });
    }

    const latVal = Number(latitude);
    const lngVal = Number(longitude);
    const radVal = Number(radius_km);

    // 1. Find matched volunteers based on location radius and skills
    const volunteers = (await db.getUsers()).filter(u => u.role === 'volunteer');
    const notifiedIds: string[] = [];

    volunteers.forEach(v => {
      // Default positions if missing
      const vLat = v.latitude || 41.311;
      const vLng = v.longitude || 69.240;
      
      const distance = calculateDistance(latVal, lngVal, vLat, vLng);
      
      // Skill match check (possesses at least one of the required skills)
      const vSkills = v.skills || [];
      const hasSkill = required_skills.some((s: string) => vSkills.includes(s));

      if (distance <= radVal && hasSkill) {
        notifiedIds.push(v.id);

        // 2. Trigger simulated/real Telegram bot push notification for this volunteer
        if (v.telegram_id) {
          const alertText = `🚨 *ЭКСТРЕННЫЙ СБОР ПО ТРЕВОГЕ!* 🚨\n\n📢 *Тема:* ${title}\n📝 *Описание:* ${description}\n📍 *Расстояние:* ~${distance.toFixed(1)} км от вас\n🛠 *Необходимые навыки:* ${required_skills.join(', ')}\n\n⚠️ Пожалуйста, зайдите в Личный Кабинет волонтера и подтвердите выезд на место!`;
          sendTelegramMessage(v.telegram_id, alertText);
        }
      }
    });

    // 3. Save alert in DB
    const newAlert = await db.createEmergencyAlert({
      title,
      description,
      latitude: latVal,
      longitude: lngVal,
      required_skills,
      radius_km: radVal,
      notified_volunteer_ids: notifiedIds
    });

    return NextResponse.json({
      success: true,
      alert: newAlert,
      notifiedCount: notifiedIds.length
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create emergency alert:', error);
    return NextResponse.json({ error: 'Failed to create emergency alert' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authError = requirePrivilegedRequest(req, ['admin', 'manager']);
    if (authError) return authError;

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const updated = await db.updateEmergencyAlert(id, { status });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to resolve emergency alert:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
