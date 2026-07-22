import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { checkin_id, lat, lng, text_report } = body;
    const user_id = auth.session.role === 'volunteer' ? auth.session.userId : body.user_id;

    if (!checkin_id) {
      return NextResponse.json({ error: 'Check-in ID is required' }, { status: 400 });
    }

    const checkin = await db.getCheckIn(checkin_id);
    if (!checkin) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }

    if (checkin.user_id !== user_id && auth.session.role === 'volunteer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (checkin.check_out_at) {
      return NextResponse.json({ error: 'Already checked out' }, { status: 400 });
    }

    const checkOutAt = new Date();
    const checkInAt = new Date(checkin.check_in_at);
    
    // Calculate hours
    const diffMs = checkOutAt.getTime() - checkInAt.getTime();
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    const updated = await db.updateCheckIn(checkin_id, {
      check_out_at: checkOutAt.toISOString(),
      check_out_lat: lat,
      check_out_lng: lng,
      text_report: text_report || checkin.text_report,
      hours
    });

    // Award XP
    try {
      await db.addXpToVolunteer(user_id, Math.round(hours * 15));
    } catch (e) {
      console.error('Failed to reward XP for check-out:', e);
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Failed to end check-in:', error);
    return NextResponse.json({ error: 'Failed to end check-in' }, { status: 500 });
  }
}
