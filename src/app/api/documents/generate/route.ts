import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const docs = await db.getDocuments();
    return NextResponse.json({ documents: docs });
  } catch (error) {
    console.error('Failed to get generated documents logs:', error);
    return NextResponse.json({ error: 'Failed to retrieve documents logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { template_type, title, volunteer_id, project_id } = body;

    if (!template_type || !title) {
      return NextResponse.json({ error: 'Missing template_type or title' }, { status: 400 });
    }

    const docLog = await db.addDocument({
      template_type,
      title,
      volunteer_id: volunteer_id || null,
      project_id: project_id || null
    });

    // Generate simulated print-ready HTML contents
    let htmlContent = '';
    const dateStr = new Date().toLocaleDateString('ru-RU');

    if (template_type === 'appreciation') {
      const volunteer = (db as any).data.users.find((u: any) => u.id === volunteer_id);
      const volunteerName = volunteer ? volunteer.full_name : 'Имя Волонтера';
      htmlContent = `
        <div class="p-16 border-8 border-slate-900 bg-white text-slate-900 text-center font-sans max-w-2xl mx-auto shadow-2xl relative my-8">
          <div class="border-2 border-slate-300 p-8">
            <h1 class="text-4xl font-extrabold uppercase tracking-widest text-slate-900 mb-6">Благодарность</h1>
            <p class="text-xs uppercase tracking-widest text-slate-500 font-bold mb-8">Национальная Ассоциация Волонтеров</p>
            <div class="w-16 h-1 bg-slate-900 mx-auto mb-8"></div>
            <p class="text-sm italic text-slate-600 mb-2">Настоящий документ подтверждает, что</p>
            <h2 class="text-2xl font-bold text-slate-800 mb-4">${volunteerName}</h2>
            <p class="text-sm text-slate-700 leading-relaxed max-w-md mx-auto mb-8">
              награждается почетной грамотой за неоценимый личный вклад в развитие волонтерского движения, 
              самоотверженный труд и участие в социальных проектах ассоциации.
            </p>
            <div class="flex justify-between items-end mt-12 text-xs">
              <div class="text-left">
                <p class="font-bold border-b border-slate-400 pb-1 w-36">Д. Админов</p>
                <p class="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Директор ассоциации</p>
              </div>
              <div class="text-right">
                <p class="font-mono text-slate-800">${dateStr}</p>
                <p class="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Дата выдачи</p>
              </div>
            </div>
          </div>
          <div class="absolute top-4 right-4 text-[9px] font-mono text-slate-300">№ ${docLog.id}</div>
        </div>
      `;
    } else if (template_type === 'hours_summary') {
      const volunteer = (db as any).data.users.find((u: any) => u.id === volunteer_id);
      const volunteerName = volunteer ? volunteer.full_name : 'Волонтер';
      const checkins = (db as any).data.check_ins.filter((ci: any) => ci.user_id === volunteer_id);
      const totalHours = checkins.reduce((sum: number, ci: any) => sum + (ci.hours || 0), 0);

      htmlContent = `
        <div class="p-10 bg-white text-slate-900 font-sans max-w-xl mx-auto shadow-xl my-6 border border-slate-200">
          <h2 class="text-xl font-bold text-slate-800 mb-1">Справка об отработанных часах</h2>
          <p class="text-[10px] text-slate-400 mb-6 uppercase tracking-wider font-bold">Volunteer OS Operations</p>
          
          <div class="space-y-3 text-xs mb-8">
            <div class="flex justify-between border-b pb-1.5"><span class="text-slate-500">Волонтер:</span><span class="font-bold">${volunteerName}</span></div>
            <div class="flex justify-between border-b pb-1.5"><span class="text-slate-500">Статус:</span><span class="text-emerald-600 font-bold">Активный участник</span></div>
            <div class="flex justify-between border-b pb-1.5"><span class="text-slate-500">Суммарно отработано:</span><span class="font-bold text-slate-900">${totalHours} часов</span></div>
            <div class="flex justify-between border-b pb-1.5"><span class="text-slate-500">Количество отчетов:</span><span class="font-bold">${checkins.length} чек-инов</span></div>
          </div>
          
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Детализация активности</h3>
          <table class="w-full text-[11px] text-left mb-8 border-collapse">
            <thead>
              <tr class="border-b border-slate-300 text-slate-500"><th class="py-1">Дата</th><th class="py-1">Часы</th><th class="py-1">Описание работы</th></tr>
            </thead>
            <tbody>
              ${checkins.map((ci: any) => `
                <tr class="border-b border-slate-100">
                  <td class="py-2 text-slate-600">${new Date(ci.created_at).toLocaleDateString('ru-RU')}</td>
                  <td class="py-2 font-bold">${ci.hours} ч</td>
                  <td class="py-2 text-slate-700 max-w-xs truncate" title="${ci.text_report}">${ci.text_report}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="flex justify-between items-center text-[10px] text-slate-400 pt-4 border-t border-slate-200">
            <span>Идентификатор документа: <strong>${docLog.id}</strong></span>
            <span>Сформировано: ${dateStr}</span>
          </div>
        </div>
      `;
    } else {
      // regional_report
      const projects = (db as any).data.projects || [];
      const tasks = (db as any).data.tasks || [];
      const checkins = (db as any).data.check_ins || [];
      const totalHours = checkins.reduce((sum: number, ci: any) => sum + (ci.hours || 0), 0);

      htmlContent = `
        <div class="p-8 bg-white text-slate-900 font-sans max-w-3xl mx-auto shadow-md my-4 border border-slate-200">
          <div class="text-center mb-8">
            <h1 class="text-xl font-bold uppercase tracking-wider">Отчет по деятельности волонтерских организаций</h1>
            <p class="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Официальные показатели Ассоциации</p>
          </div>
          
          <div class="grid grid-cols-3 gap-4 mb-8 text-center">
            <div class="p-4 bg-slate-50 rounded-xl border"><h4 class="text-lg font-bold">${projects.length}</h4><p class="text-[10px] text-slate-400 uppercase font-semibold">Проектов в системе</p></div>
            <div class="p-4 bg-slate-50 rounded-xl border"><h4 class="text-lg font-bold">${tasks.length}</h4><p class="text-[10px] text-slate-400 uppercase font-semibold">Всего задач</p></div>
            <div class="p-4 bg-slate-50 rounded-xl border"><h4 class="text-lg font-bold">${totalHours} ч</h4><p class="text-[10px] text-slate-400 uppercase font-semibold font-bold">Отработано часов</p></div>
          </div>
          
          <p class="text-xs text-slate-600 leading-relaxed mb-6">
            Этот отчет сформирован платформой Volunteer OS автоматически. Данные включают показатели волонтерской активности во всех регионах, подтвержденные геолокацией и чек-инами через Telegram.
          </p>
          
          <div class="text-[10px] text-slate-400 text-right font-mono mt-12">Код документа: ${docLog.id} | Выгружено: ${dateStr}</div>
        </div>
      `;
    }

    return NextResponse.json({
      success: true,
      document: docLog,
      html: htmlContent
    });
  } catch (error) {
    console.error('Failed to generate document:', error);
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
}
