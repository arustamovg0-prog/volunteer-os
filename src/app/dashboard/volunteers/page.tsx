'use client';

import { useState, useEffect } from 'react';
import { 
  Users2, 
  Plus, 
  Phone, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  X,
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { useSWRConfig } from 'swr';

interface Volunteer {
  id: string;
  full_name: string;
  phone?: string | null;
  telegram_id?: number | null;
  role: 'volunteer';
  rating: number;
}

interface Task {
  id: string;
  project_id: string;
  assigned_to?: string | null;
  title: string;
  deadline: string;
  status: 'pending' | 'accepted' | 'completed';
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

export default function VolunteersPage() {
  const { mutate } = useSWRConfig();
  
  const { data: volunteers = [] } = useApi<Volunteer[]>('/api/users?role=volunteer');
  const { data: tasks = [] } = useApi<Task[]>('/api/tasks');
  const { data: projects = [] } = useApi<Project[]>('/api/projects');
  const { data: checkins = [] } = useApi<CheckIn[]>('/api/checkins');
  const { data: reviews = [] } = useApi<any[]>('/api/employee-reviews');
  const { data: applications = [] } = useApi<any[]>('/api/applications');

  const loading = !volunteers.length && !tasks.length && !projects.length && !checkins.length && !reviews.length && !applications.length;

  const [role, setRole] = useState('manager');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  
  const [activeTab, setActiveTab] = useState<'volunteers' | 'applications'>('volunteers');
  const [processingApp, setProcessingApp] = useState<string | null>(null);

  // Selected Volunteer for the slide-over drawer
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

  // New Volunteer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review form state
  const [reviewKpi, setReviewKpi] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Check-in grading form state
  const [gradingCheckInId, setGradingCheckInId] = useState<string | null>(null);
  const [checkInKpi, setCheckInKpi] = useState(5);
  const [checkInFeedback, setCheckInFeedback] = useState('');
  const [submittingCheckInKpi, setSubmittingCheckInKpi] = useState(false);

  async function handleGradeCheckIn(checkInId: string) {
    if (!selectedVolunteer) return;
    setSubmittingCheckInKpi(true);
    try {
      const res = await fetch('/api/checkins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInId,
          kpi_score: checkInKpi,
          feedback: checkInFeedback,
          reviewed_by: currentUserName || (role === 'admin' ? 'Директор' : 'Координатор')
        })
      });

      if (res.ok) {
        setGradingCheckInId(null);
        setCheckInFeedback('');
        setCheckInKpi(5);
        
        
        // Refresh volunteer data and checkins
        mutate('/api/checkins');
        
        // Update selected volunteer local state to reflect rating change
        const updatedUserRes = await fetch(`/api/users`);
        const updatedUsers = await updatedUserRes.json();
        const found = updatedUsers.find((u: any) => u.id === selectedVolunteer.id);
        if (found) setSelectedVolunteer(found);
      } else {
        alert('Не удалось оценить чек-ин');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при оценке чек-ина');
    } finally {
      setSubmittingCheckInKpi(false);
    }
  }

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole');
    if (savedRole) setRole(savedRole);
    setCurrentUserId(localStorage.getItem('currentUserId') || '');
    setCurrentUserName(localStorage.getItem('currentUserName') || '');

    const handleSessionChange = () => {
      const updated = localStorage.getItem('currentUserRole');
      if (updated) setRole(updated);
      setCurrentUserId(localStorage.getItem('currentUserId') || '');
      setCurrentUserName(localStorage.getItem('currentUserName') || '');
    };

    window.addEventListener('auth-session-change', handleSessionChange);

    return () => window.removeEventListener('auth-session-change', handleSessionChange);
  }, []);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVolunteer || !reviewFeedback) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/employee-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_name: selectedVolunteer.full_name,
          kpi_score: reviewKpi,
          feedback: reviewFeedback,
          created_by: currentUserId || null
        })
      });
      if (res.ok) {
        setReviewFeedback('');
        mutate('/api/employee-reviews');
        // Trigger local rating update
        setSelectedVolunteer(prev => prev ? { ...prev, rating: reviewKpi } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleRegisterVolunteer(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;
    setIsSubmitting(true);

    try {
      let cleanPhone = phone.trim();
      if (!cleanPhone.startsWith('+')) {
        if (cleanPhone.startsWith('8')) {
          cleanPhone = '+7' + cleanPhone.slice(1);
        } else if (cleanPhone.startsWith('7')) {
          cleanPhone = '+' + cleanPhone;
        } else {
          cleanPhone = '+7' + cleanPhone;
        }
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone: cleanPhone,
          role: 'volunteer',
          telegram_id: telegramId ? parseInt(telegramId) : null
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFullName('');
        setPhone('');
        setTelegramId('');
        mutate('/api/users?role=volunteer');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApplicationAction(appId: string, status: 'approved' | 'rejected') {
    setProcessingApp(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.generatedPassword) {
          alert(`Заявка одобрена!\\n\\nСгенерирован пароль для волонтера: ${data.generatedPassword}\\nЛогин: ${data.generatedLogin}`);
        }
        mutate('/api/applications');
        mutate('/api/users?role=volunteer');
      } else {
        alert('Ошибка при обновлении заявки');
      }
    } catch (error) {
      console.error(error);
      alert('Ошибка при обновлении заявки');
    } finally {
      setProcessingApp(null);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24 bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Selected volunteer sub-collections
  const volunteerTasks = selectedVolunteer
    ? tasks.filter(t => t.assigned_to === selectedVolunteer.id)
    : [];
  const volunteerCheckins = selectedVolunteer
    ? checkins.filter(c => c.user_id === selectedVolunteer.id)
    : [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">База волонтеров (CRM)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Мониторинг часов работы, рейтинга волонтеров и логов активности
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('volunteers')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'volunteers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Волонтеры
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'applications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Заявки
              {applications.filter((a: any) => a.status === 'pending').length > 0 && (
                <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md text-[10px]">
                  {applications.filter((a: any) => a.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
          {role === 'admin' && activeTab === 'volunteers' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all duration-155 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              Зарегистрировать
            </button>
          )}
        </div>
      </div>

      {/* Table view */}
      {activeTab === 'volunteers' ? (
        <div className="glass-panel overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="py-4 px-6">Имя волонтера</th>
                  <th className="py-4 px-4">Контакты</th>
                  <th className="py-4 px-4">Задачи (Вып. / Актив.)</th>
                  <th className="py-4 px-4">Всего часов</th>
                  <th className="py-4 px-6 text-right">Рейтинг волонтера</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {volunteers.map((vol) => {
                  const volTasks = tasks.filter(t => t.assigned_to === vol.id);
                  const volDone = volTasks.filter(t => t.status === 'completed').length;
                  const volPending = volTasks.length - volDone;
                  const volHours = checkins
                    .filter(c => c.user_id === vol.id)
                    .reduce((acc, c) => acc + Number(c.hours), 0);

                  const ratingVal = vol.rating ?? 5.0;
                  let ratingColors = 'text-slate-700 bg-slate-100 border-slate-200';
                  if (ratingVal >= 4.5) {
                    ratingColors = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                  } else if (ratingVal < 3.5) {
                    ratingColors = 'text-red-750 bg-red-50 border-red-200';
                  }

                  return (
                    <tr 
                      key={vol.id} 
                      onClick={() => setSelectedVolunteer(vol)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      {/* Name */}
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {vol.full_name}
                      </td>

                      {/* Contacts */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-650">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{vol.phone || 'Без телефона'}</span>
                        </div>
                        {vol.telegram_id && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                            <Hash className="w-3 h-3 text-slate-300" />
                            <span>TG: {vol.telegram_id}</span>
                          </div>
                        )}
                      </td>

                      {/* Tasks */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            {volDone}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <AlertCircle className="w-3.5 h-3.5 text-slate-350" />
                            {volPending}
                          </span>
                        </div>
                      </td>

                      {/* Hours */}
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        {volHours.toFixed(1)} ч.
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-xs ${ratingColors}`}>
                          <Award className="w-3.5 h-3.5" />
                          {ratingVal.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="py-4 px-6">Имя</th>
                  <th className="py-4 px-4">Контакты</th>
                  <th className="py-4 px-4">Возраст</th>
                  <th className="py-4 px-4">Языки / Навыки</th>
                  <th className="py-4 px-4">Инвалидность</th>
                  <th className="py-4 px-6 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">Нет заявок</td>
                  </tr>
                ) : applications.map((app: any) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-4 px-6 font-bold text-slate-900">{app.full_name}</td>
                    <td className="py-4 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-650">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.phone || 'Не указан'}</span>
                      </div>
                      {app.telegram_id && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                          <Hash className="w-3 h-3 text-slate-300" />
                          <span>TG: {app.telegram_id}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {app.date_of_birth}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {app.spoken_languages.map((lang: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{lang}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {app.has_disability ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold block">
                          Да: {app.disability_info}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Нет</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {app.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApplicationAction(app.id, 'rejected')}
                            disabled={processingApp === app.id}
                            className="px-3 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[10px] transition-colors"
                          >
                            Отклонить
                          </button>
                          <button
                            onClick={() => handleApplicationAction(app.id, 'approved')}
                            disabled={processingApp === app.id}
                            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] transition-colors"
                          >
                            Одобрить
                          </button>
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          app.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {app.status === 'approved' ? 'Одобрена' : 'Отклонена'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Volunteer Profile Drawer */}
      {selectedVolunteer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 shadow-xl flex flex-col justify-between overflow-y-auto animate-fade-in">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-md font-bold text-slate-900">{selectedVolunteer.full_name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Профиль Волонтера</p>
                </div>
                <button 
                  onClick={() => setSelectedVolunteer(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contacts info grid */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Номер телефона:</span>
                  <span className="font-semibold">{selectedVolunteer.phone || 'Не указан'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Telegram ID:</span>
                  <span className="font-semibold">{selectedVolunteer.telegram_id || 'Не привязан'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Рейтинг эффективности:</span>
                  <span className="font-bold flex items-center gap-1 text-slate-950">
                    <Award className="w-3.5 h-3.5 text-slate-700" />
                    {(selectedVolunteer.rating ?? 5.0).toFixed(2)} / 5.0
                  </span>
                </div>
                {volunteerCheckins.reduce((sum, c) => sum + Number(c.hours), 0) >= 100 && (
                  <div className="pt-2 border-t border-slate-100">
                    <a 
                      href={`/api/users/${selectedVolunteer.id}/certificate`}
                      className="w-full py-1.5 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded-lg transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Award className="w-4 h-4" />
                      Сгенерировать Сертификат (PDF)
                    </a>
                  </div>
                )}
              </div>

              {/* Tasks logs */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Лог задач ({volunteerTasks.length})
                </h4>
                {volunteerTasks.length === 0 ? (
                  <p className="text-center py-4 text-slate-350 text-xs border border-dashed border-slate-200 rounded-xl">Задач нет</p>
                ) : (
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {volunteerTasks.map(task => (
                      <div key={task.id} className="p-3 rounded-lg border border-slate-100 bg-white flex items-center justify-between text-xs">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-semibold text-slate-900 truncate">{task.title}</p>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Срок: {new Date(task.deadline).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          task.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : task.status === 'accepted' 
                              ? 'bg-blue-50 text-blue-700 border-blue-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {task.status === 'completed' ? 'Выполнена' : task.status === 'accepted' ? 'В работе' : 'Ожидает'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Check-ins logs */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  История чек-инов ({volunteerCheckins.length})
                </h4>
                {volunteerCheckins.length === 0 ? (
                  <p className="text-center py-4 text-slate-355 text-xs border border-dashed border-slate-200 rounded-xl">Чек-инов нет</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {volunteerCheckins.map(ch => {
                      const proj = projects.find(p => p.id === ch.project_id);
                      const isGraded = ch.kpi_score !== undefined && ch.kpi_score !== null;
                      return (
                        <div key={ch.id} className="p-3 rounded-lg border border-slate-100 bg-white space-y-2 text-xs shadow-sm">
                          <div className="flex items-center justify-between text-[10px] text-slate-450">
                            <span className="font-semibold text-slate-700 truncate max-w-[150px]">{proj ? proj.title : 'Общие задачи'}</span>
                            <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-950 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {ch.hours} ч.
                            </span>
                          </div>
                          
                          <p className="text-slate-650 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100 italic">
                            "{ch.text_report}"
                          </p>
                          
                          {/* KPI Grade Display or Grade Button */}
                          {isGraded ? (
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2 text-[10px] space-y-1">
                              <div className="flex items-center justify-between font-bold text-emerald-800">
                                <span>Оценка отчета (KPI):</span>
                                <span className="text-emerald-700 flex items-center gap-0.5">
                                  {'★'.repeat(ch.kpi_score || 5)} ({ch.kpi_score}/5)
                                </span>
                              </div>
                              {ch.feedback && (
                                <p className="text-emerald-600 leading-normal">
                                  💬 <span className="font-medium">{ch.feedback}</span>
                                </p>
                              )}
                              <span className="text-[8px] text-slate-400 block text-right">Проверил: {ch.reviewed_by}</span>
                            </div>
                          ) : (
                            <div className="pt-1">
                              {gradingCheckInId === ch.id ? (
                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-600">Оценка KPI:</span>
                                    <select
                                      value={checkInKpi}
                                      onChange={(e) => setCheckInKpi(Number(e.target.value))}
                                      className="px-1.5 py-0.5 border border-slate-200 bg-white rounded font-bold text-slate-800"
                                    >
                                      <option value="5">5 (Отлично)</option>
                                      <option value="4">4 (Хорошо)</option>
                                      <option value="3">3 (Удовл.)</option>
                                      <option value="2">2 (Слабо)</option>
                                      <option value="1">1 (Плохо)</option>
                                    </select>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Ваш отзыв..."
                                    value={checkInFeedback}
                                    onChange={(e) => setCheckInFeedback(e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-250 bg-white text-xs rounded"
                                  />
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => setGradingCheckInId(null)}
                                      className="px-2 py-0.5 border border-slate-200 rounded hover:bg-slate-100 text-[10px]"
                                    >
                                      Отмена
                                    </button>
                                    <button
                                      onClick={() => handleGradeCheckIn(ch.id)}
                                      disabled={submittingCheckInKpi}
                                      className="px-2 py-0.5 bg-slate-900 text-white rounded hover:bg-slate-800 text-[10px]"
                                    >
                                      {submittingCheckInKpi ? 'Оценка...' : 'Оценить'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setGradingCheckInId(ch.id);
                                    setCheckInKpi(5);
                                    setCheckInFeedback('');
                                  }}
                                  className="w-full py-1 text-center border border-dashed border-slate-200 hover:border-slate-400 rounded-lg text-[9px] font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer uppercase tracking-wider"
                                >
                                  ⭐️ Выставить оценку KPI
                                </button>
                              )}
                            </div>
                          )}
                          
                          <span className="text-[9px] text-slate-400 block text-right">{new Date(ch.created_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Private Folder (Director Only) */}
              {role === 'admin' && (
                <div className="space-y-4 pt-4 border-t border-slate-250">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    🔒 Личная папка (Доступ Shirin)
                  </h4>
                  
                  {/* Reviews List */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Оценки KPI & Отзывы:</p>
                    {reviews.filter(r => r.employee_name === selectedVolunteer.full_name).length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Закрытых записей о качестве работы пока нет.</p>
                    ) : (
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                        {reviews
                          .filter(r => r.employee_name === selectedVolunteer.full_name)
                          .map(r => (
                            <div key={r.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1 text-xs">
                              <div className="flex justify-between font-bold">
                                <span className="text-slate-800">KPI: {r.kpi_score.toFixed(1)} / 5.0</span>
                                <span className="text-[9px] text-slate-400">{new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
                              </div>
                              <p className="text-slate-600 leading-relaxed italic">"{r.feedback}"</p>
                              <p className="text-[9px] text-slate-400 text-right">Автор: {r.created_by}</p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Add Review Form */}
                  <form onSubmit={handleSubmitReview} className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Оценить работу:</p>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] text-slate-400 block font-semibold uppercase">Оценка KPI</label>
                        <select
                          value={reviewKpi}
                          onChange={(e) => setReviewKpi(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:border-slate-850 outline-none"
                        >
                          <option value="5">5.0 - Превосходно</option>
                          <option value="4">4.0 - Хорошо</option>
                          <option value="3">3.0 - Удовлетворительно</option>
                          <option value="2">2.0 - Требует внимания</option>
                          <option value="1">1.0 - Неудовлетворительно</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 block font-semibold uppercase">Характеристика / Заметка</label>
                      <textarea
                        required
                        placeholder="Укажите сильные стороны или области развития..."
                        value={reviewFeedback}
                        onChange={(e) => setReviewFeedback(e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs resize-none outline-none focus:border-slate-850"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] transition-colors"
                    >
                      {submittingReview ? 'Сохранение...' : 'Записать в личное дело'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-slate-150 pt-4">
              <button 
                onClick={() => setSelectedVolunteer(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-900">Регистрация нового волонтера</h3>
            
            <form onSubmit={handleRegisterVolunteer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-semibold block">Полное имя (ФИО)</label>
                <input
                  type="text"
                  required
                  placeholder="Иванов Иван Иванович"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-semibold block">Номер телефона (для сопоставления в Telegram)</label>
                <input
                  type="tel"
                  required
                  placeholder="+79991234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Волонтер должен будет предоставить боту именно этот номер при авторизации.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-semibold block">Telegram ID (опционально)</label>
                <input
                  type="number"
                  placeholder="123456789"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                />
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
                  {isSubmitting ? 'Сохранение...' : 'Зарегистрировать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
