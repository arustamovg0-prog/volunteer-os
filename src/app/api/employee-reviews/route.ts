import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const reviews = await db.getEmployeeReviews();
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { employee_name, kpi_score, feedback } = body;
    const created_by = auth.session.userId;

    if (!employee_name || kpi_score === undefined || !feedback || !created_by) {
      return NextResponse.json({ error: 'Missing required review fields' }, { status: 400 });
    }

    const newReview = await db.createEmployeeReview({
      employee_name,
      kpi_score: Number(kpi_score),
      feedback,
      created_by
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error('Failed to create review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
