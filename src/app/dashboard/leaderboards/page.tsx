'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  Building2, 
  Users2, 
  Clock, 
  FileText, 
  Download, 
  ChevronRight,
  Loader2,
  X,
  FileCheck,
  Activity,
  TrendingUp,
  CheckSquare,
  ThumbsUp,
  Shield
} from 'lucide-react';

interface VolunteerRank {
  id: string;
  full_name: string;
  xp: number;
  level: number;
  rating: number;
  badges_count: number;
}

interface OrgRank {
  id: string;
  name: string;
  category: string;
  total_hours: number;
  volunteers_count: number;
  projects_count: number;
  kpi_score: number;
  avg_rating: number;
  task_rate: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

export default function LeaderboardsPage() {
  const [role, setRole] = useState('manager');
  const [loading, setLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);

  // Rankings lists
  const [volunteers, setVolunteers] = useState<VolunteerRank[]>([]);
  const [organizations, setOrganizations] = useState<OrgRank[]>([]);

  // Raw database data lists for Association aggregates
  const [rawCheckins, setRawCheckins] = useState<any[]>([]);
  const [rawProjects, setRawProjects] = useState<any[]>([]);
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [rawUsers, setRawUsers] = useState<any[]>([]);
  const [rawAlerts, setRawAlerts] = useState<any[]>([]);

  // Selected state for document generation
  const [activeLeaderboard, setActiveLeaderboard] = useState<'association' | 'volunteers' | 'organizations'>('association');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [selectedDocTemplate, setSelectedDocTemplate] = useState<'appreciation' | 'hours_summary' | 'regional_report'>('appreciation');
  
  // Doc preview modal state
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState('');

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole');
    if (savedRole) setRole(savedRole);

    const handleRoleChange = () => {
      const updated = localStorage.getItem('currentUserRole');
      if (updated) setRole(updated);
    };

    window.addEventListener('auth-session-change', handleRoleChange);
    loadData();

    return () => window.removeEventListener('auth-session-change', handleRoleChange);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch rankings directly from backend
      const resV = await fetch('/api/users?role=volunteer');
      const dataV = await resV.json();
      
      const resAllUsers = await fetch('/api/users');
      const dataAllUsers = await resAllUsers.json();
      
      const resO = await fetch('/api/organizations');
      const dataO = await resO.json();

      // Fetch checkins for hours calculation
      const resC = await fetch('/api/checkins');
      let dataC = await resC.json();
      dataC = dataC.checkins || [];

      const resP = await fetch('/api/projects');
      const dataP = await resP.json();

      const resT = await fetch('/api/tasks');
      const dataT = await resT.json();

      const resA = await fetch('/api/alerts');
      const dataA = await resA.json();

      setRawCheckins(dataC);
      setRawProjects(dataP);
      setRawTasks(dataT);
      setRawUsers(dataAllUsers);
      setRawAlerts(dataA);

      // Aggregate volunteers by XP
      const aggregatedV: VolunteerRank[] = dataV.map((u: any) => ({
        id: u.id,
        full_name: u.full_name,
        xp: u.xp ?? 0,
        level: u.level ?? 1,
        rating: u.rating ?? 5.0,
        badges_count: (u.badges || []).length
      })).sort((a: any, b: any) => b.xp - a.xp);

      // Calculate composite organization KPIs
      const aggregatedO: OrgRank[] = dataO.map((org: any) => {
        const orgProjects = dataP.filter((p: any) => p.org_id === org.id);
        const orgProjIds = orgProjects.map((p: any) => p.id);
        
        // 1. Avg Volunteer Rating under this organization
        const orgCheckins = dataC.filter((ci: any) => ci.project_id && orgProjIds.includes(ci.project_id));
        const gradedCheckins = orgCheckins.filter((ci: any) => ci.kpi_score !== undefined && ci.kpi_score !== null);
        const avgRating = gradedCheckins.length > 0
          ? gradedCheckins.reduce((sum: number, ci: any) => sum + (ci.kpi_score || 0), 0) / gradedCheckins.length
          : 4.0; // default 4.0

        // 2. Task Completion Rate
        const orgTasks = dataT.filter((t: any) => orgProjIds.includes(t.project_id));
        const completedTasks = orgTasks.filter((t: any) => t.status === 'completed');
        const taskRate = orgTasks.length > 0
          ? completedTasks.length / orgTasks.length
          : 0.9; // default 90%

        // 3. Involvement Index (Hours / (Volunteers * 10))
        const totalHours = orgCheckins.reduce((sum: number, ci: any) => sum + (ci.hours || 0), 0);
        const volunteersCount = new Set(orgCheckins.map((ci: any) => ci.user_id)).size;
        const involvementIndex = volunteersCount > 0
          ? Math.min(100, (totalHours / (volunteersCount * 10)) * 100)
          : 0;

        // Composite KPI formula: 40% rating, 30% tasks, 30% involvement
        const kpiScore = Math.round((0.4 * (avgRating * 20) + 0.3 * (taskRate * 100) + 0.3 * involvementIndex) * 10) / 10;

        // Letter grade
        let grade: 'A' | 'B' | 'C' | 'D' = 'D';
        if (kpiScore >= 90) grade = 'A';
        else if (kpiScore >= 75) grade = 'B';
        else if (kpiScore >= 60) grade = 'C';

        return {
          id: org.id,
          name: org.name,
          category: org.category,
          total_hours: Math.round(totalHours * 10) / 10,
          volunteers_count: volunteersCount,
          projects_count: orgProjects.length,
          kpi_score: kpiScore,
          avg_rating: Math.round(avgRating * 100) / 100,
          task_rate: taskRate,
          grade
        };
      }).sort((a: any, b: any) => b.kpi_score - a.kpi_score);

      setVolunteers(aggregatedV);
      setOrganizations(aggregatedO);
      
      if (aggregatedV.length > 0) {
        setSelectedVolunteerId(aggregatedV[0].id);
      }
    } catch (e) {
      console.error('Failed to load leaderboard data:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateDoc = async () => {
    setDocLoading(true);
    setGeneratedHtml(null);

    let title = 'Грамота Ассоциации';
    if (selectedDocTemplate === 'hours_summary') {
      const vol = volunteers.find(v => v.id === selectedVolunteerId);
      title = `Справка об активности — ${vol ? vol.full_name : 'Волонтер'}`;
    } else if (selectedDocTemplate === 'regional_report') {
      title = `Региональный сводный отчет волонтерских организаций`;
    } else {
      const vol = volunteers.find(v => v.id === selectedVolunteerId);
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
          volunteer_id: selectedDocTemplate !== 'regional_report' ? selectedVolunteerId : null
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
            <title>${generatedTitle}</title>
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
              ${generatedHtml}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24 bg-[#F9FAFB]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-slate-900" />
          Рейтинги волонтеров & KPI организаций
        </h2>
        <p className="text-xs text-slate-500">
          Сводная таблица лидеров по набранному волонтерами опыту (XP) и суммарно отработанным часам организаций
        </p>
      </div>

      {/* Grid: 2 Columns. Left: Leaderboard list (2/3 width). Right: Document Generator (1/3 width) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Leaderboard Tables */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            {/* Tabs Selector inside Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex gap-2 p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => setActiveLeaderboard('association')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${activeLeaderboard === 'association' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <Activity className="w-3.5 h-3.5 shrink-0" />
                  KPI Ассоциации
                </button>
                <button
                  onClick={() => setActiveLeaderboard('volunteers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${activeLeaderboard === 'volunteers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <Users2 className="w-3.5 h-3.5 shrink-0" />
                  Рейтинг волонтеров
                </button>
                <button
                  onClick={() => setActiveLeaderboard('organizations')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${activeLeaderboard === 'organizations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  KPI организаций
                </button>
              </div>
              
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Обновлено сегодня
              </span>
            </div>

            {/* Tab 0: Association KPI Analytics */}
            {activeLeaderboard === 'association' && (
              <div className="p-5 space-y-6">
                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 shadow-sm">
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">KPI Ассоциации</span>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-xl font-extrabold text-slate-950">
                        {(organizations.length > 0 ? (organizations.reduce((sum, o) => sum + o.kpi_score, 0) / organizations.length) : 0).toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-[8px] text-emerald-600 font-semibold block mt-1">★ Индекс здоровья корпусов</span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 shadow-sm">
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Своевременность (SLA)</span>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-xl font-extrabold text-slate-950">
                        {(rawTasks.length > 0 ? (rawTasks.filter(t => t.status === 'completed').length / rawTasks.length) * 100 : 0).toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-[8px] text-slate-400 font-medium block mt-1">Процент задач, закрытых в срок</span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 shadow-sm">
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Индекс мобилизации</span>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-xl font-extrabold text-slate-950">
                        {(volunteers.length > 0 ? (volunteers.filter(v => v.xp > 0).length / volunteers.length) * 100 : 0).toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-[8px] text-slate-400 font-medium block mt-1">Доля волонтеров с часами в CRM</span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 shadow-sm">
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Охват ЧС</span>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-xl font-extrabold text-slate-950">
                        {(rawAlerts.length > 0 ? (rawAlerts.filter(a => a.attending_volunteer_ids && a.attending_volunteer_ids.length > 0).length / rawAlerts.length) * 100 : 0).toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-[8px] text-slate-400 font-medium block mt-1">Доля ЧС со сборами по тревоге</span>
                  </div>
                </div>

                {/* Section: Category KPI Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 font-bold" />
                    Эффективность по направлениям деятельности
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-[11px] text-left border-collapse bg-white">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase text-[9px]">
                          <th className="px-4 py-2.5">Направление</th>
                          <th className="px-4 py-2.5 text-center">Организаций</th>
                          <th className="px-4 py-2.5 text-center">Проектов</th>
                          <th className="px-4 py-2.5 text-center">Волонтеров</th>
                          <th className="px-4 py-2.5 text-center">Часов</th>
                          <th className="px-4 py-2.5 text-center">Средний KPI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {['Экология', 'Защита животных', 'Социальная помощь', 'Здравоохранение', 'Образование'].map(cat => {
                          const orgsInCat = organizations.filter(o => o.category === cat);
                          const totalProjs = orgsInCat.reduce((sum, o) => sum + o.projects_count, 0);
                          const totalVols = orgsInCat.reduce((sum, o) => sum + o.volunteers_count, 0);
                          const totalHrs = orgsInCat.reduce((sum, o) => sum + o.total_hours, 0);
                          const avgKpi = orgsInCat.length > 0 ? (orgsInCat.reduce((sum, o) => sum + o.kpi_score, 0) / orgsInCat.length) : 0;
                          
                          let gradeBadge = 'text-slate-400';
                          if (avgKpi >= 90) gradeBadge = 'text-emerald-600 font-bold';
                          else if (avgKpi >= 75) gradeBadge = 'text-blue-600 font-bold';
                          else if (avgKpi >= 60) gradeBadge = 'text-amber-600 font-bold';
                          else if (avgKpi > 0) gradeBadge = 'text-rose-600 font-bold';

                          return (
                            <tr key={cat} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 font-bold text-slate-900">{cat}</td>
                              <td className="px-4 py-2.5 text-center">{orgsInCat.length}</td>
                              <td className="px-4 py-2.5 text-center">{totalProjs}</td>
                              <td className="px-4 py-2.5 text-center">{totalVols}</td>
                              <td className="px-4 py-2.5 text-center">{totalHrs.toFixed(1)} ч</td>
                              <td className={`px-4 py-2.5 text-center ${gradeBadge}`}>{avgKpi > 0 ? `${avgKpi.toFixed(1)}%` : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section: Recent KPI Audits */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-slate-400 font-bold" />
                    Последние проверки отчетов и KPI-аудиты
                  </h4>
                  <div className="space-y-2.5">
                    {rawCheckins.filter(c => c.kpi_score !== undefined && c.kpi_score !== null).slice(0, 4).map(audit => {
                      const volunteer = rawUsers.find(u => u.id === audit.user_id);
                      const project = rawProjects.find(p => p.id === audit.project_id);
                      return (
                        <div key={audit.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{volunteer?.full_name || 'Волонтер'}</span>
                              <span className="text-[9px] text-slate-400 font-bold">•</span>
                              <span className="text-slate-500 font-medium">Проект: {project?.title || 'Общие задачи'}</span>
                            </div>
                            <p className="text-[10px] text-slate-650 leading-normal">
                              💬 Отзыв координатора <span className="font-bold text-slate-800">({audit.reviewed_by})</span>: "{audit.feedback || 'без комментария'}"
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                            <div className="text-right">
                              <span className="font-bold text-emerald-600 block">{'★'.repeat(audit.kpi_score)} ({audit.kpi_score}/5)</span>
                              <span className="text-[8px] text-slate-400 block font-mono">{new Date(audit.reviewed_at || audit.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 1: Volunteers List */}
            {activeLeaderboard === 'volunteers' && (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/25">
                    <th className="px-6 py-3 w-16 text-center">Ранг</th>
                    <th className="px-6 py-3">Имя Волонтера</th>
                    <th className="px-6 py-3 text-center">Уровень</th>
                    <th className="px-6 py-3 text-center">Опыт (XP)</th>
                    <th className="px-6 py-3 text-center">KPI Рейтинг</th>
                    <th className="px-6 py-3 text-center">Награды</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((vol, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr key={vol.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-center">
                          <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-[11px] ${
                            rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            rank === 2 ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            rank === 3 ? 'bg-orange-50 text-orange-800 border border-orange-100' :
                            'text-slate-400'
                          }`}>
                            {rank}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          {vol.full_name}
                          {rank === 1 && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold text-slate-700">{vol.level} уровень</td>
                        <td className="px-6 py-3.5 text-center font-semibold text-slate-800">{vol.xp} XP</td>
                        <td className="px-6 py-3.5 text-center font-bold text-emerald-600">★ {vol.rating.toFixed(1)}</td>
                        <td className="px-6 py-3.5 text-center font-medium text-slate-500">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-800">
                            🏆 {vol.badges_count} наград
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Tab 2: Organizations List */}
            {activeLeaderboard === 'organizations' && (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/25">
                    <th className="px-6 py-3 w-16 text-center">Ранг</th>
                    <th className="px-6 py-3">Организация</th>
                    <th className="px-6 py-3 text-center">Категория</th>
                    <th className="px-6 py-3 text-center">Оценка</th>
                    <th className="px-6 py-3 text-center">Задачи (SLA)</th>
                    <th className="px-6 py-3 text-center">Часы</th>
                    <th className="px-6 py-3 text-center">KPI Score</th>
                    <th className="px-6 py-3 text-center">Класс</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org, idx) => {
                    const rank = idx + 1;
                    
                    const gradeColors = {
                      A: 'bg-emerald-50 text-emerald-700 border-emerald-250 text-emerald-800',
                      B: 'bg-blue-50 text-blue-700 border-blue-250 text-blue-800',
                      C: 'bg-amber-50 text-amber-700 border-amber-250 text-amber-800',
                      D: 'bg-rose-50 text-rose-700 border-rose-250 text-rose-800'
                    }[org.grade] || 'bg-slate-50 text-slate-700 border-slate-200';

                    return (
                      <tr key={org.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-center">
                          <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-[11px] ${
                            rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            rank === 2 ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            rank === 3 ? 'bg-orange-50 text-orange-800 border border-orange-100' :
                            'text-slate-400'
                          }`}>
                            {rank}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">{org.name}</td>
                        <td className="px-6 py-3.5 text-center text-slate-500 font-medium">{org.category}</td>
                        <td className="px-6 py-3.5 text-center font-semibold text-emerald-600">★ {org.avg_rating.toFixed(1)}</td>
                        <td className="px-6 py-3.5 text-center font-medium text-slate-600">{(org.task_rate * 100).toFixed(0)}%</td>
                        <td className="px-6 py-3.5 text-center font-extrabold text-slate-800">
                          {org.total_hours} ч
                        </td>
                        <td className="px-6 py-3.5 text-center font-black text-slate-900 text-sm">{org.kpi_score.toFixed(1)}%</td>
                        <td className="px-6 py-3.5 text-center font-bold">
                          <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${gradeColors}`}>
                            {org.grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Document & Certificates Generator */}
        <div className="space-y-6">
          <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Генератор документов
              </h3>
              <p className="text-[10px] text-slate-400">Формирование официальных справок и грамот</p>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Template Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Тип документа</label>
                <select
                  value={selectedDocTemplate}
                  onChange={(e) => setSelectedDocTemplate(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="appreciation">Благодарственное письмо (Грамота)</option>
                  <option value="hours_summary">Справка об отработанных часах</option>
                  <option value="regional_report">Сводный отчет по деятельности</option>
                </select>
              </div>

              {/* Volunteer Select (disabled for regional reports) */}
              {selectedDocTemplate !== 'regional_report' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Получатель (Волонтер)</label>
                  <select
                    value={selectedVolunteerId}
                    onChange={(e) => setSelectedVolunteerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {volunteers.map(v => (
                      <option key={v.id} value={v.id}>{v.full_name} ({v.xp} XP)</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerateDoc}
                disabled={docLoading || (selectedDocTemplate !== 'regional_report' && !selectedVolunteerId)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {docLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Формирование...
                  </>
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5" />
                    Сформировать документ
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Quick instructions box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 space-y-2 leading-relaxed">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider">Генерация справок для МинЮста и ВУЗов</h4>
            <p>
              Вы можете автоматически формировать официальные справки об отработанных волонтером часах на бланке организации. Документ содержит дату чек-инов, виды работ и ID подписи для проверки подлинности.
            </p>
          </div>
        </div>

      </div>

      {/* Document Preview Modal */}
      {generatedHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-slate-100 rounded-xl border border-slate-200 shadow-2xl w-[700px] max-w-full flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">{generatedTitle}</h3>
              </div>
              <button 
                onClick={() => setGeneratedHtml(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Preview (HTML Embedded) */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
              <div 
                className="w-full bg-white rounded-lg shadow-sm border border-slate-200 p-2 overflow-hidden" 
                dangerouslySetInnerHTML={{ __html: generatedHtml }} 
              />
            </div>

            {/* Modal Footer actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-2 rounded-b-xl">
              <button
                onClick={() => setGeneratedHtml(null)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-500 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Закрыть
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Открыть печать / PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
