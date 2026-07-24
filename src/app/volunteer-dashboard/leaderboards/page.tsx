'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Star, 
  Users, 
  Loader2, 
  Award, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Activity, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  Download,
  X,
  FileCheck
} from 'lucide-react';
import VolunteerBottomNav from '@/components/VolunteerBottomNav';
import Link from 'next/link';

interface VolunteerRank {
  id: string;
  full_name: string;
  xp: number;
  level: number;
  rating: number;
  badges_count: number;
  skills?: string[];
}

interface Project {
  id: string;
  title: string;
}

interface CheckIn {
  id: string;
  user_id: string;
  project_id?: string | null;
  text_report: string;
  hours: number;
  created_at: string;
  kpi_score?: number;
  feedback?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface Task {
  id: string;
  project_id: string;
  assigned_to?: string | null;
  title: string;
  deadline: string;
  status: 'pending' | 'accepted' | 'completed';
  is_overdue: boolean;
  created_at?: string;
}

interface EmergencyAlert {
  id: string;
  title: string;
  description: string;
  radius_km: number;
  created_at: string;
  attending_volunteer_ids: string[];
}

export default function VolunteerLeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'my_kpi'>('leaderboard');
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  
  // Data lists
  const [volunteers, setVolunteers] = useState<VolunteerRank[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Document preview and print states
  const [selectedDocTemplate, setSelectedDocTemplate] = useState<'appreciation' | 'hours_summary'>('appreciation');
  const [docLoading, setDocLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState('');

  const handleGenerateDoc = async () => {
    if (!volunteerId) return;
    setDocLoading(true);
    setGeneratedHtml(null);

    let title = 'Грамота Ассоциации';
    if (selectedDocTemplate === 'hours_summary') {
      const vol = volunteers.find(v => v.id === volunteerId);
      title = `Справка об активности — ${vol ? vol.full_name : 'Волонтер'}`;
    } else {
      const vol = volunteers.find(v => v.id === volunteerId);
      title = `Благодарственное письмо — ${vol ? vol.full_name : 'Волонтер'}`;
    }
    
    setGeneratedTitle(title);

    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: selectedDocTemplate,
          title,
          volunteer_id: volunteerId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedHtml(data.html);
      } else {
        alert('Не удалось сформировать документ');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка соединения при генерации документа');
    } finally {
      setDocLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && generatedHtml) {
      printWindow.document.write(`
        <html>
          <head>
            <title>\${generatedTitle}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { padding: 0; background: white; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body class="bg-slate-100 p-8 flex items-center justify-center min-h-screen">
            <div class="no-print fixed top-4 right-4 z-50">
              <button onclick="window.print()" class="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-md cursor-pointer text-xs">
                Печать / Сохранить в PDF
              </button>
            </div>
            <div class="w-full">
              \${generatedHtml}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  useEffect(() => {
    const cachedId = localStorage.getItem('volunteerId');
    setVolunteerId(cachedId);
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [resV, resP, resC, resT, resA] = await Promise.all([
        fetch('/api/users?role=volunteer'),
        fetch('/api/projects'),
        fetch('/api/checkins'),
        fetch('/api/tasks'),
        fetch('/api/alerts')
      ]);

      if (resV.ok && resP.ok && resC.ok && resT.ok && resA.ok) {
        const users = await resV.json();
        const sorted = users.map((u: any) => ({
          id: u.id,
          full_name: u.full_name,
          xp: u.xp ?? 0,
          level: u.level ?? 1,
          rating: u.rating ?? 5.0,
          badges_count: (u.badges || []).length,
          skills: u.skills || []
        })).sort((a: any, b: any) => b.xp - a.xp);
        
        setVolunteers(sorted);
        setProjects(await resP.json());
        setCheckins((await resC.json()).checkins || []);
        setTasks(await resT.json());
        setAlerts(await resA.json());
      }
    } catch (e) {
      console.error('Failed to load volunteer leaderboard/KPI data:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  const userRankIndex = volunteers.findIndex(v => v.id === volunteerId);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : null;
  const userDetails = userRankIndex !== -1 ? volunteers[userRankIndex] : null;

  // Filter volunteer logs
  const volunteerCheckins = checkins.filter(c => c.user_id === volunteerId);
  const volunteerTasks = tasks.filter(t => t.assigned_to === volunteerId);
  const volunteerAlerts = alerts.filter(a => a.attending_volunteer_ids?.includes(volunteerId || ''));

  // Calculate stats
  const totalHours = volunteerCheckins.reduce((sum, c) => sum + Number(c.hours), 0);
  const completedTasks = volunteerTasks.filter(t => t.status === 'completed').length;
  const gradedCheckinsCount = volunteerCheckins.filter(c => c.kpi_score !== undefined && c.kpi_score !== null).length;
  
  // Rating Letter Logic
  const getRatingLetter = (rating: number) => {
    if (rating >= 4.8) return { letter: 'A', text: 'Отлично', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (rating >= 4.0) return { letter: 'B', text: 'Хорошо', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (rating >= 3.0) return { letter: 'C', text: 'Удовлетворительно', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { letter: 'D', text: 'Неудовлетворительно', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  };

  const currentGrade = userDetails ? getRatingLetter(userDetails.rating) : { letter: 'A', text: 'Отлично', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

  // Compile timeline events
  const events: { date: string; type: string; title: string; desc: string; scoreInfo?: string; xpInfo?: string }[] = [];

  volunteerCheckins.forEach(c => {
    const proj = projects.find(p => p.id === c.project_id);
    const projTitle = proj ? proj.title : 'Общие задачи';
    const isGraded = c.kpi_score !== undefined && c.kpi_score !== null;

    events.push({
      date: c.created_at,
      type: 'checkin',
      title: isGraded ? `Отчет оценен: ${'★'.repeat(c.kpi_score || 5)}` : 'Отчет отправлен (Ожидает оценки)',
      desc: isGraded 
        ? `Проект: "${projTitle}". Отзыв координатора: "${c.feedback || 'без комментария'}". Проверил: ${c.reviewed_by}`
        : `Проект: "${projTitle}". Отчет: "${c.text_report}"`,
      scoreInfo: isGraded ? `${c.kpi_score}/5` : undefined,
      xpInfo: isGraded ? `+${c.kpi_score === 5 ? 50 : c.kpi_score === 4 ? 30 : 15} XP` : undefined
    });
  });

  volunteerTasks.forEach(t => {
    const proj = projects.find(p => p.id === t.project_id);
    const projTitle = proj ? proj.title : 'Общий проект';

    if (t.status === 'completed') {
      events.push({
        date: t.deadline || new Date().toISOString(),
        type: 'task_completed',
        title: 'Задача выполнена',
        desc: `Выполнена задача "${t.title}" в рамках проекта "${projTitle}"`,
        xpInfo: '+20 XP'
      });
    } else if (t.status === 'accepted') {
      events.push({
        date: t.created_at || new Date().toISOString(),
        type: 'task_accepted',
        title: 'Задача принята в работу',
        desc: `Вы взяли в работу задачу "${t.title}" в проекте "${projTitle}"`
      });
    }
  });

  volunteerAlerts.forEach(a => {
    events.push({
      date: a.created_at,
      type: 'alert_attended',
      title: '🚨 Выезд по тревоге подтвержден',
      desc: `Участие в операции сбора: "${a.title}". Выезд волонтера зафиксирован на месте ЧС.`,
      xpInfo: '+50 XP',
      scoreInfo: '+0.2 KPI'
    });
  });

  // Sort events chronologically descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-5 pb-24 animate-fade-in px-1 bg-[#F9FAFB] min-h-screen">
      
      {/* Header Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-slate-900" />
          <h2 className="text-base font-bold text-slate-900 leading-tight">Рейтинги & KPI волонтера</h2>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            Топ-Лист
          </button>
          <button
            onClick={() => setActiveTab('my_kpi')}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-1 ${
              activeTab === 'my_kpi'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Мой KPI
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'leaderboard' ? (
        <div className="space-y-5">
          {/* User Current Rank Summary Card */}
          {userDetails && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[8px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Ваш результат
                </span>
                <h3 className="text-sm font-bold">{userDetails.full_name}</h3>
                <p className="text-[9px] text-slate-400">
                  Уровень: <span className="text-white font-bold">{userDetails.level}</span> | Опыт: <span className="text-white font-bold">{userDetails.xp} XP</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold flex items-center justify-end gap-1">
                  <span className="text-amber-400 text-sm">#</span>
                  {userRank}
                </div>
                <div className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Ранг в системе</div>
              </div>
            </div>
          )}

          {/* Leaderboard Table List */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Список лидеров волонтеров
              </span>
              <span className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Топ-10</span>
            </div>

            <div className="divide-y divide-slate-100">
              {volunteers.map((vol, idx) => {
                const rank = idx + 1;
                const isSelf = vol.id === volunteerId;

                return (
                  <div 
                    key={vol.id} 
                    className={`p-3.5 flex items-center justify-between transition-all ${isSelf ? 'bg-slate-50 font-bold border-l-4 border-l-slate-900 pl-2.5' : 'hover:bg-slate-50/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Badge */}
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-[10px] ${
                        rank === 1 ? 'bg-amber-100 text-amber-800' :
                        rank === 2 ? 'bg-slate-100 text-slate-700' :
                        rank === 3 ? 'bg-orange-50 text-orange-800' :
                        'text-slate-400'
                      }`}>
                        {rank}
                      </span>

                      <div>
                        <h4 className={`text-xs text-slate-900 flex items-center gap-1.5 ${isSelf ? 'font-bold' : 'font-medium'}`}>
                          {vol.full_name}
                          {isSelf && <span className="text-[8px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-bold uppercase">Вы</span>}
                        </h4>
                        <p className="text-[9px] text-slate-400">
                          Уровень: {vol.level} | {vol.xp} XP
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5 justify-end">
                        <Star className="w-3.5 h-3.5 fill-emerald-600 shrink-0" />
                        {vol.rating.toFixed(1)}
                      </span>
                      <span className="text-[8px] text-slate-400 font-medium">{vol.badges_count} наград</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* PERSONAL KPI TAB */
        <div className="space-y-5">
          {/* KPI Summary Header Card */}
          {userDetails && (
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Ваш персональный KPI профиль
                </span>
                <h3 className="text-sm font-bold text-slate-950 mt-1">{userDetails.full_name}</h3>
                <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                  <span>Уровень: <span className="text-slate-900 font-bold">{userDetails.level}</span></span>
                  <span>•</span>
                  <span>Опыт: <span className="text-slate-900 font-bold">{userDetails.xp} XP</span></span>
                </p>
              </div>

              {/* Glowing KPI Letter Grade */}
              <div className="text-center shrink-0">
                <div className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center shadow-sm ${currentGrade.color}`}>
                  <span className="text-xl font-black tracking-tighter">{currentGrade.letter}</span>
                  <span className="text-[7px] font-black uppercase tracking-wider -mt-1">{currentGrade.text}</span>
                </div>
              </div>
            </div>
          )}

          {/* XP Progress Bar Card */}
          {userDetails && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase text-[9px]">Прогресс уровня</span>
                <span className="font-mono text-slate-900 font-bold text-[10px]">{userDetails.xp % 100} / 100 XP</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-150">
                <div 
                  className="bg-slate-900 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${userDetails.xp % 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Уровень {userDetails.level}</span>
                <span>Уровень {userDetails.level + 1}</span>
              </div>
            </div>
          )}

          {/* Competency Profile Card */}
          {userDetails && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Профессиональный профиль компетенций
              </h4>
              {(!userDetails.skills || userDetails.skills.length === 0) ? (
                <div className="text-[10px] text-slate-400 text-center py-2 italic font-medium">Навыки еще не указаны в профиле волонтера</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {userDetails.skills.map((sk, index) => {
                    let tier = "Практикант";
                    let color = "border-slate-200 bg-slate-50/50 text-slate-700";
                    
                    if (sk.toLowerCase().includes("помощь")) {
                      const hasEmergency = volunteerAlerts.length > 0;
                      tier = hasEmergency ? "Специалист ЧС (Тир 2)" : "Санитар (Тир 1)";
                      color = "border-red-150 bg-red-50/20 text-red-800";
                    } else if (sk.toLowerCase().includes("дорож") || sk.toLowerCase().includes("машин")) {
                      const hasTasks = completedTasks > 0;
                      tier = hasTasks ? "Пилот эвакуации (Тир 2)" : "Водитель (Тир 1)";
                      color = "border-blue-150 bg-blue-50/20 text-blue-800";
                    } else if (sk.toLowerCase().includes("поиск")) {
                      const hasAlerts = volunteerAlerts.length > 0;
                      tier = hasAlerts ? "Следопыт (Тир 2)" : "Поисковик (Тир 1)";
                      color = "border-emerald-150 bg-emerald-50/20 text-emerald-800";
                    } else {
                      tier = "Активный эксперт";
                      color = "border-slate-200 bg-slate-50 text-slate-800";
                    }

                    return (
                      <div key={`skill-${index}`} className={`p-2.5 rounded-xl border flex flex-col justify-between ${color} text-xs`}>
                        <span className="font-bold text-slate-900 leading-tight">{sk}</span>
                        <span className="text-[8px] font-black uppercase tracking-wider mt-1">{tier}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Certificate Generator Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 text-xs">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Ваши документы & Справки
              </h4>
              <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Экспортировать официальное подтверждение о часах</p>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  value={selectedDocTemplate}
                  onChange={(e) => setSelectedDocTemplate(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
                >
                  <option value="appreciation">Благодарственное письмо (Грамота)</option>
                  <option value="hours_summary">Справка об отработанных часах</option>
                </select>
              </div>

              <button
                onClick={handleGenerateDoc}
                disabled={docLoading || !volunteerId}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap text-xs active:scale-98"
              >
                {docLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ...
                  </>
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5" />
                    Выгрузить
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Metric 1: Rating Score */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1 flex flex-col justify-between">
              <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">KPI Оценка (Рейтинг)</span>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-xl font-black text-slate-950">{userDetails ? userDetails.rating.toFixed(2) : '5.00'}</span>
                <span className="text-[10px] text-slate-400">/ 5.0</span>
              </div>
              <span className="text-[8px] text-emerald-600 font-semibold block mt-1">★ Средний балл по отчетам</span>
            </div>

            {/* Metric 2: Hours Logged */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1 flex flex-col justify-between">
              <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Отработано времени</span>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-xl font-black text-slate-950">{totalHours.toFixed(1)}</span>
                <span className="text-[10px] text-slate-400">часов</span>
              </div>
              <span className="text-[8px] text-slate-400 font-medium block mt-1">Подтверждено в системе</span>
            </div>

            {/* Metric 3: Task Stats */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1 flex flex-col justify-between">
              <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Выполнено задач</span>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-xl font-black text-slate-950">{completedTasks}</span>
                <span className="text-[10px] text-slate-400">/ {volunteerTasks.length} всего</span>
              </div>
              <span className="text-[8px] text-slate-400 font-medium block mt-1">Завершено в срок</span>
            </div>

            {/* Metric 4: Graded reports */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1 flex flex-col justify-between">
              <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Оцененные отчеты</span>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-xl font-black text-slate-950">{gradedCheckinsCount}</span>
                <span className="text-[10px] text-slate-400 font-medium">из {volunteerCheckins.length} отчетов</span>
              </div>
              <span className="text-[8px] text-slate-400 font-medium block mt-1">Проверено куратором</span>
            </div>
          </div>

          {/* Timeline History Block */}
          <div className="space-y-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1 block">
              История баллов & проверок KPI ({events.length})
            </span>

            {events.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs py-12">
                Вы еще не выполняли активностей. Ваши баллы и KPI оценки будут отражаться здесь.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 relative space-y-4">
                {/* Timeline vertical bar line */}
                <div className="absolute left-6.5 top-5 bottom-5 w-0.5 bg-slate-100 z-0" />

                {events.map((ev, index) => {
                  // Color codes for different event types
                  const dotColor = {
                    checkin: ev.scoreInfo ? 'bg-emerald-500 ring-emerald-100' : 'bg-slate-350 ring-slate-100',
                    task_completed: 'bg-blue-500 ring-blue-100',
                    task_accepted: 'bg-slate-450 ring-slate-100',
                    alert_attended: 'bg-rose-500 ring-rose-100'
                  }[ev.type] || 'bg-slate-400 ring-slate-100';

                  return (
                    <div key={`event-${index}`} className="flex gap-4 items-start relative z-10 text-xs">
                      {/* Timeline Dot */}
                      <div className={`w-5.5 h-5.5 rounded-full shrink-0 flex items-center justify-center ring-4 font-bold text-[8px] text-white ${dotColor}`}>
                        {ev.type === 'alert_attended' ? '🚨' : ''}
                      </div>

                      {/* Event Details Card */}
                      <div className="flex-1 space-y-1 pb-3 border-b border-slate-100 last:border-none last:pb-0 font-medium">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 leading-snug">{ev.title}</h4>
                          <span className="text-[8px] text-slate-400 font-medium font-mono shrink-0">
                            {new Date(ev.date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                          {ev.desc}
                        </p>

                        {/* Extra indicators: XP or Rating score pills */}
                        <div className="flex gap-1.5 pt-0.5">
                          {ev.xpInfo && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-slate-900 text-white text-[8px] font-black uppercase">
                              <TrendingUp className="w-2 h-2 text-white" />
                              {ev.xpInfo}
                            </span>
                          )}
                          {ev.scoreInfo && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-250 text-[8px] font-black uppercase">
                              {ev.scoreInfo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {generatedHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-slate-100 rounded-xl border border-slate-200 shadow-2xl w-[90%] max-w-[500px] flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-3.5 bg-white border-b border-slate-200 flex justify-between items-center rounded-t-xl text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900">{generatedTitle}</h3>
              </div>
              <button 
                onClick={() => setGeneratedHtml(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Preview */}
            <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start">
              <div 
                className="w-full bg-white rounded-lg shadow-sm border border-slate-250 p-2 overflow-hidden scale-[0.8] origin-top" 
                dangerouslySetInnerHTML={{ __html: generatedHtml }} 
              />
            </div>

            {/* Modal Footer actions */}
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end gap-2 rounded-b-xl text-xs">
              <button
                onClick={() => setGeneratedHtml(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Закрыть
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Печать / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
