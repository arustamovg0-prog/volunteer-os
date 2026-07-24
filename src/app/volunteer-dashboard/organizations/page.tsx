'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Newspaper, 
  FolderGit2, 
  CheckCircle2, 
  X, 
  Send,
  MessageSquare, 
  Clock, 
  Calendar,
  AlertCircle,
  Phone,
  Sparkles,
  ArrowRight,
  ChevronRight,
  FileText,
  Users2,
  Award,
  Network,
  Target,
  UserCheck
} from 'lucide-react';
import VolunteerBottomNav from '@/components/VolunteerBottomNav';
import Link from 'next/link';

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
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed';
  org_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

interface Task {
  id: string;
  project_id: string;
  assigned_to?: string | null;
  title: string;
  deadline: string;
  status: 'pending' | 'accepted' | 'completed';
  is_overdue: boolean;
}

interface User {
  id: string;
  full_name: string;
  role: string;
  phone?: string | null;
  rating: number;
}

export default function VolunteerOrganizationsPage() {
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  const [volunteer, setVolunteer] = useState<User | null>(null);
  const [allVolunteers, setAllVolunteers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Data State
  const [organizations, setOrganizations] = useState<VolunteerOrganization[]>([]);
  const [news, setNews] = useState<OrganizationNews[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  
  // Sign-in Form
  const [selectedVolId, setSelectedVolId] = useState('');

  // UI Detail Drawer / Modal
  const [selectedOrg, setSelectedOrg] = useState<VolunteerOrganization | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'structure' | 'members' | 'news' | 'projects'>('info');
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Loaded Organization Members State
  const [orgMembers, setOrgMembers] = useState<OrganizationMembership[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const categories = ['Все', 'Экология', 'Защита животных', 'Социальная помощь', 'Здравоохранение', 'Образование'];

  useEffect(() => {
    const cachedId = localStorage.getItem('volunteerId') || localStorage.getItem('currentUserId');
    if (cachedId) {
      localStorage.setItem('volunteerId', cachedId);
    }
    setVolunteerId(cachedId);
    loadInitialData(cachedId);
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      loadOrgMembers(selectedOrg.id);
    } else {
      setOrgMembers([]);
    }
  }, [selectedOrg]);

  async function loadInitialData(currentId: string | null) {
    setLoading(true);
    try {
      const usersRes = await fetch('/api/users');
      const usersData: User[] = await usersRes.json();
      const vols = usersData.filter(u => u.role === 'volunteer');
      setAllVolunteers(vols);

      if (currentId) {
        const found = vols.find(u => u.id === currentId);
        if (found) {
          setVolunteer(found);
          const [orgsRes, newsRes, membRes, projRes, tasksRes] = await Promise.all([
            fetch('/api/organizations'),
            fetch('/api/organizations/news'),
            fetch(`/api/organizations/memberships?userId=${currentId}`),
            fetch('/api/projects'),
            fetch('/api/tasks')
          ]);
          setOrganizations(await orgsRes.json());
          setNews(await newsRes.json());
          setMemberships(await membRes.json());
          setProjects(await projRes.json());
          setTasks(await tasksRes.json());
        } else {
          // Keep currentId if user exists
          setVolunteer({ id: currentId, full_name: localStorage.getItem('currentUserName') || 'Волонтер', role: 'volunteer', rating: 5.0 });
          const [orgsRes, newsRes, membRes, projRes, tasksRes] = await Promise.all([
            fetch('/api/organizations'),
            fetch('/api/organizations/news'),
            fetch(`/api/organizations/memberships?userId=${currentId}`),
            fetch('/api/projects'),
            fetch('/api/tasks')
          ]);
          setOrganizations(await orgsRes.json());
          setNews(await newsRes.json());
          setMemberships(await membRes.json());
          setProjects(await projRes.json());
          setTasks(await tasksRes.json());
        }
      }
    } catch (e) {
      console.error('Failed to load organizations page data', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrgMembers(orgId: string) {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/organizations/memberships?orgId=${orgId}&status=approved`);
      if (res.ok) {
        setOrgMembers(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch org members:', e);
    } finally {
      setLoadingMembers(false);
    }
  }

  const handleLogin = () => {
    if (!selectedVolId) return;
    localStorage.setItem('volunteerId', selectedVolId);
    setVolunteerId(selectedVolId);
    loadInitialData(selectedVolId);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeUserId = volunteerId || localStorage.getItem('volunteerId') || localStorage.getItem('currentUserId');
    if (!selectedOrg || !activeUserId) {
      alert('Пожалуйста, войдите в систему под профилем волонтера.');
      return;
    }
    setIsSubmittingJoin(true);

    try {
      const res = await fetch('/api/organizations/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: selectedOrg.id,
          user_id: activeUserId,
          cover_letter: coverLetter
        })
      });

      if (res.ok) {
        setAlertMessage('🎉 Заявка на вступление успешно отправлена!');
        setTimeout(() => setAlertMessage(null), 4000);
        setCoverLetter('');
        
        // Refresh memberships
        const membRes = await fetch(`/api/organizations/memberships?userId=${activeUserId}`);
        if (membRes.ok) {
          setMemberships(await membRes.json());
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Ошибка при отправке заявки');
      }
    } catch (err) {
      console.error('Failed to send join request', err);
      alert('Ошибка сети при отправке заявки.');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const getMembershipStatus = (orgId: string) => {
    const memb = memberships.find(m => m.org_id === orgId);
    return memb ? memb.status : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // --- SIGN-IN SCREEN ---
  if (!volunteerId || !volunteer) {
    return (
      <main className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-center animate-fade-in">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Каталог организаций</h2>
            <p className="text-xs text-slate-500 mt-1">
              Выберите свой профиль для доступа к списку организаций
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ваш профиль</label>
              <select
                value={selectedVolId}
                onChange={(e) => setSelectedVolId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              >
                <option value="">-- Выберите профиль --</option>
                {allVolunteers.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.full_name} ({v.phone || 'без телефона'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLogin}
              disabled={!selectedVolId}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:text-slate-400"
            >
              Войти в кабинет
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Filter organizations
  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          org.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Все' || org.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Details data for selected organization
  const selectedOrgNews = selectedOrg ? news.filter(n => n.org_id === selectedOrg.id) : [];
  const selectedOrgProjects = selectedOrg ? projects.filter(p => p.org_id === selectedOrg.id) : [];
  const activeMembership = selectedOrg ? memberships.find(m => m.org_id === selectedOrg.id) : null;

  // Category Color Helper
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Экология': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Защита животных': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Социальная помощь': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Здравоохранение': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Образование': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5 pb-20 animate-fade-in px-1">
      {/* Toast Alert */}
      {alertMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-slate-900" />
        <h2 className="text-base font-bold text-slate-900 leading-tight">Организации</h2>
      </div>

      {/* Current Volunteer Profile Card */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-[10px] text-slate-500 flex items-center justify-between shadow-sm">
        <span>Волонтер: <span className="text-slate-800 font-bold">{volunteer.full_name}</span></span>
        <span className="flex items-center gap-1">
          Рейтинг: <span className="text-slate-900 font-bold">{volunteer.rating ? volunteer.rating.toFixed(2) : '5.00'}</span>
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по названию или описанию..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 shadow-sm placeholder-slate-400"
        />
      </div>

      {/* Category Tabs Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Organizations Grid */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
          Найденные организации ({filteredOrgs.length})
        </h3>

        {filteredOrgs.length === 0 ? (
          <div className="glass-panel bg-white p-8 text-center text-slate-400 text-xs border border-slate-200 shadow-sm rounded-xl py-12">
            Организации не найдены. Попробуйте другой запрос или категорию.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrgs.map((org) => {
              const status = getMembershipStatus(org.id);
              return (
                <div
                  key={org.id}
                  onClick={() => {
                    setSelectedOrg(org);
                    setDetailTab('info');
                  }}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-sm hover:border-slate-350 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${getCategoryColor(org.category)}`}>
                        {org.category}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs mt-1.5 leading-snug group-hover:text-slate-700 flex items-center gap-1">
                        {org.name}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                      </h4>
                    </div>

                    {status === 'approved' && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded text-[8px] font-bold">
                        Вы участник
                      </span>
                    )}
                    {status === 'pending' && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-150 px-2 py-0.5 rounded text-[8px] font-bold">
                        На рассмотрении
                      </span>
                    )}
                    {status === 'rejected' && (
                      <span className="bg-rose-50 text-rose-700 border border-rose-150 px-2 py-0.5 rounded text-[8px] font-bold">
                        Отклонено
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                    {org.description}
                  </p>

                  <div className="text-[9px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between items-center">
                    <span className="truncate max-w-[80%]">Контакты: {org.contacts}</span>
                    <span className="font-bold text-slate-900 shrink-0">Подробнее</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal / Slide-over Drawer */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-150 flex items-start justify-between bg-slate-50/50">
              <div className="space-y-1.5 pr-6">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${getCategoryColor(selectedOrg.category)}`}>
                  {selectedOrg.category}
                </span>
                <h3 className="text-xs font-bold text-slate-900 leading-snug">{selectedOrg.name}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedOrg(null);
                  setCoverLetter('');
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-150 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs Scrollable */}
            <div className="flex items-center gap-2 border-b border-slate-200/80 overflow-x-auto no-scrollbar px-4 py-2.5 bg-slate-50/70 shrink-0">
              <button
                type="button"
                onClick={() => setDetailTab('info')}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  detailTab === 'info'
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-150 border border-slate-200'
                }`}
              >
                Описание и цели
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('structure')}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  detailTab === 'structure'
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-150 border border-slate-200'
                }`}
              >
                Оргструктура
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('members')}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  detailTab === 'members'
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-150 border border-slate-200'
                }`}
              >
                Участники
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  detailTab === 'members' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {loadingMembers ? '...' : orgMembers.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('news')}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  detailTab === 'news'
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-150 border border-slate-200'
                }`}
              >
                Новости
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  detailTab === 'news' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedOrgNews.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('projects')}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  detailTab === 'projects'
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-150 border border-slate-200'
                }`}
              >
                Проекты
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  detailTab === 'projects' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedOrgProjects.length}
                </span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              
              {/* Tab 1: Info & Goals */}
              {detailTab === 'info' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      О деятельности
                    </h4>
                    <p className="text-[11px] text-slate-650 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      {selectedOrg.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-blue-500" />
                      Цели и задачи
                    </h4>
                    <p className="text-[11px] text-slate-650 leading-relaxed bg-gradient-to-r from-blue-50/20 to-slate-50/30 p-3.5 rounded-xl border border-slate-150 whitespace-pre-line font-medium">
                      {selectedOrg.goals || 'Цели организации пока находятся в стадии доработки.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Контакты организации
                    </h4>
                    <p className="text-[11px] text-slate-800 font-semibold leading-relaxed bg-slate-50/50 px-3 py-2.5 rounded-xl border border-slate-100">
                      {selectedOrg.contacts}
                    </p>
                  </div>

                  {/* Membership Form / Status */}
                  <div className="border-t border-slate-100 pt-4 mt-2">
                    {activeMembership ? (
                      <div className="p-3.5 rounded-xl border flex flex-col gap-2 bg-slate-50">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          {activeMembership.status === 'approved' && (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="text-slate-900">Вы состоящий участник</span>
                            </>
                          )}
                          {activeMembership.status === 'pending' && (
                            <>
                              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                              <span className="text-slate-900">Заявка на модерации</span>
                            </>
                          )}
                          {activeMembership.status === 'rejected' && (
                            <>
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              <span className="text-slate-900">Заявка была отклонена</span>
                            </>
                          )}
                        </div>
                        
                        {activeMembership.cover_letter && (
                          <div className="text-[10px] text-slate-500 border-t border-slate-200/60 pt-2 mt-1">
                            <span className="font-semibold block text-slate-600 mb-0.5">Сопроводительное письмо:</span>
                            "{activeMembership.cover_letter}"
                          </div>
                        )}

                        {activeMembership.status === 'approved' && (
                          <Link
                            href="/volunteer-dashboard/chats"
                            className="mt-2 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] text-center rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Перейти в чат организации
                          </Link>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleJoinSubmit} className="space-y-3">
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            Вступление в организацию
                          </h4>
                          <p className="text-[9px] text-slate-400 leading-normal">
                            Подайте заявку на вступление. Администратор изучит ваш профиль (рейтинг, чек-ины) и вынесет решение.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-bold uppercase block">Сопроводительное письмо</label>
                          <textarea
                            required
                            placeholder="Расскажите о себе, своих навыках и почему хотите помогать именно здесь..."
                            rows={3}
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 resize-none placeholder-slate-350"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingJoin}
                          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          <Send className="w-4 h-4" />
                          {isSubmittingJoin ? 'Отправка заявки...' : 'Отправить заявку'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Structure & Leadership */}
              {detailTab === 'structure' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="border-b border-slate-200/60 pb-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ответственный координатор / Руководитель</span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">{selectedOrg.leader_name || 'Не указан'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Контакты для прямой связи</span>
                      <span className="text-xs font-medium text-slate-650 block mt-0.5">{selectedOrg.contacts}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Network className="w-3.5 h-3.5 text-blue-500" />
                      Организационная структура
                    </h4>
                    <p className="text-[11px] text-slate-650 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200 whitespace-pre-line font-medium shadow-sm">
                      {selectedOrg.org_structure || 'Детальная схема организационной структуры находится в процессе наполнения.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Organization Members */}
              {detailTab === 'members' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Всего участников</span>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">{orgMembers.length} волонтеров</span>
                  </div>

                  {loadingMembers ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900 mx-auto"></div>
                    </div>
                  ) : orgMembers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-[10px] italic">
                      В этой организации пока нет утвержденных участников. Вы можете стать первым!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
                      {orgMembers.map((memb) => {
                        const ratingVal = memb.user?.rating ?? 5.0;
                        return (
                          <div key={memb.id} className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 text-xs">{memb.user?.full_name || 'Волонтер'}</span>
                              <span className="text-[9px] text-slate-400 block">Вступил: {new Date(memb.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>

                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-150 font-bold text-[9px]">
                              <Award className="w-3.5 h-3.5 shrink-0" />
                              {ratingVal.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: News Feed */}
              {detailTab === 'news' && (
                <div className="space-y-3">
                  {selectedOrgNews.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-[10px] italic">
                      Новости пока не опубликованы.
                    </div>
                  ) : (
                    selectedOrgNews.map((newsItem) => (
                      <div key={newsItem.id} className="p-3.5 rounded-xl border border-slate-150 bg-slate-50/30 space-y-2">
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Newspaper className="w-3.5 h-3.5 text-slate-350" />
                            Новость
                          </span>
                          <span>{new Date(newsItem.created_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <h4 className="font-bold text-slate-950 text-xs leading-snug">{newsItem.title}</h4>
                        <p className="text-[10px] text-slate-650 leading-relaxed whitespace-pre-wrap">
                          {newsItem.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 5: Projects & Tasks (Transparency) */}
              {detailTab === 'projects' && (
                <div className="space-y-4">
                  {selectedOrgProjects.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-[10px] italic">
                      У этой организации пока нет активных проектов.
                    </div>
                  ) : (
                    selectedOrgProjects.map((project) => {
                      const projTasks = tasks.filter(t => t.project_id === project.id);
                      const completedCount = projTasks.filter(t => t.status === 'completed').length;
                      const progress = projTasks.length > 0 ? Math.round((completedCount / projTasks.length) * 100) : 0;
                      
                      const statusColor = {
                        planning: 'bg-amber-50 text-amber-700 border-amber-200',
                        active: 'bg-blue-50 text-blue-700 border-blue-200',
                        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }[project.status];

                      return (
                        <div key={project.id} className="p-4 rounded-xl border border-slate-150 bg-white space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${statusColor}`}>
                              {project.status === 'planning' ? 'Подготовка' : project.status === 'active' ? 'Активен' : 'Завершен'}
                            </span>
                            {project.start_date && (
                              <span className="text-[8px] text-slate-400 font-semibold flex items-center gap-0.5">
                                <Calendar className="w-3 h-3 text-slate-350" />
                                {new Date(project.start_date).toLocaleDateString('ru-RU')}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-slate-900 text-xs leading-snug">{project.title}</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed">{project.description}</p>

                          {/* Progress */}
                          <div className="space-y-1 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold">
                              <span>Выполнение задач</span>
                              <span className="text-slate-900">{completedCount} / {projTasks.length} ({progress}%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-150">
                              <div className="h-full bg-slate-900 rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                          </div>

                          {/* Tasks Transparency */}
                          {projTasks.length > 0 && (
                            <div className="space-y-1.5 pt-2">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Все задачи ({projTasks.length})</span>
                              <div className="space-y-1">
                                {projTasks.map(t => (
                                  <div key={t.id} className="p-2 rounded bg-slate-50/50 border border-slate-100 flex items-center justify-between text-[9px]">
                                    <span className="font-semibold text-slate-800 truncate pr-3">{t.title}</span>
                                    <span className={`px-1.5 py-0.5 rounded-[4px] font-bold ${
                                      t.status === 'completed'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : t.status === 'accepted'
                                          ? 'bg-blue-50 text-blue-700'
                                          : 'bg-amber-50 text-amber-700'
                                    }`}>
                                      {t.status === 'completed' ? 'Выполнено' : t.status === 'accepted' ? 'В работе' : 'Ожидает'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
