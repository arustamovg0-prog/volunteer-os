import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { hashPassword } from '@/lib/security';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
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
        
        // Let the application return with the plain password so the UI can optionally show it,
        // or we could send a Telegram message to the user here.
        // For simplicity, we just return the application, and another service (or this one) 
        // will notify the user via Telegram bot API.
        
        // We'll add the plain password to the response only once
        return NextResponse.json({ ...application, generatedPassword: plainPassword, generatedLogin });
      }
    }

    return NextResponse.json(application);
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
