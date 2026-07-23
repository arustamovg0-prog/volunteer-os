'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { 
  FileSpreadsheet, 
  FileDown, 
  Search, 
  Calendar,
  Filter,
  Clock,
  User as UserIcon,
  Folder,
  MessageSquare,
  ShieldAlert,
  CheckCircle,
  Activity
} from 'lucide-react';

interface CheckIn {
  id: string;
  user_id: string;
  project_id?: string | null;
  text_report: string;
  hours: number;
  status: string;
  check_in_at: string;
  check_out_at?: string;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
}

interface User {
  id: string;
  full_name: string;
  role: string;
  phone?: string;
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Current authenticated role
  const [role, setRole] = useState<'manager' | 'admin'>('manager');

  // Filters State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole') as 'manager' | 'admin';
    if (savedRole) setRole(savedRole);

    const handleRoleChange = () => {
      const updated = localStorage.getItem('currentUserRole') as 'manager' | 'admin';
      if (updated) setRole(updated);
    };

    window.addEventListener('auth-session-change', handleRoleChange);
    fetchData();

    return () => window.removeEventListener('auth-session-change', handleRoleChange);
  }, []);

  async function fetchData() {
    try {
      const [checkinsRes, projectsRes, usersRes] = await Promise.all([
        fetch('/api/checkins'),
        fetch('/api/projects'),
        fetch('/api/users')
      ]);

      const [checkinsData, projectsData, usersData] = await Promise.all([
        checkinsRes.json(),
        projectsRes.json(),
        usersRes.json()
      ]);

      setCheckins(checkinsData.checkins || []);
      setProjects(projectsData);
      setUsers(usersData);
    } catch (e) {
      console.error('Failed to load reports data', e);
    } finally {
      setLoading(false);
    }
  }

  // Filtered check-ins calculation
  const filteredCheckins = checkins.filter((item) => {
    // Project Filter
    if (selectedProjectId && item.project_id !== selectedProjectId) {
      return false;
    }
    // Volunteer Filter
    if (selectedVolunteerId && item.user_id !== selectedVolunteerId) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const volunteer = users.find(u => u.id === item.user_id);
      const volunteerName = volunteer ? volunteer.full_name.toLowerCase() : '';
      const textReport = item.text_report.toLowerCase();
      if (!volunteerName.includes(query) && !textReport.includes(query)) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24 bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-[#F9FAFB]">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-250 flex items-center justify-center text-red-600 shadow-sm">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">{t('reports.restricted')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('reports.restricted_desc')} <strong>{t('reports.restricted_director')}</strong>.
            </p>
          </div>
          <div className="w-full pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link 
              href="/dashboard"
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm block text-center"
            >
              {t('reports.back_home')}
            </Link>
            <p className="text-[10px] text-slate-400">
              {t('reports.role_switch_hint')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Aggregate metrics based on filtered results
  const totalReportsCount = filteredCheckins.length;
  const totalHoursLogged = filteredCheckins.reduce((sum, item) => sum + Number(item.hours), 0);
  const reportingVolunteersCount = new Set(filteredCheckins.map(item => item.user_id)).size;
  const averageHoursPerReport = totalReportsCount > 0 ? (totalHoursLogged / totalReportsCount) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('reports.title')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('reports.subtitle')}
          </p>
        </div>
        
        {/* Export Actions */}
        <div className="flex flex-wrap gap-2.5">
          <a
            href="/api/reports/export?format=csv"
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {t('reports.exportCsv')}
          </a>
          
          <a
            href="/api/reports/export?format=pdf"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            {t('reports.exportPdf')}
          </a>
        </div>
      </div>

      {/* Aggregate Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 glass-panel bg-white border border-slate-200 shadow-sm rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('reports.totalReports')}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{totalReportsCount}</h4>
          <p className="text-[10px] text-slate-400 mt-1">{t('reports.totalReportsSub')}</p>
        </div>

        <div className="p-5 glass-panel bg-white border border-slate-200 shadow-sm rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('reports.workedHours')}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{totalHoursLogged.toFixed(1)} ч.</h4>
          <p className="text-[10px] text-slate-400 mt-1">{t('reports.workedHoursSub')}</p>
        </div>

        <div className="p-5 glass-panel bg-white border border-slate-200 shadow-sm rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('reports.activeVolunteers')}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{reportingVolunteersCount}</h4>
          <p className="text-[10px] text-slate-400 mt-1">{t('reports.activeVolunteersSub')}</p>
        </div>

        <div className="p-5 glass-panel bg-white border border-slate-200 shadow-sm rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('reports.avgTime')}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{averageHoursPerReport.toFixed(1)} ч.</h4>
          <p className="text-[10px] text-slate-400 mt-1">{t('reports.avgTimeSub')}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel bg-white p-4 border border-slate-200 shadow-sm rounded-xl flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider pr-3 border-r border-slate-100 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>{t('reports.filters')}</span>
        </div>

        {/* Project Select */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t('reports.byProject')}</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          >
            <option value="">{t('reports.allProjects')}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* Volunteer Select */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t('reports.byVolunteer')}</label>
          <select
            value={selectedVolunteerId}
            onChange={(e) => setSelectedVolunteerId(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          >
            <option value="">{t('reports.allVolunteers')}</option>
            {users.filter(u => u.role === 'volunteer').map(v => (
              <option key={v.id} value={v.id}>{v.full_name}</option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t('reports.searchReport')}</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder={t('reports.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>
        </div>

        {/* Clear Filters Helper */}
        {(selectedProjectId || selectedVolunteerId || searchQuery) && (
          <button
            onClick={() => {
              setSelectedProjectId('');
              setSelectedVolunteerId('');
              setSearchQuery('');
            }}
            className="text-[10px] text-red-500 hover:text-red-600 font-semibold self-end mb-1 transition-colors"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredCheckins.length === 0 ? (
          <div className="glass-panel bg-white p-12 text-center text-slate-400 text-xs border border-slate-200 shadow-sm rounded-xl">
            {t('reports.notFound')}
          </div>
        ) : (
          filteredCheckins.map((item) => {
            const volunteer = users.find(u => u.id === item.user_id);
            const project = item.project_id ? projects.find(p => p.id === item.project_id) : null;

            return (
              <div 
                key={item.id} 
                className="glass-panel bg-white p-5 border border-slate-200 shadow-sm rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  {/* Top line with labels */}
                  <div className="flex flex-wrap items-center gap-3">
                    {item.status === 'rejected' ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-red-600" />
                        Отклонено
                      </span>
                    ) : item.check_out_at ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        Смена закрыта ({item.hours} ч.)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-orange-600" />
                        Смена активна
                      </span>
                    )}
                    
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(item.check_in_at || item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      {item.check_out_at && ` - ${new Date(item.check_out_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`}
                      <span className="ml-1 opacity-50">({new Date(item.created_at).toLocaleDateString('ru-RU')})</span>
                    </span>
                  </div>

                  {/* Volunteer & Project labels */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-xs text-slate-900">
                        {t('reports.vol')}: {volunteer ? volunteer.full_name : t('reports.unknown')}
                      </span>
                      {volunteer?.phone && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({volunteer.phone})
                        </span>
                      )}
                      {!volunteer?.phone && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({t('reports.noPhone')})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <Folder className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {t('reports.proj')}: {project ? project.title : t('reports.commonTasks')}
                      </span>
                    </div>
                  </div>

                  {/* Report comments */}
                  {item.text_report ? (
                    <div className="flex gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed italic">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>"{item.text_report}"</span>
                    </div>
                  ) : (
                    <div className="flex gap-2 p-3 rounded-xl bg-orange-50/50 border border-orange-100 text-[11px] text-orange-600 leading-relaxed italic">
                      <Activity className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                      <span>Волонтер на смене. Отчет будет добавлен после чекаута.</span>
                    </div>
                  )}
                </div>

                {/* Right-aligned meta details */}
                <div className="hidden md:flex flex-col items-end justify-start shrink-0 text-right">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{t('reports.checkinId')}</span>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 select-all">{item.id.slice(0, 8)}...</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
