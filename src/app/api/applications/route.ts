import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as string | undefined;

    const applications = await db.getVolunteerApplications({ status });
    return NextResponse.json(applications);
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
