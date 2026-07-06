'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Bell, 
  MessageSquareCode, 
  Send,
  Clock,
  ExternalLink,
  Activity,
  ShieldCheck,
  Radio,
  Flame,
  UserCheck,
  Inbox
} from 'lucide-react';
import Link from 'next/link';
import { getPrivilegedHeaders } from '@/lib/client-security';

interface Task {
  id: string;
  project_id: string;
  assigned_to?: string | null;
  title: string;
  deadline: string;
  status: 'pending' | 'accepted' | 'completed';
  is_overdue: boolean;
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
  rating: number;
  telegram_id?: number | null;
}

interface CheckIn {
  id: string;
  user_id: string;
  project_id?: string | null;
  text_report: string;
  hours: number;
  created_at: string;
}

interface OperationsOverview {
  radar: {
    activeTasks: number;
    overdueTasks: number;
    urgentTasks: number;
    unassignedTasks: number;
    dormantVolunteers: number;
    availableVolunteers: number;
    activeAlerts: number;
    inboxItems: number;
  };
  actionItems: { type: string; severity: string; title: string; subtitle: string; href: string }[];
  riskProjects: {
    id: string;
    title: string;
    riskScore: number;
    level: 'critical' | 'watch' | 'healthy';
    progress: number;
    reasons: string[];
  }[];
  inbox: { chatId: string; chatTitle: string; senderName: string; text: string; ageHours: number; priority: string }[];
  availableVolunteers: { id: string; full_name: string; skills: string[]; available_until?: string | null; availability_note?: string | null }[];
  digest: string[];
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [operations, setOperations] = useState<OperationsOverview | null>(null);

