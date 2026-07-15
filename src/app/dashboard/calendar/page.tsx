'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Briefcase, Flag, Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Project {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  project_id: string;
  deadline: string;
  status: string;
}

export default function CalendarPage() {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [projRes, tasksRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks')
      ]);

      setProjects(await projRes.json());
      setTasks(await tasksRes.json());
    } catch (e) {
      console.error('Failed to load calendar data', e);
    } finally {
      setLoading(false);
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // Adjust to start week on Monday (0 = Monday, 6 = Sunday)
    const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    return { daysInMonth, startDay };
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const today = () => setCurrentDate(new Date());

  const { daysInMonth, startDay } = getDaysInMonth(currentDate);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startDay }, (_, i) => i);

  const monthNames = [
    t('calendar.jan'), t('calendar.feb'), t('calendar.mar'), t('calendar.apr'), t('calendar.may'), t('calendar.jun'),
    t('calendar.jul'), t('calendar.aug'), t('calendar.sep'), t('calendar.oct'), t('calendar.nov'), t('calendar.dec')
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('calendar.title')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('calendar.subtitle')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={today} className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50">
            {t('calendar.today')}
          </button>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold w-28 text-center text-slate-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
          {[t('calendar.mon'), t('calendar.tue'), t('calendar.wed'), t('calendar.thu'), t('calendar.fri'), t('calendar.sat'), t('calendar.sun')].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 min-h-[500px] auto-rows-fr">
          {emptyDays.map(i => (
            <div key={`empty-${i}`} className="border-r border-b border-slate-100 bg-slate-50/30"></div>
          ))}
          
          {daysArray.map(day => {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Find tasks and projects for this day
            const dayTasks = tasks.filter(t => t.deadline?.startsWith(dateStr));
            const dayProjectsStart = projects.filter(p => p.start_date?.startsWith(dateStr));
            const dayProjectsEnd = projects.filter(p => p.end_date?.startsWith(dateStr));

            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            return (
              <div key={day} className={`border-r border-b border-slate-100 p-2 flex flex-col gap-1 transition-colors hover:bg-slate-50/50 ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-slate-900 text-white' : 'text-slate-700'}`}>
                    {day}
                  </span>
                </div>
                
                <div className="flex-1 space-y-1 mt-1 overflow-y-auto max-h-24 no-scrollbar">
                  {dayProjectsStart.map(p => (
                    <div key={`ps-${p.id}`} className="px-1.5 py-1 text-[9px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 truncate flex items-center gap-1" title={`${t('calendar.start')}: ${p.title}`}>
                      <Flag className="w-2.5 h-2.5 shrink-0" /> {p.title}
                    </div>
                  ))}
                  {dayProjectsEnd.map(p => (
                    <div key={`pe-${p.id}`} className="px-1.5 py-1 text-[9px] font-bold rounded-md bg-red-50 text-red-700 border border-red-100 truncate flex items-center gap-1" title={`${t('calendar.end')}: ${p.title}`}>
                      <Flag className="w-2.5 h-2.5 shrink-0" /> {p.title}
                    </div>
                  ))}
                  {dayTasks.map(tTask => (
                    <div key={`t-${tTask.id}`} className="px-1.5 py-1 text-[9px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-100 truncate flex items-center gap-1" title={`${t('calendar.task')}: ${tTask.title}`}>
                      <Briefcase className="w-2.5 h-2.5 shrink-0" /> {tTask.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
