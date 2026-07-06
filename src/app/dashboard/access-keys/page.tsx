'use client';

import { useState, useEffect } from 'react';
import { 
  Key, 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  ShieldAlert,
  Loader2,
  FileKey2,
  AlertCircle
} from 'lucide-react';
import { getPrivilegedHeaders } from '@/lib/client-security';

interface AccessKey {
  id: string;
  name: string;
  category: 'social' | 'grant' | 'website' | 'server';
  username: string;
  password_encrypted: string;
  notes?: string;
  created_at: string;
}

export default function AccessKeysPage() {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('manager');
  const [loading, setLoading] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  
  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'social' | 'grant' | 'website' | 'server'>('social');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole') || 'manager';
    setRole(savedRole);
    fetchKeys(savedRole);
  }, []);

  const fetchKeys = async (effectiveRole = role) => {
    setLoading(true);
    try {
      const res = await fetch('/api/access-keys', {
        headers: getPrivilegedHeaders(effectiveRole === 'admin'),
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (err) {
      console.error('Failed to load access keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    if (role !== 'admin') {
      alert('🔒 Доступ ограничен. Только Руководитель (Ширин) имеет доступ к просмотру паролей.');
      return;
    }
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') {
      alert('🔒 Доступ ограничен. Добавлять доступы может только Руководитель.');
      return;
    }

    if (!name || !username || !password) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/access-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getPrivilegedHeaders() },
        body: JSON.stringify({
          name,
          category,
          username,
          password_encrypted: password,
          notes
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        // Reset form
        setName('');
        setUsername('');
        setPassword('');
        setNotes('');
        fetchKeys();
      } else {
        alert('Ошибка при сохранении доступа');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (role !== 'admin') {
      alert('🔒 Доступ ограничен. Удалять ключи может только Руководитель.');
      return;
    }

    if (!confirm('Вы действительно хотите удалить этот доступ?')) return;

    try {
      const res = await fetch(`/api/access-keys?id=${id}`, {
        method: 'DELETE',
        headers: getPrivilegedHeaders(),
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredKeys = keys.filter(k => 
    k.name.toLowerCase().includes(search.toLowerCase()) ||
    k.username.toLowerCase().includes(search.toLowerCase()) ||
    (k.notes && k.notes.toLowerCase().includes(search.toLowerCase()))
  );

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'social': return { label: 'Соцсети', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'grant': return { label: 'Гранты / Гос', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'website': return { label: 'Сайты / CRM', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'server': return { label: 'Сервер / БД', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default: return { label: cat, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top bar header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Key className="w-5 h-5 text-slate-800" />
            Менеджер Паролей и Доступов
          </h1>
          <p className="text-xs text-slate-500">Безопасное хранилище учетных записей Ассоциации волонтеров</p>
        </div>

        {role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Добавить доступ
          </button>
        )}
      </div>

      {/* Info notification */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Регулирование прав доступа:</p>
          <p>• *Координатор* видит учетные записи в маскированном виде и не может расшифровать пароли или удалить записи.</p>
          <p>• *Руководитель (Ширин)* имеет полный доступ на чтение, создание, редактирование и удаление ключей.</p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по названию, логину или заметкам..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Access Keys Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">Загрузка учетных данных...</span>
        </div>
      ) : filteredKeys.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <FileKey2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-700">Пароли не найдены</p>
          <p className="text-[11px] text-slate-400 mt-1">Попробуйте изменить параметры поиска или добавьте новый допуск.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKeys.map((item) => {
            const catInfo = getCategoryLabel(item.category);
            const isVisible = visiblePasswords[item.id] || false;
            
            return (
              <div 
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Category tag & Actions */}
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${catInfo.bg}`}>
                      {catInfo.label}
                    </span>
                    
                    {role === 'admin' && (
                      <button
                        onClick={() => handleDeleteKey(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50/50 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">{item.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Создано: {new Date(item.created_at).toLocaleDateString('ru-RU')}</p>
                  </div>

                  {/* Credentials block */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Логин / Email</span>
                      <span className="font-mono text-slate-800 select-all font-semibold">{item.username}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Пароль</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-800 font-semibold tracking-wider select-all">
                          {isVisible ? item.password_encrypted : '••••••••••••'}
                        </span>
                        
                        <button
                          onClick={() => togglePasswordVisibility(item.id)}
                          className="text-slate-500 hover:text-slate-800 p-1 rounded-lg"
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {item.notes && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Заметки</span>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/30 p-2 border border-slate-100 rounded-lg">
                        {item.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl p-6 space-y-5 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-800" />
                Новая учетная запись
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-950 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKey} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Название ресурса *</label>
                <input
                  type="text"
                  required
                  placeholder="Например, Vercel Console, Telegram Bot API"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Категория</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800 bg-white"
                  >
                    <option value="social">Соцсети</option>
                    <option value="grant">Гранты / Гос</option>
                    <option value="website">Сайты / CRM</option>
                    <option value="server">Сервер / БД</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Имя пользователя / Email *</label>
                  <input
                    type="text"
                    required
                    placeholder="admin@vol-os.org"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Пароль *</label>
                <input
                  type="text"
                  required
                  placeholder="Вставьте надежный пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Пояснения / Инструкции</label>
                <textarea
                  placeholder="Кто имеет доступ, особенности использования..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-colors"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
