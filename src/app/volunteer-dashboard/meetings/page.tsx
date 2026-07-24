'use client';

import { useState, useEffect } from 'react';
import { 
  Video, 
  Calendar, 
  Clock, 
  ExternalLink,
  ArrowRight,
  Folder,
  User as UserIcon,
  Sparkles,
  Inbox
} from 'lucide-react';
import VolunteerBottomNav from '@/components/VolunteerBottomNav';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  link?: string;
  project_id?: string | null;
  created_by?: string | null;
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
  phone?: string | null;
  rating: number;
}

export default function VolunteerMeetingsPage() {
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  const [volunteer, setVolunteer] = useState<User | null>(null);
  const [allVolunteers, setAllVolunteers] = useState<User[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sign-in Form State
  const [selectedVolId, setSelectedVolId] = useState('');

  useEffect(() => {
    const cachedId = localStorage.getItem('volunteerId');
    setVolunteerId(cachedId);
    loadInitialData(cachedId);
  }, []);

  async function loadInitialData(currentId: string | null) {
    setLoading(true);
    try {
      const usersRes = await fetch('/api/users');
      const usersData: User[] = await usersRes.json();
      const vols = usersData.filter(u => u.role === 'volunteer');
      setAllVolunteers(vols);
      setUsers(usersData);

      if (currentId) {
        const found = vols.find(u => u.id === currentId);
        if (found) {
          setVolunteer(found);
          const [projectsRes, meetingsRes] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/meetings')
          ]);
          setProjects(await projectsRes.json());
          setMeetings(await meetingsRes.json());
        } else {
          localStorage.removeItem('volunteerId');
          setVolunteerId(null);
        }
      }
    } catch (e) {
      console.error('Failed to load volunteer meetings data', e);
    } finally {
      setLoading(false);
    }
  }

  const handleLogin = () => {
    if (!selectedVolId) return;
    localStorage.setItem('volunteerId', selectedVolId);
    setVolunteerId(selectedVolId);
    loadInitialData(selectedVolId);
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
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Встречи и созвоны</h2>
            <p className="text-xs text-slate-500 mt-1">
              Выберите свой профиль для доступа к расписанию встреч
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

  // Sort meetings into upcoming vs past
  const now = new Date();
  const upcomingMeetings = meetings.filter(m => new Date(m.scheduled_at) >= now);
  const pastMeetings = meetings.filter(m => new Date(m.scheduled_at) < now);

  return (
    <div className="space-y-5 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Video className="w-5 h-5 text-slate-900" />
        <h2 className="text-base font-bold text-slate-900 leading-tight">Встречи и созвоны</h2>
      </div>

      {/* Info card */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-[10px] text-slate-500 flex items-center justify-between shadow-sm">
        <span>Профиль: <span className="text-slate-800 font-bold">{volunteer.full_name}</span></span>
        <span>Найдено созвонов: <span className="text-slate-900 font-bold">{meetings.length}</span></span>
      </div>

      {/* Section: Upcoming Meetings */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
          Предстоящие встречи ({upcomingMeetings.length})
        </h3>

        {upcomingMeetings.length === 0 ? (
          <div className="glass-panel bg-white p-8 text-center text-slate-400 text-xs border border-slate-200 shadow-sm rounded-xl py-12 flex flex-col items-center justify-center space-y-2">
            <Inbox className="w-6 h-6 text-slate-300" />
            <span>Запланированные встречи не найдены</span>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => {
              const schedDate = new Date(meeting.scheduled_at);
              const project = projects.find(p => p.id === meeting.project_id);
              const organizer = users.find(u => u.id === meeting.created_by);

              return (
                <div key={meeting.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 shadow-sm hover:border-slate-300 transition-all">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-semibold">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-bold flex items-center gap-1.5 shadow-sm">
                        <Calendar className="w-3 h-3" />
                        {schedDate.toLocaleDateString('ru-RU')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {schedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-xs">{meeting.title}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {meeting.description || 'Повестка созвона не заполнена куратором.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 text-[9px] text-slate-400 font-medium pt-1.5 border-t border-slate-100">
                      {project && (
                        <div className="flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-slate-300" />
                          <span>Проект: <span className="text-slate-600 font-semibold">{project.title}</span></span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-300" />
                        <span>Организатор: <span className="text-slate-600 font-semibold">{organizer ? organizer.full_name : 'Куратор Ассоциации'}</span></span>
                      </div>
                    </div>
                  </div>

                  {meeting.link && (
                    <a
                      href={meeting.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Подключиться к созвону
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section: Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Завершенные ({pastMeetings.length})
          </h3>

          <div className="space-y-2">
            {pastMeetings.map((meeting) => (
              <div key={meeting.id} className="p-3.5 rounded-xl bg-white border border-slate-100 opacity-60 space-y-1 shadow-sm">
                <h4 className="font-bold text-slate-700 text-[11px]">{meeting.title}</h4>
                <p className="text-[9px] text-slate-400 line-clamp-1">{meeting.description || 'Без описания'}</p>
                <div className="flex justify-between items-center text-[8px] text-slate-400 pt-1.5 font-medium">
                  <span>{new Date(meeting.scheduled_at).toLocaleDateString('ru-RU')}</span>
                  <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Завершено</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
