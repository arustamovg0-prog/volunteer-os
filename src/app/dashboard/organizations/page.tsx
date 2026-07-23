'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Newspaper, 
  Users2, 
  Award, 
  Phone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  X, 
  Send, 
  FileText, 
  Layers, 
  AlertCircle, 
  Calendar,
  ShieldAlert,
  Hash,
  Target,
  Network,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface VolunteerOrganization {
  id: string;
  name: string;
  description: string;
  category: 'Экология' | 'Защита животных' | 'Социальная помощь' | 'Здравоохранение' | 'Образование';
  avatar_url?: string | null;
  contacts: string;
  created_at: string;
  goals?: string;
  leader_name?: string;
  org_structure?: string;
}

interface OrganizationNews {
  id: string;
  org_id: string;
  title: string;
  content: string;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  role: string;
  phone?: string | null;
  telegram_id?: number | null;
  rating: number;
}

interface OrganizationMembership {
  id: string;
  org_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  cover_letter?: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    phone?: string | null;
    telegram_id?: number | null;
    rating: number;
  } | null;
  org?: {
    id: string;
    name: string;
  } | null;
}

interface Task {
  id: string;
  project_id: string;
  assigned_to?: string | null;
  title: string;
  deadline: string;
  status: 'pending' | 'accepted' | 'completed';
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

interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'planning' | 'active' | 'completed';
  org_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export default function ManagerOrganizationsPage() {
  const [organizations, setOrganizations] = useState<VolunteerOrganization[]>([]);
  const [news, setNews] = useState<OrganizationNews[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Current authenticated role
  const [role, setRole] = useState('manager'); // 'admin' (Director) vs 'manager' (Coordinator)

  // Modals / Drawer State
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isPostNewsOpen, setIsPostNewsOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<OrganizationMembership | null>(null);
  
  // Organization Detail Drawer State
  const [selectedOrgDetail, setSelectedOrgDetail] = useState<VolunteerOrganization | null>(null);
  const [orgDetailTab, setOrgDetailTab] = useState<'info' | 'structure' | 'members' | 'news' | 'projects'>('info');

  // Form states
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgCategory, setOrgCategory] = useState<'Экология' | 'Защита животных' | 'Социальная помощь' | 'Здравоохранение' | 'Образование'>('Экология');
  const [orgContacts, setOrgContacts] = useState('');
  const [orgGoals, setOrgGoals] = useState('');
  const [orgLeaderName, setOrgLeaderName] = useState('');
  const [orgStructure, setOrgStructure] = useState('');

  const [newsOrgId, setNewsOrgId] = useState('');
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole');
    if (savedRole) setRole(savedRole);

    const handleRoleChange = () => {
      const updated = localStorage.getItem('currentUserRole');
      if (updated) setRole(updated);
    };

    window.addEventListener('auth-session-change', handleRoleChange);
    fetchData();

    return () => window.removeEventListener('auth-session-change', handleRoleChange);
  }, []);

  async function fetchData() {
    try {
      const [orgsRes, newsRes, membRes, tasksRes, checkinsRes, projectsRes] = await Promise.all([
        fetch('/api/organizations'),
        fetch('/api/organizations/news'),
        fetch('/api/organizations/memberships'),
        fetch('/api/tasks'),
        fetch('/api/checkins'),
        fetch('/api/projects')
      ]);

      setOrganizations(await orgsRes.json());
      setNews(await newsRes.json());
      setMemberships(await membRes.json());
      setTasks(await tasksRes.json());
      setCheckins((await checkinsRes.json()).checkins || []);
      setProjects(await projectsRes.json());
    } catch (e) {
      console.error('Failed to fetch data for manager organizations page:', e);
    } finally {
      setLoading(false);
    }
  }

  // Action handlers
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') {
      alert('Ошибка доступа: создавать организации может только Руководитель (Директор)');
      return;
    }
    if (!orgName.trim() || !orgDesc.trim()) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          description: orgDesc,
          category: orgCategory,
          contacts: orgContacts,
          goals: orgGoals,
          leader_name: orgLeaderName,
          org_structure: orgStructure
        })
      });

      if (res.ok) {
        setAlertMessage('Организация успешно создана!');
        setTimeout(() => setAlertMessage(null), 3000);
        setIsCreateOrgOpen(false);
        setOrgName('');
        setOrgDesc('');
        setOrgContacts('');
        setOrgGoals('');
        setOrgLeaderName('');
        setOrgStructure('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsOrgId || !newsTitle.trim() || !newsContent.trim()) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/organizations/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: newsOrgId,
          title: newsTitle,
          content: newsContent
        })
      });

      if (res.ok) {
        setAlertMessage('Новость опубликована!');
        setTimeout(() => setAlertMessage(null), 3000);
        setIsPostNewsOpen(false);
        setNewsTitle('');
        setNewsContent('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMembership = async (membershipId: string, status: 'approved' | 'rejected') => {
    if (role !== 'admin') {
      alert('Ошибка доступа: Одобрять и отклонять заявки может только Руководитель (Директор)');
      return;
    }
    setActionLoading(true);

    try {
      const res = await fetch('/api/organizations/memberships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: membershipId,
          status
        })
      });

      if (res.ok) {
        setAlertMessage(status === 'approved' ? 'Заявка одобрена!' : 'Заявка отклонена');
        setTimeout(() => setAlertMessage(null), 3000);
        setSelectedMembership(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24 bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const pendingMemberships = memberships.filter(m => m.status === 'pending');

  // Selected Org Details Sub-Collections
  const selectedOrgNews = selectedOrgDetail ? news.filter(n => n.org_id === selectedOrgDetail.id) : [];
  const selectedOrgProjects = selectedOrgDetail ? projects.filter(p => p.org_id === selectedOrgDetail.id) : [];
  const selectedOrgMembers = selectedOrgDetail ? memberships.filter(m => m.org_id === selectedOrgDetail.id && m.status === 'approved') : [];

  // Dynamic organization composite KPI calculation
  let orgKpiScore = 0;
  let orgKpiGrade: 'A' | 'B' | 'C' | 'D' = 'D';
  if (selectedOrgDetail) {
    const orgProjIds = selectedOrgProjects.map(p => p.id);
    
    // 1. Avg Volunteer Rating under this organization
    const orgCheckins = checkins.filter(ci => ci.project_id && orgProjIds.includes(ci.project_id));
    const gradedCheckins = orgCheckins.filter(ci => ci.kpi_score !== undefined && ci.kpi_score !== null);
    const avgRating = gradedCheckins.length > 0
      ? gradedCheckins.reduce((sum, ci) => sum + (ci.kpi_score || 0), 0) / gradedCheckins.length
      : 4.0; // default 4.0

    // 2. Task Completion Rate
    const orgTasks = tasks.filter(t => orgProjIds.includes(t.project_id));
    const completedTasks = orgTasks.filter(t => t.status === 'completed');
    const taskRate = orgTasks.length > 0
      ? completedTasks.length / orgTasks.length
      : 0.9; // default 90%

    // 3. Involvement Index (Hours / (Volunteers * 10))
    const totalHours = orgCheckins.reduce((sum, ci) => sum + (ci.hours || 0), 0);
    const volunteersCount = new Set(orgCheckins.map(ci => ci.user_id)).size;
    const involvementIndex = volunteersCount > 0
      ? Math.min(100, (totalHours / (volunteersCount * 10)) * 100)
      : 0;

    // Composite KPI formula: 40% rating, 30% tasks, 30% involvement
    orgKpiScore = Math.round((0.4 * (avgRating * 20) + 0.3 * (taskRate * 100) + 0.3 * involvementIndex) * 10) / 10;

    // Letter grade
    if (orgKpiScore >= 90) orgKpiGrade = 'A';
    else if (orgKpiScore >= 75) orgKpiGrade = 'B';
    else if (orgKpiScore >= 60) orgKpiGrade = 'C';
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Toast Alert */}
      {alertMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Волонтерские организации</h2>
          <p className="text-xs text-slate-500 mt-1">
            Каталог организаций, публикация новостей и модерация заявок на вступление волонтеров
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPostNewsOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Newspaper className="w-4 h-4" />
            Опубликовать новость
          </button>
          
          {role === 'admin' ? (
            <button
              onClick={() => setIsCreateOrgOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all duration-155 active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Создать организацию
            </button>
          ) : (
            <div className="relative group">
              <button
                disabled
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-semibold text-xs flex items-center gap-1.5 cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Создать организацию
              </button>
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 rounded-lg bg-slate-950 text-[10px] text-white text-center shadow-lg leading-normal">
                Создание организаций доступно только в Режиме Директора.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mode Indicator if Coordinator */}
      {role !== 'admin' && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Вы вошли как <strong>Координатор</strong>. Доступ к созданию организаций и модерации заявок волонтеров ограничен (требуется режим <strong>Директора</strong>).</span>
        </div>
      )}

      {/* Grid: Organizations list */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Все организации ({organizations.length}) (Кликните для просмотра профиля)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizations.map(org => {
            const orgNews = news.filter(n => n.org_id === org.id);
            const orgMembers = memberships.filter(m => m.org_id === org.id && m.status === 'approved');

            return (
              <div 
                key={org.id} 
                onClick={() => {
                  setSelectedOrgDetail(org);
                  setOrgDetailTab('info');
                }}
                className="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-400 transition-all cursor-pointer shadow-sm space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-bold border border-slate-200 bg-slate-50 text-slate-700">
                      {org.category}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">Создано: {new Date(org.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-slate-750 flex items-center gap-1.5">
                    {org.name}
                    <ChevronRight className="w-4 h-4 text-slate-350 transition-transform group-hover:translate-x-0.5" />
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{org.description}</p>
                </div>

                <div className="border-t border-slate-100 pt-3.5 mt-2 flex justify-between items-center text-[10px] text-slate-500 font-medium">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <Users2 className="w-3.5 h-3.5 text-slate-400" />
                      Участники: <strong>{orgMembers.length}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Newspaper className="w-3.5 h-3.5 text-slate-400" />
                      Новости: <strong>{orgNews.length}</strong>
                    </span>
                  </div>
                  <span className="text-slate-450 truncate max-w-[40%]">{org.contacts}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Applications Moderation Queue */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Заявки волонтеров на модерации ({pendingMemberships.length})</h3>
        
        {pendingMemberships.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white">
            Активных заявок на вступление нет.
          </div>
        ) : (
          <div className="glass-panel overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                    <th className="py-4 px-6">Волонтер</th>
                    <th className="py-4 px-4">Организация</th>
                    <th className="py-4 px-4">Контакты</th>
                    <th className="py-4 px-4">Рейтинг волонтера</th>
                    <th className="py-4 px-4">Дата подачи</th>
                    <th className="py-4 px-6 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {pendingMemberships.map(memb => {
                    const ratingVal = memb.user?.rating ?? 5.0;
                    return (
                      <tr 
                        key={memb.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-slate-900">
                          <button
                            onClick={() => setSelectedMembership(memb)}
                            className="hover:underline text-left cursor-pointer"
                          >
                            {memb.user?.full_name || 'Неизвестный волонтер'}
                          </button>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-800">
                          {memb.org?.name || 'Удаленная орг.'}
                        </td>
                        <td className="py-4 px-4 space-y-0.5 text-slate-600">
                          <div>{memb.user?.phone || '—'}</div>
                          {memb.user?.telegram_id && (
                            <div className="text-[10px] text-slate-400">TG: {memb.user.telegram_id}</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-150 font-bold text-[10px]">
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            {ratingVal.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-[10px]">
                          {new Date(memb.created_at).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => setSelectedMembership(memb)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700 transition-all cursor-pointer"
                          >
                            Профиль
                          </button>

                          {role === 'admin' ? (
                            <>
                              <button
                                onClick={() => handleUpdateMembership(memb.id, 'approved')}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                              >
                                Принять
                              </button>
                              <button
                                onClick={() => handleUpdateMembership(memb.id, 'rejected')}
                                className="px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Отклонить
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                disabled
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-350 text-[10px] font-bold cursor-not-allowed"
                                title="Модерация доступна только в режиме Директора"
                              >
                                Принять
                              </button>
                              <button
                                disabled
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-350 text-[10px] font-bold cursor-not-allowed"
                                title="Модерация доступна только в режиме Директора"
                              >
                                Отклонить
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Organization */}
      {isCreateOrgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Создание волонтерской организации</h3>
              <button 
                onClick={() => setIsCreateOrgOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-650 font-bold">Название организации</label>
                <input
                  type="text"
                  required
                  placeholder="ЭкоПатруль Самара"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-650 font-bold">Категория деятельности</label>
                <select
                  value={orgCategory}
                  onChange={(e) => setOrgCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Экология">Экология</option>
                  <option value="Защита животных">Защита животных</option>
                  <option value="Социальная помощь">Социальная помощь</option>
                  <option value="Здравоохранение">Здравоохранение</option>
                  <option value="Образование">Образование</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-650 font-bold">Описание деятельности</label>
                <textarea
                  required
                  placeholder="Опишите цели, миссию и направления работы организации..."
                  rows={2}
                  value={orgDesc}
                  onChange={(e) => setOrgDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-650 font-bold">Цели организации</label>
                <textarea
                  placeholder="1. Сократить отходы...\n2. Очистить Волгу..."
                  rows={2}
                  value={orgGoals}
                  onChange={(e) => setOrgGoals(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-650 font-bold">Руководитель / Ответственный</label>
                <input
                  type="text"
                  placeholder="Иван Иванов (Старший координатор)"
                  value={orgLeaderName}
                  onChange={(e) => setOrgLeaderName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-650 font-bold">Организационная структура</label>
                <textarea
                  placeholder="Руководитель -> Кураторы -> Волонтеры"
                  rows={2}
                  value={orgStructure}
                  onChange={(e) => setOrgStructure(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-650 font-bold">Контакты (Email, телефон)</label>
                <input
                  type="text"
                  placeholder="eco@vol.ru | +7 (846) 555-01-01"
                  value={orgContacts}
                  onChange={(e) => setOrgContacts(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-2 justify-end border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateOrgOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Post News */}
      {isPostNewsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Публикация новости организации</h3>
              <button 
                onClick={() => setIsPostNewsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostNews} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-650 font-bold">Организация-автор</label>
                <select
                  required
                  value={newsOrgId}
                  onChange={(e) => setNewsOrgId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">-- Выберите организацию --</option>
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-650 font-bold">Заголовок новости</label>
                <input
                  type="text"
                  required
                  placeholder="Субботник в Загородном парке!"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-650 font-bold">Текст новости</label>
                <textarea
                  required
                  placeholder="Опишите событие, результаты или важную информацию для волонтеров..."
                  rows={4}
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsPostNewsOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!newsOrgId || actionLoading}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Опубликовать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Drawer: Candidate Profile Details */}
      {selectedMembership && selectedMembership.user && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 shadow-xl flex flex-col justify-between overflow-y-auto animate-fade-in">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-md font-bold text-slate-900">{selectedMembership.user.full_name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Профиль Кандидата в {selectedMembership.org?.name}</p>
                </div>
                <button 
                  onClick={() => setSelectedMembership(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cover Letter Panel */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Сопроводительное письмо
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic leading-relaxed">
                  "{selectedMembership.cover_letter || 'Кандидат не оставил сопроводительного письма.'}"
                </div>
              </div>

              {/* Contacts info grid */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Номер телефона:</span>
                  <span className="font-semibold">{selectedMembership.user.phone || 'Не указан'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Telegram ID:</span>
                  <span className="font-semibold">{selectedMembership.user.telegram_id || 'Не привязан'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Рейтинг эффективности KPI:</span>
                  <span className="font-bold flex items-center gap-1 text-slate-950">
                    <Award className="w-3.5 h-3.5 text-slate-700" />
                    {selectedMembership.user.rating.toFixed(2)} / 5.0
                  </span>
                </div>
              </div>

              {/* Active tasks list */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Текущие задачи волонтера ({tasks.filter(t => t.assigned_to === selectedMembership.user_id && t.status !== 'completed').length})
                </h4>
                {tasks.filter(t => t.assigned_to === selectedMembership.user_id && t.status !== 'completed').length === 0 ? (
                  <p className="text-center py-4 text-slate-350 text-xs border border-dashed border-slate-200 rounded-xl">Активных задач нет</p>
                ) : (
                  <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                    {tasks.filter(t => t.assigned_to === selectedMembership.user_id && t.status !== 'completed').map(task => (
                      <div key={task.id} className="p-3 rounded-lg border border-slate-100 bg-white flex items-center justify-between text-xs">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-semibold text-slate-900 truncate">{task.title}</p>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Срок: {new Date(task.deadline).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          task.status === 'accepted' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {task.status === 'accepted' ? 'В работе' : 'Принята'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Check-ins activity logs */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Выполненная работа (логи чек-инов)
                </h4>
                {checkins.filter(c => c.user_id === selectedMembership.user_id).length === 0 ? (
                  <p className="text-center py-4 text-slate-350 text-xs border border-dashed border-slate-200 rounded-xl">История чек-инов отсутствует</p>
                ) : (
                  <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                    {checkins.filter(c => c.user_id === selectedMembership.user_id).map(ch => {
                      const proj = projects.find(p => p.id === ch.project_id);
                      return (
                        <div key={ch.id} className="p-3 rounded-lg border border-slate-100 bg-white space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[10px] text-slate-450">
                            <span className="font-semibold text-slate-700 truncate max-w-[150px]">{proj ? proj.title : 'Общие задачи'}</span>
                            <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-950 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                              <Clock className="w-3.5 h-3.5 text-slate-450" />
                              {ch.hours} ч.
                            </span>
                          </div>
                          <p className="text-slate-650 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">"{ch.text_report}"</p>
                          <span className="text-[9px] text-slate-400 block text-right">{new Date(ch.created_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-8 border-t border-slate-150 pt-4 flex gap-3">
              {role === 'admin' ? (
                <>
                  <button 
                    onClick={() => handleUpdateMembership(selectedMembership.id, 'rejected')}
                    className="flex-1 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    Отклонить
                  </button>
                  <button 
                    onClick={() => handleUpdateMembership(selectedMembership.id, 'approved')}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    Одобрить заявку
                  </button>
                </>
              ) : (
                <div className="w-full space-y-2 text-center">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    Модерация доступна только Директору
                  </div>
                  <button 
                    onClick={() => setSelectedMembership(null)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Закрыть профиль
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Drawer: Detailed Organization Profile for Managers */}
      {selectedOrgDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 shadow-xl flex flex-col justify-between overflow-y-auto animate-fade-in">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 bg-slate-50/20 p-2 rounded-xl">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-bold border border-slate-250 bg-slate-50 text-slate-700">
                      {selectedOrgDetail.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-900 text-white shadow-sm">
                      KPI: {orgKpiScore.toFixed(1)}%
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                      orgKpiGrade === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      orgKpiGrade === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      orgKpiGrade === 'C' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      Класс {orgKpiGrade}
                    </span>
                  </div>
                  <h3 className="text-md font-bold text-slate-900 mt-1.5">{selectedOrgDetail.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Создана: {new Date(selectedOrgDetail.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrgDetail(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar text-[10px] uppercase font-bold tracking-wider">
                <button
                  onClick={() => setOrgDetailTab('info')}
                  className={`py-2 px-3 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                    orgDetailTab === 'info' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                  }`}
                >
                  Описание и цели
                </button>
                <button
                  onClick={() => setOrgDetailTab('structure')}
                  className={`py-2 px-3 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                    orgDetailTab === 'structure' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                  }`}
                >
                  Оргструктура
                </button>
                <button
                  onClick={() => setOrgDetailTab('members')}
                  className={`py-2 px-3 whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
                    orgDetailTab === 'members' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                  }`}
                >
                  Участники ({selectedOrgMembers.length})
                </button>
                <button
                  onClick={() => setOrgDetailTab('news')}
                  className={`py-2 px-3 whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
                    orgDetailTab === 'news' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                  }`}
                >
                  Новости ({selectedOrgNews.length})
                </button>
                <button
                  onClick={() => setOrgDetailTab('projects')}
                  className={`py-2 px-3 whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
                    orgDetailTab === 'projects' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                  }`}
                >
                  Проекты ({selectedOrgProjects.length})
                </button>
              </div>

              {/* Drawer tab content */}
              <div className="space-y-4">
                {/* 1. Info & Goals */}
                {orgDetailTab === 'info' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Описание деятельности</h4>
                      <p className="text-xs text-slate-650 leading-relaxed bg-slate-55 p-3.5 rounded-xl border border-slate-150">
                        {selectedOrgDetail.description}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-blue-500" />
                        Цели организации
                      </h4>
                      <p className="text-xs text-slate-650 leading-relaxed bg-blue-50/10 p-3.5 rounded-xl border border-blue-150 whitespace-pre-line font-medium">
                        {selectedOrgDetail.goals || 'Цели пока не сформулированы.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Контакты и коммуникация</h4>
                      <p className="text-xs text-slate-800 font-bold bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {selectedOrgDetail.contacts}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Structure */}
                {orgDetailTab === 'structure' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ответственное лицо (Руководитель)</span>
                        <span className="text-xs font-bold text-slate-900 block mt-0.5">{selectedOrgDetail.leader_name || 'Не назначен'}</span>
                      </div>
                      <div className="border-t border-slate-200/50 pt-2 mt-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Контакты руководителя</span>
                        <span className="text-xs text-slate-650 block mt-0.5">{selectedOrgDetail.contacts}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Network className="w-3.5 h-3.5 text-blue-500" />
                        Организационная структура
                      </h4>
                      <p className="text-xs text-slate-650 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200 whitespace-pre-line font-medium shadow-sm">
                        {selectedOrgDetail.org_structure || 'Схема оргструктуры не добавлена.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Members List */}
                {orgDetailTab === 'members' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Список участников ({selectedOrgMembers.length})</span>
                    {selectedOrgMembers.length === 0 ? (
                      <p className="text-center py-6 text-slate-350 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50">Участников пока нет</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
                        {selectedOrgMembers.map(memb => {
                          const ratingVal = memb.user?.rating ?? 5.0;
                          return (
                            <div key={memb.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-sm">
                              <div>
                                <span className="font-bold text-slate-950 block">{memb.user?.full_name || 'Имя не указано'}</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5">Присоединен: {new Date(memb.created_at).toLocaleDateString('ru-RU')}</span>
                              </div>
                              <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-150 font-bold text-[10px]">
                                <Award className="w-3.5 h-3.5" />
                                {ratingVal.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. News */}
                {orgDetailTab === 'news' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Новости организации ({selectedOrgNews.length})</span>
                    {selectedOrgNews.length === 0 ? (
                      <p className="text-center py-6 text-slate-350 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50">Нет новостей</p>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-0.5">
                        {selectedOrgNews.map(item => (
                          <div key={item.id} className="p-3.5 rounded-xl border border-slate-150 bg-slate-50/30 space-y-2 text-xs">
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold">
                              <span>Новость</span>
                              <span>{new Date(item.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 leading-snug">{item.title}</h4>
                            <p className="text-slate-650 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Projects & Tasks */}
                {orgDetailTab === 'projects' && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Проекты организации ({selectedOrgProjects.length})</span>
                    {selectedOrgProjects.length === 0 ? (
                      <p className="text-center py-6 text-slate-350 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50">Проектов нет</p>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-0.5">
                        {selectedOrgProjects.map(project => {
                          const projTasks = tasks.filter(t => t.project_id === project.id);
                          const completed = projTasks.filter(t => t.status === 'completed').length;
                          const progress = projTasks.length > 0 ? Math.round((completed / projTasks.length) * 100) : 0;
                          
                          const badgeColor = {
                            planning: 'bg-amber-50 text-amber-700 border-amber-100',
                            active: 'bg-blue-50 text-blue-700 border-blue-100',
                            completed: 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }[project.status];

                          return (
                            <div key={project.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${badgeColor}`}>
                                  {project.status === 'planning' ? 'Подготовка' : project.status === 'active' ? 'Активен' : 'Завершен'}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900">{project.title}</h4>
                              <p className="text-[10px] text-slate-550">{project.description}</p>
                              
                              <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold">
                                  <span>Выполнено задач</span>
                                  <span className="text-slate-900">{completed} / {projTasks.length} ({progress}%)</span>
                                </div>
                                <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                  <div className="h-full bg-slate-900 rounded-full" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-slate-150 pt-4">
              <button 
                onClick={() => setSelectedOrgDetail(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Закрыть профиль
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
