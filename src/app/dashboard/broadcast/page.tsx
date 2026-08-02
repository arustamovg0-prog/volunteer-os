'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, Users, ShieldCheck, AlertCircle, Megaphone, Paperclip, 
  Search, Check, X, FolderGit2, Building2, Trash2, FileText, 
  UserCheck, CheckSquare, Square, Filter, FileCode, Image, FileSpreadsheet
} from 'lucide-react';
import { getPrivilegedHeaders } from '@/lib/client-security';

interface UserItem {
  id: string;
  full_name?: string;
  fullName?: string;
  phone?: string;
  role: string;
  telegram_id?: string;
  telegramId?: string;
  rating?: number;
}

interface ProjectItem {
  id: string;
  title: string;
}

interface OrgItem {
  id: string;
  name: string;
}

export default function BroadcastPage() {
  const [targetingMode, setTargetingMode] = useState<'roles' | 'selective' | 'project' | 'organization'>('roles');
  
  // Roles mode state
  const [roles, setRoles] = useState({
    volunteer: true,
    manager: false,
    admin: false
  });

  // Selective mode state
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [filterTgOnly, setFilterTgOnly] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Project / Organization state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [organizations, setOrganizations] = useState<OrgItem[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');

  // Message & File state
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission status
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resultMsg, setResultMsg] = useState('');

  // Load initial data
  useEffect(() => {
    fetchUsers();
    fetchProjects();
    fetchOrganizations();
  }, []);

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users', { headers: getPrivilegedHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load users for broadcast:', e);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects', { headers: getPrivilegedHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
        if (data.length > 0) setSelectedProjectId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  }

  async function fetchOrganizations() {
    try {
      const res = await fetch('/api/organizations', { headers: getPrivilegedHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(Array.isArray(data) ? data : []);
        if (data.length > 0) setSelectedOrganizationId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load organizations:', e);
    }
  }

  const handleRoleToggle = (role: 'volunteer' | 'manager' | 'admin') => {
    setRoles(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllFilteredUsers = () => {
    const filteredIds = filteredUsers.map(u => u.id);
    const newSelected = Array.from(new Set([...selectedUserIds, ...filteredIds]));
    setSelectedUserIds(newSelected);
  };

  const deselectAllUsers = () => {
    setSelectedUserIds([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // Filtered users for Selective Mode
  const filteredUsers = allUsers.filter(u => {
    const tgId = u.telegramId || u.telegram_id;
    if (filterTgOnly && !tgId) return false;

    const query = userSearch.toLowerCase().trim();
    if (!query) return true;

    const name = u.fullName || u.full_name || '';
    return (
      name.toLowerCase().includes(query) ||
      u.phone?.includes(query) ||
      u.role?.toLowerCase().includes(query)
    );
  });

  // Calculate total estimate recipients
  const getRecipientEstimate = () => {
    if (targetingMode === 'selective') {
      return selectedUserIds.length;
    }
    if (targetingMode === 'roles') {
      const selectedRoles = Object.entries(roles).filter(([_, val]) => val).map(([r]) => r);
      return allUsers.filter(u => selectedRoles.includes(u.role) && (u.telegramId || u.telegram_id)).length;
    }
    if (targetingMode === 'project') {
      return 'Все волонтеры проекта';
    }
    if (targetingMode === 'organization') {
      return 'Все участники организации';
    }
    return 0;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return <Image className="w-5 h-5 text-blue-500" />;
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return <FileText className="w-5 h-5 text-amber-500" />;
    return <FileCode className="w-5 h-5 text-purple-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleBroadcast = async () => {
    if (!message.trim() && !file) {
      setStatus('error');
      setResultMsg('Введите текст сообщения или прикрепите файл.');
      return;
    }

    if (targetingMode === 'roles') {
      const selectedRoles = Object.entries(roles).filter(([_, isSel]) => isSel).map(([role]) => role);
      if (selectedRoles.length === 0) {
        setStatus('error');
        setResultMsg('Выберите хотя бы одну роль для рассылки.');
        return;
      }
    }

    if (targetingMode === 'selective' && selectedUserIds.length === 0) {
      setStatus('error');
      setResultMsg('Выберите хотя бы одного волонтера из списка.');
      return;
    }

    if (targetingMode === 'project' && !selectedProjectId) {
      setStatus('error');
      setResultMsg('Выберите проект для рассылки.');
      return;
    }

    if (targetingMode === 'organization' && !selectedOrganizationId) {
      setStatus('error');
      setResultMsg('Выберите организацию для рассылки.');
      return;
    }

    setStatus('loading');
    setResultMsg('');

    try {
      const formData = new FormData();
      formData.append('message', message);

      if (file) {
        formData.append('file', file);
      }

      if (targetingMode === 'roles') {
        const selectedRoles = Object.entries(roles).filter(([_, isSel]) => isSel).map(([role]) => role);
        formData.append('roles', JSON.stringify(selectedRoles));
      } else if (targetingMode === 'selective') {
        formData.append('userIds', JSON.stringify(selectedUserIds));
      } else if (targetingMode === 'project') {
        formData.append('projectId', selectedProjectId);
      } else if (targetingMode === 'organization') {
        formData.append('organizationId', selectedOrganizationId);
      }

      const res = await fetch('/api/telegram/broadcast', {
        method: 'POST',
        headers: getPrivilegedHeaders(),
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setResultMsg(data.error || 'Произошла ошибка при отправке.');
        return;
      }

      setStatus('success');
      setResultMsg(`Рассылка успешно завершена! Доставлено: ${data.count} из ${data.totalAttempted || data.count} получателей.`);
      setMessage('');
      setFile(null);
    } catch (e) {
      console.error(e);
      setStatus('error');
      setResultMsg('Ошибка сети при отправке рассылки.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Массовая рассылка</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Отправка объявлений, данных и файлов любых форматов волонтерам через Telegram-бота
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel bg-white p-6 md:p-8 space-y-8 shadow-sm rounded-2xl border border-slate-200">
        
        {/* 1. Targeting Mode Tabs */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            Режим выбора получателей
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setTargetingMode('roles')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                targetingMode === 'roles'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              По группам
            </button>

            <button
              type="button"
              onClick={() => setTargetingMode('selective')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                targetingMode === 'selective'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Выборочно
              {selectedUserIds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                  {selectedUserIds.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTargetingMode('project')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                targetingMode === 'project'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-blue-500" />
              По проекту
            </button>

            <button
              type="button"
              onClick={() => setTargetingMode('organization')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                targetingMode === 'organization'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-purple-500" />
              По организации
            </button>
          </div>
        </div>

        {/* 2. Target Configuration Body */}

        {/* Mode A: By Roles */}
        {targetingMode === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            <label className={`cursor-pointer p-4 rounded-2xl border transition-all ${roles.volunteer ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Волонтеры</span>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer" 
                  checked={roles.volunteer} 
                  onChange={() => handleRoleToggle('volunteer')} 
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Основной состав волонтеров</p>
            </label>

            <label className={`cursor-pointer p-4 rounded-2xl border transition-all ${roles.manager ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Координаторы</span>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer" 
                  checked={roles.manager} 
                  onChange={() => handleRoleToggle('manager')} 
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Лидеры и менеджеры проектов</p>
            </label>

            <label className={`cursor-pointer p-4 rounded-2xl border transition-all ${roles.admin ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Сотрудники & Админы</span>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer" 
                  checked={roles.admin} 
                  onChange={() => handleRoleToggle('admin')} 
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Администраторы и руководящий состав</p>
            </label>
          </div>
        )}

        {/* Mode B: Selective Volunteer Pick */}
        {targetingMode === 'selective' && (
          <div className="space-y-4 animate-fade-in border border-slate-200 rounded-2xl p-5 bg-slate-50/40">
            {/* Selective Controls Top Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск по ФИО, номеру телефона или роли..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                {userSearch && (
                  <button 
                    onClick={() => setUserSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action buttons & filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterTgOnly(!filterTgOnly)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    filterTgOnly 
                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  Только с Telegram
                </button>

                <button
                  type="button"
                  onClick={selectAllFilteredUsers}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Выбрать всех ({filteredUsers.length})
                </button>

                {selectedUserIds.length > 0 && (
                  <button
                    type="button"
                    onClick={deselectAllUsers}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Сбросить ({selectedUserIds.length})
                  </button>
                )}
              </div>
            </div>

            {/* Selected Users Chips Summary */}
            {selectedUserIds.length > 0 && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Выбранные получатели ({selectedUserIds.length}):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto pr-1">
                  {selectedUserIds.map(id => {
                    const u = allUsers.find(user => user.id === id);
                    if (!u) return null;
                    return (
                      <span 
                        key={id} 
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"
                      >
                        {u.fullName || u.full_name || 'Пользователь'}
                        <button 
                          onClick={() => toggleUserSelection(id)}
                          className="hover:text-rose-600 transition-colors ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Volunteers Multi-Select Checkbox List */}
            {loadingUsers ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                Загрузка списка пользователей...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-xl bg-white">
                Пользователи по вашему запросу не найдены.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {filteredUsers.map(u => {
                  const isSelected = selectedUserIds.includes(u.id);
                  const hasTg = !!(u.telegramId || u.telegram_id);
                  const displayName = u.fullName || u.full_name || 'Пользователь';

                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUserSelection(u.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected 
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/20' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">{displayName}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{u.phone || 'Телефон не указан'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasTg ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                            TG Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                            Нет TG
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Mode C: By Project */}
        {targetingMode === 'project' && (
          <div className="space-y-3 p-5 border border-slate-200 rounded-2xl bg-slate-50/40 animate-fade-in">
            <label className="text-xs font-bold text-slate-700 block">Выберите целевой проект:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500">Сообщение получат все волонтеры, задействованные в задачах данного проекта.</p>
          </div>
        )}

        {/* Mode D: By Organization */}
        {targetingMode === 'organization' && (
          <div className="space-y-3 p-5 border border-slate-200 rounded-2xl bg-slate-50/40 animate-fade-in">
            <label className="text-xs font-bold text-slate-700 block">Выберите целевую организацию:</label>
            <select
              value={selectedOrganizationId}
              onChange={(e) => setSelectedOrganizationId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              {organizations.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500">Сообщение получат все одобренные постоянные волонтеры выбранной организации.</p>
          </div>
        )}

        {/* 3. File Attachment Section (Any File Format) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-slate-500" />
              Прикрепить файл любого типа
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Документы, Фото, Таблицы, Архивы, Видео</span>
          </div>

          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-100/50 space-y-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-10 h-10 rounded-full bg-slate-200/60 group-hover:bg-slate-900 group-hover:text-white text-slate-600 flex items-center justify-center mx-auto transition-colors">
                <Paperclip className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Перетащите сюда файл или нажмите для выбора</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Поддерживаются файлы любых расширений: .pdf, .xlsx, .docx, .png, .zip и т.д.</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between animate-fade-in shadow-2xs">
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                  {getFileIcon(file.name)}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-slate-900 block truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{formatFileSize(file.size)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-100/80 transition-colors cursor-pointer shrink-0"
                title="Удалить файл"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 4. Message Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-slate-500" />
              Текст сообщения
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Поддерживается Markdown</span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Введите текст рассылки... (например: **Важное объявление!** Завтра сбор в 10:00. Прикрепляем инструкции.)"
            className="w-full h-40 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-none text-sm leading-relaxed"
          />
        </div>

        {/* 5. Status Messages */}
        {status === 'error' && (
          <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-900">Ошибка отправки</h4>
              <p className="text-[11px] text-rose-700 mt-0.5">{resultMsg}</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 flex items-start gap-3 animate-fade-in">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900">Успешно!</h4>
              <p className="text-[11px] text-emerald-700 mt-0.5">{resultMsg}</p>
            </div>
          </div>
        )}

        {/* 6. Footer Submit Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Ориентировочно получателей: <span className="font-extrabold text-slate-900">{getRecipientEstimate()}</span>
          </div>

          <button
            onClick={handleBroadcast}
            disabled={status === 'loading'}
            className="flex items-center justify-center gap-2 px-7 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md shadow-slate-900/10 cursor-pointer active:scale-98"
          >
            {status === 'loading' ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Отправка...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Отправить рассылку
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
