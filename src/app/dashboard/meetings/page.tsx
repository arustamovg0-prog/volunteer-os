'use client';

import { useState, useEffect } from 'react';
import { 
  Video, 
  Plus, 
  Calendar, 
  Clock, 
  Link2, 
  ExternalLink,
  ChevronRight,
  User,
  Layers,
  ShieldAlert
} from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  link?: string;
  project_id?: string | null;
  created_by?: string | null;
}

interface Project {
  id: string;
  title: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState('manager');
  const [currentUserId, setCurrentUserId] = useState('');

  // New Meeting Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [link, setLink] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole');
    if (savedRole) setRole(savedRole);
    setCurrentUserId(localStorage.getItem('currentUserId') || '');

    const handleSessionChange = () => {
      const updated = localStorage.getItem('currentUserRole');
      if (updated) setRole(updated);
      setCurrentUserId(localStorage.getItem('currentUserId') || '');
    };

    window.addEventListener('auth-session-change', handleSessionChange);
    fetchData();

    return () => window.removeEventListener('auth-session-change', handleSessionChange);
  }, []);

  async function fetchData() {
    try {
      const [meetingsRes, projectsRes, usersRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/projects'),
        fetch('/api/users')
      ]);

      const [meetingsData, projectsData, usersData] = await Promise.all([
        meetingsRes.json(),
        projectsRes.json(),
        usersRes.json()
      ]);

      setMeetings(meetingsData);
      setProjects(projectsData);
      setUsers(usersData);
    } catch (e) {
      console.error('Failed to load meetings data', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          scheduled_at: new Date(scheduledAt).toISOString(),
          link: link || 'https://zoom.us',
          project_id: projectId || null,
          created_by: currentUserId || null
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setScheduledAt('');
        setLink('');
        setProjectId('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24 bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const now = new Date();
  const upcomingMeetings = meetings.filter(m => new Date(m.scheduled_at) >= now);
  const pastMeetings = meetings.filter(m => new Date(m.scheduled_at) < now);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Встречи & Летучки</h2>
          <p className="text-xs text-slate-500 mt-1">
            Координационные созвоны, планерки и обсуждения социальных проектов
          </p>
        </div>
        
        {role === 'admin' ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all duration-150 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Запланировать планерку
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto">
            <ShieldAlert className="w-3.5 h-3.5" />
            Режим мониторинга (Координатор)
          </div>
        )}
      </div>

      {/* Grid: Upcoming & Past Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upcoming Meetings (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Video className="w-4 h-4 text-slate-900" />
            Предстоящие созвоны ({upcomingMeetings.length})
          </h3>

          {upcomingMeetings.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-400 text-xs border border-slate-200 bg-white shadow-sm rounded-xl">
              Нет запланированных встреч.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => {
                const project = projects.find(p => p.id === meeting.project_id);
                const organizer = users.find(u => u.id === meeting.created_by);
                const schedDate = new Date(meeting.scheduled_at);

                return (
                  <div key={meeting.id} className="glass-panel p-6 border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition-all shadow-sm rounded-xl">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-slate-900 text-white flex items-center gap-1 shadow-sm">
                          <Calendar className="w-3.5 h-3.5" />
                          {schedDate.toLocaleDateString('ru-RU')}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {schedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {project && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-450" />
                            Проект: <span className="font-semibold text-slate-700">{project.title}</span>
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{meeting.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {meeting.description || 'Повестка дня не указана.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                        <User className="w-3.5 h-3.5 text-slate-350" />
                        Организатор: <span className="text-slate-600 font-semibold">{organizer ? organizer.full_name : 'Куратор Ассоциации'}</span>
                      </div>
                    </div>

                    {/* Join Link button */}
                    <div className="shrink-0 flex items-center">
                      <a
                        href={meeting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11.5px] font-semibold flex items-center gap-1.5 transition-all shadow-sm duration-150 active:scale-98"
                      >
                        Подключиться
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Meetings (1 column archive) */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
            Архив планерок ({pastMeetings.length})
          </h3>

          {pastMeetings.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-400 text-xs border border-slate-200 bg-white shadow-sm rounded-xl">
              Архив пуст.
            </div>
          ) : (
            <div className="space-y-3">
              {pastMeetings.map((meeting) => (
                <div key={meeting.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 opacity-65 hover:opacity-100 transition-opacity shadow-sm">
                  <h4 className="font-bold text-slate-900 text-xs">{meeting.title}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{meeting.description || 'Без описания'}</p>
                  <div className="flex justify-between items-center text-[9px] text-slate-450 pt-1.5 font-semibold">
                    <span>{new Date(meeting.scheduled_at).toLocaleDateString('ru-RU')}</span>
                    <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Завершено</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-900">Запланировать встречу</h3>
            
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-semibold block">Тема совещания</label>
                <input
                  type="text"
                  required
                  placeholder="Введите тему созвона"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-semibold block">Повестка / Описание</label>
                <textarea
                  placeholder="Опишите основные темы для обсуждения"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-semibold block">Дата и время</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-semibold block">Связать с проектом</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs focus:outline-none focus:border-slate-900"
                  >
                    <option value="">-- Общеорганизационный --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-semibold block">Ссылка на созвон (Zoom / Telegram / Meet)</label>
                <div className="relative">
                  <Link2 className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-450" />
                  <input
                    type="url"
                    placeholder="https://zoom.us/j/..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Сохранение...' : 'Запланировать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