  const [currentUserRole, setCurrentUserRole] = useState<'manager' | 'admin'>('manager');

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole') as 'manager' | 'admin';
    if (savedRole) setCurrentUserRole(savedRole);

    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [tasksRes, projectsRes, usersRes, checkinsRes, operationsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/users'),
        fetch('/api/checkins'),
        fetch('/api/operations/overview', { headers: getPrivilegedHeaders() })
      ]);

      const [tasksData, projectsData, usersData, checkinsData, operationsData] = await Promise.all([
        tasksRes.json(),
        projectsRes.json(),
        usersRes.json(),
        checkinsRes.json(),
        operationsRes.ok ? operationsRes.json() : Promise.resolve(null)
      ]);

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setCheckins(Array.isArray(checkinsData) ? checkinsData : []);
      setOperations(operationsData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReminder(taskId: string) {
    setNotifyingId(taskId);
    setAlertMessage(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/remind`, {
        method: 'POST',
        headers: getPrivilegedHeaders()
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAlertMessage({ type: 'error', text: payload.error || 'Не удалось отправить напоминание в Telegram.' });
        return;
      }

      setAlertMessage({ type: 'success', text: `Напоминание отправлено в Telegram: ${payload.assignee_name}` });
      setTimeout(() => setAlertMessage(null), 4000);
      fetchData();
    } catch (e) {
      console.error('Failed to send telegram alert', e);
      setAlertMessage({ type: 'error', text: 'Ошибка соединения при отправке напоминания в Telegram.' });
    } finally {
      setNotifyingId(null);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24 bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Calculate metrics
  const activeTasksCount = tasks.filter(t => t.status !== 'completed').length;
  const pendingCheckinsCount = checkins.length; // All check-ins registered
  const totalVolunteers = users.filter(u => u.role === 'volunteer').length;
  const totalHours = checkins.reduce((acc, c) => acc + Number(c.hours), 0);
  
  const volunteers = users.filter(u => u.role === 'volunteer');
  const avgRating = volunteers.reduce((acc, u) => acc + Number(u.rating ?? 5.0), 0) / (volunteers.length || 1);

  // Filter overdue tasks: status is not completed, and is_overdue or deadline is in the past
  const now = new Date();
  const overdueTasks = tasks.filter(task => {
    if (task.status === 'completed') return false;
    const deadline = new Date(task.deadline);
    return task.is_overdue || deadline < now;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Toast Alert Notification */}
      {alertMessage && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border text-xs shadow-lg flex items-center gap-2 animate-fade-in ${
          alertMessage.type === 'success'
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <Bell className={`w-4 h-4 shrink-0 ${alertMessage.type === 'success' ? 'text-emerald-400 animate-bounce' : 'text-red-500'}`} />
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Обзор панелей</h2>
          <p className="text-xs text-slate-500 mt-1">
            Оперативный статус деятельности ассоциации волонтеров
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm self-start">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Роль:</span>
          <span className="text-xs font-bold text-slate-900">
            {currentUserRole === 'admin' ? 'Директор' : 'Координатор'}
          </span>
        </div>
      </div>

      {/* Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 glass-panel relative overflow-hidden bg-white">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Активные задачи</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-2">{activeTasksCount}</h4>
          <p className="text-[10px] text-slate-400 mt-1.5">В процессе выполнения</p>
        </div>

        <div className="p-6 glass-panel relative overflow-hidden bg-white">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Поступило Чек-инов</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-2">{pendingCheckinsCount}</h4>
          <p className="text-[10px] text-slate-400 mt-1.5">Всего отчетов волонтеров</p>
        </div>

        <div className="p-6 glass-panel relative overflow-hidden bg-white">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Всего отработано</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-2">{totalHours.toFixed(1)} <span className="text-xs font-semibold text-slate-400">ч.</span></h4>
          <p className="text-[10px] text-slate-400 mt-1.5">Суммарное время помощи</p>
        </div>

        <div className="p-6 glass-panel relative overflow-hidden bg-white">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Средний рейтинг</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-2">{avgRating.toFixed(2)} <span className="text-xs font-semibold text-slate-400">/ 5.0</span></h4>
          <p className="text-[10px] text-slate-400 mt-1.5">Рейтинг волонтеров CRM</p>
        </div>
      </div>

      {/* Control Tower */}
      {operations && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 glass-panel bg-white p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-slate-900 text-sm">Операционный радар</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Сегодня</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Просрочено', value: operations.radar.overdueTasks, icon: Flame, tone: 'text-red-600 bg-red-50 border-red-100' },
                { label: 'Без исполнителя', value: operations.radar.unassignedTasks, icon: AlertTriangle, tone: 'text-amber-600 bg-amber-50 border-amber-100' },
                { label: 'Inbox', value: operations.radar.inboxItems, icon: Inbox, tone: 'text-blue-600 bg-blue-50 border-blue-100' },
                { label: 'Готовы помочь', value: operations.radar.availableVolunteers, icon: UserCheck, tone: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
              ].map((item) => (
                <div key={item.label} className={`p-3 rounded-xl border ${item.tone}`}>
                  <div className="flex items-center justify-between">
                    <item.icon className="w-4 h-4" />
                    <span className="text-xl font-black">{item.value}</span>
                  </div>
                  <p className="text-[10px] font-bold mt-2 uppercase tracking-wide">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Что требует решения</p>
                {operations.actionItems.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Критичных действий нет
                  </div>
                ) : (
                  operations.actionItems.slice(0, 5).map((item, index) => (
                    <Link key={`${item.type}-${index}`} href={item.href} className="block p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/60 transition-all">
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{item.subtitle}</p>
                    </Link>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Сводка для руководителя</p>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                  {operations.digest.map((line) => (
                    <p key={line} className="text-xs text-slate-700 leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel bg-white p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-slate-900" />
              <h3 className="font-bold text-slate-900 text-sm">Live-команда</h3>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Готовы помочь сейчас</p>
              {operations.availableVolunteers.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">Пока никто не отметил доступность.</p>
              ) : operations.availableVolunteers.map((volunteer) => (
                <div key={volunteer.id} className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50">
                  <p className="text-xs font-bold text-slate-900">{volunteer.full_name}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{volunteer.availability_note || volunteer.skills.slice(0, 3).join(', ') || 'Готов к задачам'}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inbox координаторов</p>
              {operations.inbox.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">Новых обращений нет.</p>
              ) : operations.inbox.slice(0, 4).map((item) => (
                <Link key={item.chatId} href="/dashboard/chats" className="block p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-white">
                  <p className="text-xs font-bold text-slate-900">{item.senderName}</p>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{item.text}</p>
                  <p className="text-[9px] text-slate-400 mt-2">{item.ageHours} ч. назад</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="xl:col-span-3 glass-panel bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-slate-900 text-sm">Риск-скоринг проектов</h3>
              </div>
              <Link href="/dashboard/projects" className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase">Все проекты →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {operations.riskProjects.slice(0, 6).map((project) => (
                <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="p-4 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/40 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate">{project.title}</p>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                      project.level === 'critical' ? 'bg-red-100 text-red-700' :
                      project.level === 'watch' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {project.riskScore}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-slate-900" style={{ width: `${project.progress}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3">{project.reasons[0]}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Overdue Tasks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Overdue Tasks List (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-slate-900 text-sm">Просроченные задачи</h3>
              </div>
              <span className="text-[10px] bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-100 font-bold uppercase tracking-wider">
                {overdueTasks.length} Внимание
              </span>
            </div>

            {overdueTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Все задачи выполняются в срок. Задержек нет!
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTasks.map((task) => {
                  const deadline = new Date(task.deadline);
                  const volunteer = users.find(u => u.id === task.assigned_to);
                  const project = projects.find(p => p.id === task.project_id);
                  const canSendTelegramReminder = !!task.assigned_to && !!volunteer?.telegram_id;

                  return (
                    <div 
                      key={task.id} 
                      className="p-4 rounded-xl border border-red-100 bg-red-50/20 hover:bg-red-50/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <h4 className="font-bold text-slate-900 text-xs">{task.title}</h4>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Проект: <span className="font-medium text-slate-700">{project?.title || 'Неизвестно'}</span> | Исполнитель: <span className="font-semibold text-slate-700">{volunteer?.full_name || 'Не назначен'}</span>
                        </p>
                        <p className="text-[10px] text-red-600 font-semibold">
                          Срок истек: {deadline.toLocaleDateString('ru-RU')} в {deadline.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleSendReminder(task.id)}
                        disabled={notifyingId === task.id || !canSendTelegramReminder}
                        title={
                          !task.assigned_to
                            ? 'Назначьте ответственного перед отправкой'
                            : !volunteer?.telegram_id
                              ? 'У ответственного не привязан Telegram ID'
                              : 'Отправить напоминание ответственному в Telegram'
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[10px] font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Send className="w-3 h-3" />
                        {notifyingId === task.id
                          ? 'Отправка...'
                          : canSendTelegramReminder
                            ? 'Напомнить в TG'
                            : 'TG не привязан'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Check-ins List (Right 1 Column) */}
        <div className="space-y-6">
          <div className="glass-panel p-6 bg-white flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageSquareCode className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-slate-900 text-sm">Поток Чек-инов</h3>
              </div>
              <Link 
                href="/dashboard/reports" 
                className="text-[10px] text-slate-500 hover:text-slate-900 font-bold uppercase tracking-wider"
              >
                Все →
              </Link>
            </div>

            {checkins.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Пока отчетов от волонтеров не поступало.
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
                {checkins.slice(0, 4).map((report) => {
                  const volunteer = users.find(u => u.id === report.user_id);
                  const project = projects.find(p => p.id === report.project_id);

                  return (
                    <div key={report.id} className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-900 truncate max-w-[120px]">{volunteer?.full_name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {report.hours} ч.
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                        Проект: <span className="text-slate-600">{project ? project.title : 'Общие задачи'}</span>
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {report.text_report}
                      </p>
                      <div className="text-[9px] text-slate-400 text-right">
                        {new Date(report.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
