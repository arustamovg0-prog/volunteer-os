import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';
import { isWithinRadius } from '@/lib/geo';

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { project_id, lat, lng } = body;
    const user_id = auth.session.role === 'volunteer' ? auth.session.userId : body.user_id;

    if (!user_id || !project_id || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'User ID, project ID, and coordinates are required' }, { status: 400 });
    }

    // 1. Validate Project and Distance
    const project = await db.getProject(project_id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.latitude && project.longitude) {
      const allowedRadius = (project as any).allowedRadiusKm || 0.5; // fallback to 500m
      const { valid, distanceKm } = isWithinRadius(lat, lng, project.latitude, project.longitude, allowedRadius);
      if (!valid) {
        return NextResponse.json({ 
          error: `Слишком далеко. Ваша дистанция: ${(distanceKm * 1000).toFixed(0)}м. Разрешенный радиус: ${allowedRadius * 1000}м.` 
        }, { status: 403 });
      }
    }

    // 2. Check if already checked in and not checked out
    const allCheckIns = await db.getCheckIns();
    const activeCheckIn = allCheckIns.find(c => c.user_id === user_id && c.project_id === project_id && !c.check_out_at);
    
    if (activeCheckIn) {
      return NextResponse.json({ error: 'У вас уже есть активная смена на этом проекте' }, { status: 400 });
    }

    // 3. Create Check-in record
    const newCheckIn = await db.createCheckIn({
      user_id,
      project_id,
      check_in_at: new Date().toISOString(),
      check_in_lat: lat,
      check_in_lng: lng
    });

    return NextResponse.json(newCheckIn, { status: 201 });
  } catch (error) {
    console.error('Failed to start check-in:', error);
    return NextResponse.json({ error: 'Failed to start check-in' }, { status: 500 });
  }
}
