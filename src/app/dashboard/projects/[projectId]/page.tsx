'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  User, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  ChevronRight,
  ArrowLeftRight,
  ShieldAlert,
  MessageSquare,
  Send
} from 'lucide-react';

interface Task {
  id: string;
  project_id: string;
  title: string;
  status: 'pending' | 'accepted' | 'completed';
  assigned_to: string | null;
  deadline: string;
  is_overdue: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed';
  start_date?: string | null;
  end_date?: string | null;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
}

export default function ProjectKanbanPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Current authenticated role
  const [role, setRole] = useState('manager');

  // New Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskVolunteerId, setTaskVolunteerId] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Project Chat State
  const [chat, setChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

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
    fetchData();

    return () => window.removeEventListener('auth-session-change', handleSessionChange);
  }, [projectId]);

  // Polling for project chat messages
  useEffect(() => {
    if (!chat) return;
    
    const interval = setInterval(() => {
      fetchChatMessages(chat.id);
    }, 4000);

    return () => clearInterval(interval);
  }, [chat]);

  async function fetchProjectChat() {
    try {
      const res = await fetch(`/api/chats?projectId=${projectId}`);
      if (res.ok) {
        const chatsData = await res.json();
        if (chatsData.length > 0) {
          setChat(chatsData[0]);
          fetchChatMessages(chatsData[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch project chat', e);
    }
  }

  async function fetchChatMessages(chatId: string) {
    try {
      const res = await fetch(`/api/chats/messages?chatId=${chatId}`);
      if (res.ok) {
        setChatMessages(await res.json());
      }
    } catch (e) {
      console.error('Failed to load project chat messages', e);
    }
  }

  async function handleSendProjectMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chat || !newMsgText.trim()) return;
    const textToSend = newMsgText.trim();
    setNewMsgText('');

    const senderId = currentUserId;
    const senderName = currentUserName || (role === 'admin' ? 'Директор' : 'Координатор');
    const senderRole = role === 'admin' ? 'admin' : 'manager';
    if (!senderId) return;

    try {
      const res = await fetch('/api/chats/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chat.id,
          senderId,
          senderName,
          senderRole,
          text: textToSend
        })
      });
      if (res.ok) {
        fetchChatMessages(chat.id);
      }
    } catch (e) {
      console.error('Failed to send project chat message', e);
    }
  }

  async function fetchData() {
    try {
      const [projRes, tasksRes, usersRes] = await Promise.all([
        fetch(`/api/projects`),
        fetch(`/api/tasks?projectId=${projectId}`),
        fetch(`/api/users?role=volunteer`)
      ]);

      const [projectsData, tasksData, usersData] = await Promise.all([
        projRes.json(),
        tasksRes.json(),
        usersRes.json()
      ]);

      const matchedProj = projectsData.find((p: any) => p.id === projectId);
      setProject(matchedProj || null);
      setTasks(tasksData);
      setVolunteers(usersData);
      
      // Load project chat
      fetchProjectChat();
    } catch (e) {
      console.error('Failed to load Kanban board data', e);
    } finally {
      setLoading(false);
    }
  }

  // Shift status handler
  async function handleMoveTask(taskId: string, newStatus: 'pending' | 'accepted' | 'completed') {
    if (role !== 'admin') return; // Restriction safeguard
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        // Optimistic UI update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      }
    } catch (e) {
      console.error('Failed to shift task status', e);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDeadline) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          title: taskTitle,
          assigned_to: taskVolunteerId || null,
          deadline: new Date(taskDeadline).toISOString()
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setTaskTitle('');
        setTaskVolunteerId('');
        setTaskDeadline('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create task', err);
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

  if (!project) {
    return (
      <div className="text-center py-24 space-y-4">
        <h3 className="text-slate-900 text-lg font-bold">Проект не найден</h3>
        <Link href="/dashboard/projects" className="text-slate-600 text-xs hover:underline">
          Вернуться к реестру проектов
        </Link>
      </div>
    );
  }

  // Helper to determine deadline color state
  const getDeadlineState = (task: Task) => {
    if (task.status === 'completed') return 'normal';
    const now = new Date();
    const deadline = new Date(task.deadline);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime < 0) return 'overdue'; // Red
    if (diffDays <= 3) return 'urgent'; // Yellow
    return 'normal'; // Standard
  };

  // Group tasks by columns matching the database statuses
  const columns = [
    { title: 'К исполнению (Входящие)', status: 'pending' as const, tasks: tasks.filter(t => t.status === 'pending') },
    { title: 'В работе', status: 'accepted' as const, tasks: tasks.filter(t => t.status === 'accepted') },
    { title: 'Выполнено', status: 'completed' as const, tasks: tasks.filter(t => t.status === 'completed') }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link 
            href="/dashboard/projects"
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к проектам
          </Link>
          
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{project.title}</h2>
          <p className="text-xs text-slate-500 max-w-2xl">{project.description || 'Описание проекта отсутствует.'}</p>
        </div>
        
        {role === 'admin' ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Добавить задачу
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider self-start">
            <ShieldAlert className="w-3.5 h-3.5" />
            Режим мониторинга (Координатор)
          </div>
        )}
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((col) => (
          <div key={col.status} className="glass-panel p-5 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col h-[650px] min-w-0">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 px-1">
              <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase">{col.title}</h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 font-bold">
                {col.tasks.length}
              </span>
            </div>

            {/* Column Tasks Container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 kanban-column">
              {col.tasks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  Задач нет
                </div>
              ) : (
                col.tasks.map((task) => {
                  const deadlineState = getDeadlineState(task);
                  const volunteer = volunteers.find(v => v.id === task.assigned_to);

                  const cardStyle = {
                    overdue: 'border-red-200 bg-red-50/20 hover:border-red-300',
                    urgent: 'border-amber-200 bg-amber-50/20 hover:border-amber-300',
                    normal: 'border-slate-200 bg-white hover:border-slate-350'
                  }[deadlineState];

                  return (
                    <div 
                      key={task.id} 
                      className={`p-4 rounded-xl border flex flex-col justify-between min-h-[140px] shadow-sm transition-all ${cardStyle}`}
                    >
                      <div>
                        {/* Header details */}
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                            ID: {task.id.slice(0, 5)}
                          </span>
                          
                          {deadlineState === 'overdue' && (
                            <span className="text-[10px] text-red-600 flex items-center gap-1 font-bold">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              Просрочено
                            </span>
                          )}
                          {deadlineState === 'urgent' && (
                            <span className="text-[10px] text-amber-600 flex items-center gap-1 font-bold">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              Срочно
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-slate-900 text-xs mt-2 leading-snug">{task.title}</h4>
                      </div>

                      {/* Footer & Actions */}
                      <div className="space-y-2.5 mt-4 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1 truncate max-w-[55%]">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{volunteer ? volunteer.full_name : 'Не назначен'}</span>
                          </span>
                          <span className="flex items-center gap-1 text-[10px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {new Date(task.deadline).toLocaleDateString('ru-RU')}
                          </span>
                        </div>

                        {/* Shift action buttons (only visible if Director/admin) */}
                        {role === 'admin' && (
                          <div className="flex justify-end gap-1.5 pt-1">
                            {col.status !== 'pending' && (
                              <button
                                onClick={() => handleMoveTask(task.id, col.status === 'accepted' ? 'pending' : 'accepted')}
                                title="Переместить влево"
                                className="p-1 rounded-lg bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            
                            {col.status !== 'completed' && (
                              <button
                                onClick={() => handleMoveTask(task.id, col.status === 'pending' ? 'accepted' : 'completed')}
                                title="Переместить вправо"
                                className="p-1 rounded-lg bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Project Chat & Discussions */}
      <div className="glass-panel p-6 bg-white border border-slate-200 shadow-sm rounded-xl space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-900" />
            <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase">Обсуждение проекта (Чат)</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Сотрудники и Волонтеры</span>
        </div>

        {/* Messages list */}
        <div className="h-[250px] overflow-y-auto space-y-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
          {chatMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              В чате пока нет сообщений. Начните обсуждение проекта!
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;

              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col max-w-[75%] ${isMine ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                >
                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-0.5 px-1">
                    {msg.sender_name} ({msg.sender_role === 'volunteer' ? 'Волонтер' : 'Куратор'})
                  </span>
                  <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                    isMine 
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-slate-400 font-semibold mt-0.5 px-1">
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSendProjectMessage} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Напишите сообщение в чат проекта..."
            value={newMsgText}
            onChange={(e) => setNewMsgText(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-xs placeholder:text-slate-450 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Отправить
          </button>
        </form>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-slate-900">Добавить новую задачу</h3>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold block">Название задачи</label>
                <input
                  type="text"
                  required
                  placeholder="Введите краткое описание задачи"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold block">Назначить исполнителя</label>
                <select
                  value={taskVolunteerId}
                  onChange={(e) => setTaskVolunteerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                >
                  <option value="">-- Оставить неназначенной --</option>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id}>{v.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold block">Срок сдачи (Дедлайн)</label>
                <input
                  type="datetime-local"
                  required
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Добавление...' : 'Создать задачу'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
