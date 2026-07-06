import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import PDFDocument from 'pdfkit';
import { requireSessionRequest } from '@/lib/security';

// Helper to convert PDF generation into a Promise
function generatePDFBuffer(checkins: any[], projects: any[], tasks: any[], users: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Register fonts with Cyrillic support (native macOS fonts)
      doc.registerFont('Arial', '/System/Library/Fonts/Supplemental/Arial.ttf');
      doc.registerFont('Arial-Bold', '/System/Library/Fonts/Supplemental/Arial Bold.ttf');

      // --- Header / Title Page ---
      doc.font('Arial-Bold').fontSize(16).text('МИНИСТЕРСТВО ЮСТИЦИИ РОССИЙСКОЙ ФЕДЕРАЦИИ', { align: 'center' });
      doc.fontSize(10).font('Arial').text('(ОТЧЕТ О ДЕЯТЕЛЬНОСТИ НЕКОММЕРЧЕСКОЙ ОРГАНИЗАЦИИ)', { align: 'center' });
      doc.moveDown(2);

      doc.font('Arial-Bold').fontSize(18).text('СВОДНЫЙ ОТЧЕТ АССОЦИАЦИИ ВОЛОНТЕРОВ', { align: 'center' });
      doc.fontSize(12).font('Arial-Bold').text(`"Volunteer OS — Операционная Платформа"`, { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(10).font('Arial').text(`Период отчета: за последний месяц (по состоянию на ${new Date().toLocaleDateString('ru-RU')})`, { align: 'center' });
      doc.moveDown(2);

      // --- Section 1: Summary Statistics ---
      doc.font('Arial-Bold').fontSize(14).text('1. Основные показатели деятельности', { underline: true });
      doc.moveDown(0.5);

      const activeProjects = projects.filter(p => p.status === 'active').length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const activeVolunteers = users.filter(u => u.role === 'volunteer').length;
      
      // Calculate average rating
      const volunteers = users.filter(u => u.role === 'volunteer');
      const avgRating = volunteers.reduce((acc, u) => acc + Number(u.rating), 0) / (volunteers.length || 1);
      const totalHours = checkins.reduce((acc, c) => acc + Number(c.hours), 0);

      doc.font('Arial').fontSize(11);
      doc.text(`• Количество зарегистрированных волонтеров в системе: ${activeVolunteers} чел.`);
      doc.text(`• Количество действующих социальных проектов: ${activeProjects} проектов.`);
      doc.text(`• Общее число успешно завершенных волонтерских задач: ${completedTasks} задач.`);
      doc.text(`• Суммарное отработанное время волонтерами (по чек-инам): ${totalHours.toFixed(1)} ч.`);
      doc.text(`• Средний рейтинг волонтеров (по выполненным дедлайнам): ${avgRating.toFixed(2)} из 5.00.`);
      doc.moveDown(2);

      // --- Section 2: Projects List ---
      doc.font('Arial-Bold').fontSize(14).text('2. Перечень реализуемых проектов', { underline: true });
      doc.moveDown(0.5);

      projects.forEach((proj, index) => {
        const projTasks = tasks.filter(t => t.project_id === proj.id);
        const projDone = projTasks.filter(t => t.status === 'completed').length;
        
        doc.font('Arial-Bold').fontSize(11).text(`${index + 1}. Проект: "${proj.title}"`);
        doc.font('Arial').fontSize(10);
        doc.text(`   Статус проекта: ${proj.status === 'active' ? 'Активен' : proj.status === 'planning' ? 'Планирование' : 'Завершен'}`);
        doc.text(`   Прогресс задач: ${projDone} выполнено / ${projTasks.length} всего.`);
        doc.moveDown(0.5);
      });
      doc.moveDown(1.5);

      // --- Section 3: Volunteer Rating Table ---
      doc.font('Arial-Bold').fontSize(14).text('3. Рейтинг эффективности волонтеров (CRM Rating)', { underline: true });
      doc.moveDown(0.5);

      // Table Header
      doc.font('Arial-Bold').fontSize(10);
      doc.text('ФИО Волонтера', 50, doc.y, { width: 200, continued: true });
      doc.text('Телефон', 250, doc.y, { width: 100, continued: true });
      doc.text('Задачи (Вып./Всего)', 350, doc.y, { width: 120, continued: true });
      doc.text('Рейтинг', 470, doc.y, { width: 80 });
      doc.moveDown(0.2);
      doc.font('Arial').fontSize(9);

      volunteers.forEach((v) => {
        const vTasks = tasks.filter(t => t.assigned_to === v.id);
        const vDone = vTasks.filter(t => t.status === 'completed').length;

        doc.text(v.full_name, 50, doc.y, { width: 200, continued: true });
        doc.text(v.phone || 'нет', 250, doc.y, { width: 100, continued: true });
        doc.text(`${vDone} / ${vTasks.length}`, 350, doc.y, { width: 120, continued: true });
        doc.text(`${v.rating.toFixed(2)} / 5.00`, 470, doc.y, { width: 80 });
        doc.moveDown(0.2);
      });

      doc.moveDown(2);

      // --- Section 4: Telegram Micro Reports (Check-ins) ---
      doc.addPage();
      doc.font('Arial-Bold').fontSize(14).text('4. Приложение: Поток чек-инов волонтеров (Telegram-бот)', { underline: true });
      doc.moveDown(1);

      checkins.forEach((rep, index) => {
        const project = projects.find(p => p.id === rep.project_id);
        const volunteer = users.find(u => u.id === rep.user_id);
        
        doc.font('Arial-Bold').fontSize(11).text(`Чек-ин №${index + 1} по проекту: "${project ? project.title : 'Общие задачи'}"`);
        doc.font('Arial').fontSize(10);
        doc.text(`Волонтер: ${volunteer ? volunteer.full_name : 'Неизвестно'} (Телефон: ${volunteer?.phone || 'нет'})`);
        doc.text(`Зафиксированное время: ${rep.hours} ч.`);
        doc.font('Arial').text(`Текст отчета: ${rep.text_report}`);
        doc.fontSize(8).text(`Дата отчета: ${new Date(rep.created_at).toLocaleString('ru-RU')}`, { align: 'right' });
        doc.moveDown(1);
      });

      // --- Footer / Signatures ---
      doc.moveDown(2);
      doc.font('Arial').fontSize(11);
      doc.text('Отчет составлен автоматически в системе Volunteer OS.', { align: 'left' });
      doc.moveDown(1);
      doc.text('Подпись должностного лица: ___________________ / ___________________ /', { align: 'left' });
      doc.text('М.П.', { align: 'left' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    const checkins = await db.getCheckIns();
    const projects = await db.getProjects();
    const tasks = await db.getTasks();
    const users = await db.getUsers();

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFBuffer(checkins, projects, tasks, users);

      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=volunteer_os_report_${Date.now()}.pdf`
        }
      });
    }

    // CSV format
    let csvContent = '\uFEFF'; // Add BOM for Excel Russian compatibility
    csvContent += 'ID Чек-ина,Имя волонтера,Телефон,Проект,Комментарий/Отчет,Часы,Дата\n';

    checkins.forEach((rep) => {
      const volunteer = users.find(u => u.id === rep.user_id);
      const project = projects.find(p => p.id === rep.project_id);
      
      const vName = volunteer ? volunteer.full_name : 'Неизвестно';
      const vPhone = volunteer ? (volunteer.phone || 'нет') : 'нет';
      const pTitle = project ? project.title : 'Общие задачи';
      
      // Clean comment of commas/newlines for CSV safety
      const comment = rep.text_report.replace(/[\n\r]/g, ' ').replace(/"/g, '""');
      const date = new Date(rep.created_at).toLocaleDateString('ru-RU');

      csvContent += `"${rep.id}","${vName}","${vPhone}","${pTitle}","${comment}","${rep.hours}","${date}"\n`;
    });

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=volunteer_os_report_${Date.now()}.csv`
      }
    });
  } catch (error) {
    console.error('Failed to export reports:', error);
    return NextResponse.json({ error: 'Failed to export reports' }, { status: 500 });
  }
}
