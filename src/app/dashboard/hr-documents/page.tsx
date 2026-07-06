'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  User, 
  Briefcase, 
  MapPin, 
  Calendar, 
  Plus, 
  Check, 
  FileSignature, 
  History,
  Loader2,
  Printer
} from 'lucide-react';

interface UserItem {
  id: string;
  full_name: string;
  role: string;
}

interface HrDocument {
  id: string;
  employee_name: string;
  doc_type: 'leave' | 'hiring' | 'travel';
  details: string;
  created_at: string;
}

export default function HrDocumentsPage() {
  const [employees, setEmployees] = useState<UserItem[]>([]);
  const [history, setHistory] = useState<HrDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [docType, setDocType] = useState<'leave' | 'hiring' | 'travel'>('leave');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<any | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch users for employee list
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const users = await usersRes.json();
        // Keep only admin/manager roles as employees, but allow volunteers too
        setEmployees(users);
        if (users.length > 0) {
          setSelectedEmployeeName(users[0].full_name);
        }
      }

      // Fetch past HR documents
      const docsRes = await fetch('/api/hr-documents');
      if (docsRes.ok) {
        const docs = await docsRes.json();
        setHistory(docs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeName || !details) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/hr-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_name: selectedEmployeeName,
          doc_type: docType,
          details
        })
      });

      if (res.ok) {
        const newDoc = await res.json();
        // Refresh history
        setHistory(prev => [newDoc, ...prev]);
        
        // Generate mock preview representation
        const docNum = Math.floor(Math.random() * 800) + 100;
        const todayStr = new Date().toLocaleDateString('ru-RU');
        
        let templateTitle = '';
        let bodyText = '';
        
        if (docType === 'hiring') {
          templateTitle = `ПРИКАЗ № ${docNum}-ЛС\nО ПРИЕМЕ НА РАБОТУ`;
          bodyText = `Принять сотрудника ${selectedEmployeeName} на должность согласно штатному расписанию Ассоциации Волонтеров с выплатой оклада в соответствии со штатным графиком. Основание: трудовой договор, заявление сотрудника.\n\nДополнительные детали:\n${details}`;
        } else if (docType === 'leave') {
          templateTitle = `ПРИКАЗ № ${docNum}-ОТ\nО ПРЕДОСТАВЛЕНИИ ОТПУСКА`;
          bodyText = `Предоставить сотруднику ${selectedEmployeeName} очередной оплачиваемый отпуск по графику отпусков.\n\nСроки и детали отпуска:\n${details}`;
        } else if (docType === 'travel') {
          templateTitle = `ПРИКАЗ № ${docNum}-КМ\nО НАПРАВЛЕНИИ В КОМАНДИРОВКУ`;
          bodyText = `Направить сотрудника ${selectedEmployeeName} в служебную командировку для выполнения операционных задач Ассоциации волонтеров.\n\nЦель и сроки командировки:\n${details}`;
        }

        setGeneratedDoc({
          number: docNum,
          date: todayStr,
          title: templateTitle,
          body: bodyText,
          employee: selectedEmployeeName
        });
      } else {
        alert('Ошибка при создании документа');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'hiring': return 'Прием на работу';
      case 'leave': return 'Заявление об отпуске';
      case 'travel': return 'Приказ о командировке';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-slate-800" />
          Конструктор HR-Документов
        </h1>
        <p className="text-xs text-slate-500">Генерация кадровых приказов (о приеме, отпуске, командировке) с официальной печатью</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Создать приказ / документ</h2>
            
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-slate-900" /></div>
            ) : (
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Сотрудник / Волонтер</label>
                  <select
                    value={selectedEmployeeName}
                    onChange={(e) => setSelectedEmployeeName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800 bg-white"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.full_name}>
                        {emp.full_name} ({emp.role === 'admin' ? 'Руководитель' : emp.role === 'manager' ? 'Координатор' : 'Волонтер'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Тип документа</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'leave', label: 'Отпуск' },
                      { type: 'hiring', label: 'Прием' },
                      { type: 'travel', label: 'Командировка' }
                    ].map(btn => (
                      <button
                        key={btn.type}
                        type="button"
                        onClick={() => setDocType(btn.type as any)}
                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                          docType === btn.type 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Детали и даты приказа</label>
                  <textarea
                    required
                    placeholder={
                      docType === 'leave' 
                        ? 'Предоставить отпуск с 15.06.2026 по 29.06.2026 (14 календарных дней).' 
                        : docType === 'hiring' 
                        ? 'Принять на должность регионального куратора по Самарской области с 01.07.2026.' 
                        : 'Направление в г. Ташкент с 18.06.2026 по 22.06.2026 для участия в экологическом форуме.'
                    }
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Сформировать и сохранить приказ
                </button>
              </form>
            )}
          </div>

          {/* History Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              История созданных документов
            </h2>
            
            {loading ? (
              <div className="flex justify-center"><Loader2 className="w-4 h-4 animate-spin" /></div>
            ) : history.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-4">История пуста</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto space-y-2.5 pr-1.5">
                {history.map(doc => (
                  <div key={doc.id} className="pt-2 text-xs flex justify-between items-start gap-2">
                    <div>
                      <p className="font-bold text-slate-800">{doc.employee_name}</p>
                      <p className="text-[10px] text-slate-400">{getDocTypeLabel(doc.doc_type)} • {new Date(doc.created_at).toLocaleDateString('ru-RU')}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 italic">"{doc.details}"</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        // Display this past doc in preview panel
                        const docNum = doc.id.slice(-4).replace(/[^0-9]/g, '') || '425';
                        setGeneratedDoc({
                          number: docNum,
                          date: new Date(doc.created_at).toLocaleDateString('ru-RU'),
                          title: `ПРИКАЗ № ${docNum}\n${getDocTypeLabel(doc.doc_type).toUpperCase()}`,
                          body: doc.details,
                          employee: doc.employee_name
                        });
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-900 border border-slate-200 px-2 py-0.5 rounded-lg hover:bg-slate-50 shrink-0"
                    >
                      Показать
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-7">
          {generatedDoc ? (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Печать приказа
                </button>
              </div>

              {/* Official Letterhead */}
              <div className="bg-white border-2 border-slate-200 rounded-xl p-8 shadow-md relative min-h-[500px] flex flex-col justify-between overflow-hidden text-black font-serif">
                
                {/* Stamp overlay watermark */}
                <div className="absolute right-12 bottom-12 border-4 border-slate-800/20 text-slate-800/20 font-sans font-bold text-[10px] rotate-12 p-3 rounded-full w-24 h-24 flex items-center justify-center text-center uppercase tracking-widest pointer-events-none select-none">
                  Ассоциация Волонтеров
                </div>

                <div className="space-y-6">
                  {/* Company Header */}
                  <div className="text-center space-y-1 border-b border-slate-950 pb-4">
                    <p className="font-bold text-xs uppercase tracking-widest font-sans">Ассоциация Волонтерских Организаций</p>
                    <p className="text-[9px] text-slate-600 font-sans tracking-wide">100000, Республика Узбекистан, г. Ташкент • info@volunteer.uz</p>
                  </div>

                  {/* Document Meta Info */}
                  <div className="flex justify-between text-[11px] font-sans font-bold">
                    <span>г. Ташкент</span>
                    <span>Дата: {generatedDoc.date}</span>
                  </div>

                  {/* Document Title */}
                  <div className="text-center py-4">
                    <pre className="font-bold text-sm leading-relaxed text-slate-950 font-serif whitespace-pre-wrap">
                      {generatedDoc.title}
                    </pre>
                  </div>

                  {/* Body Text */}
                  <div className="text-xs leading-relaxed text-justify indent-8 text-slate-900 space-y-4 font-serif">
                    <p>{generatedDoc.body}</p>
                    <p>Контроль за исполнением настоящего приказа оставляю за собой.</p>
                  </div>
                </div>

                {/* Signatures & Seal section */}
                <div className="pt-12 border-t border-slate-100 flex justify-between items-end text-xs font-sans mt-12">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">Руководитель Ассоциации</p>
                    <div className="h-6 border-b border-slate-400 w-32 relative">
                      {/* Fake digital signature */}
                      <span className="absolute bottom-1 left-2 font-mono text-[9px] text-slate-400 rotate-[-4deg]">Sh. Abdullaeva</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Ш. Абдуллаева (Ширин)</p>
                  </div>

                  {/* Mock Seal */}
                  <div className="w-16 h-16 border border-slate-800 text-slate-800 rounded-full flex flex-col items-center justify-center text-[7px] uppercase font-sans text-center relative rotate-[-12deg] shrink-0 opacity-80">
                    <div className="absolute inset-1 border border-slate-800 rounded-full border-dashed"></div>
                    <span className="font-bold">Ассоциация</span>
                    <span className="font-semibold text-[6px]">Для приказов</span>
                    <span>Волонтеров</span>
                  </div>

                  <div className="space-y-1 text-right">
                    <p className="font-bold text-slate-800">С приказом ознакомлен</p>
                    <div className="h-6 border-b border-slate-400 w-32"></div>
                    <p className="text-[10px] text-slate-400">{generatedDoc.employee}</p>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-20 text-center flex flex-col justify-center items-center h-full min-h-[450px]">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-xs font-semibold text-slate-500">Предпросмотр документа отсутствует</p>
              <p className="text-[10px] text-slate-400 max-w-xs mt-1">Заполните левую форму и нажмите кнопку создания, чтобы сгенерировать официальный приказ.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
