import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import PDFDocument from 'pdfkit';
import { requireSessionRequest } from '@/lib/security';

/**
 * Generates a PDF certificate for a volunteer.
 */
function generateCertificate(user: any, hours: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Landscape A4
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Fonts (ensure these paths exist on the deployment environment)
      doc.registerFont('Arial', '/System/Library/Fonts/Supplemental/Arial.ttf');
      doc.registerFont('Arial-Bold', '/System/Library/Fonts/Supplemental/Arial Bold.ttf');

      // Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#10b981');
      doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).stroke('#059669');

      // Title
      doc.moveDown(3);
      doc.font('Arial-Bold').fontSize(42).fillColor('#064e3b').text('СЕРТИФИКАТ', { align: 'center' });
      doc.font('Arial').fontSize(24).text('О ВЫДАЮЩИХСЯ ЗАСЛУГАХ', { align: 'center' });
      doc.moveDown(2);

      // Subtitle
      doc.font('Arial').fontSize(16).fillColor('#333333').text('Настоящий сертификат подтверждает, что', { align: 'center' });
      doc.moveDown(1);

      // Name
      doc.font('Arial-Bold').fontSize(36).fillColor('#111827').text(user.full_name || 'Волонтер', { align: 'center' });
      doc.moveDown(1);

      // Body
      const textX = (doc.page.width - 600) / 2;
      doc.font('Arial').fontSize(16).fillColor('#333333').text(
        `успешно отработал(а) более 100 часов (всего: ${hours} ч.) на благо общества в рамках программы "Volunteer OS".`,
        textX,
        doc.y,
        { align: 'center', width: 600 }
      );
      doc.moveDown(3);

      // Signature & Date
      const dateStr = new Date().toLocaleDateString('ru-RU');
      doc.font('Arial-Bold').fontSize(14).text('Директор Ассоциации', 100, doc.page.height - 150);
      doc.font('Arial').fontSize(12).text('_______________ / Подпись /', 100, doc.page.height - 120);

      doc.font('Arial-Bold').fontSize(14).text('Дата выдачи', doc.page.width - 250, doc.page.height - 150);
      doc.font('Arial').fontSize(12).text(dateStr, doc.page.width - 250, doc.page.height - 120);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/** GET handler – returns the certificate PDF if the volunteer has >=100 hours */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager', 'volunteer']);
    if ('response' in auth) return auth.response;

    const { id: userId } = await params;
    const user = await db.getUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow admin/manager or the volunteer themselves to download
    if (auth.session.role === 'volunteer' && auth.session.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const checkins = await db.getCheckIns();
    const volunteerCheckins = checkins.filter((c: any) => c.user_id === userId);
    const hours = volunteerCheckins.reduce((sum: number, c: any) => sum + Number(c.hours), 0);

    if (hours < 100) {
      return NextResponse.json({ error: 'Certificate requires at least 100 hours of volunteering.' }, { status: 400 });
    }

    const pdfBuffer = await generateCertificate(user, hours);
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Certificate_${user.full_name.replace(/\s+/g, '_')}.pdf`,
      },
    });
  } catch (error) {
    console.error('Failed to generate certificate:', error);
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
}
