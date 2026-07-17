'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  UserRound,
  X,
  Trash2,
} from 'lucide-react';

interface StaffUser {
  id: string;
  role: 'admin' | 'manager';
  full_name: string;
  login?: string | null;
  phone?: string | null;
  telegram_id?: number | null;
  rating: number;
  created_at: string;
  avatar_url?: string | null;
}

type StaffTab = 'profiles' | 'create';

export default function StaffPage() {
  const [role, setRole] = useState('manager');
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [activeTab, setActiveTab] = useState<StaffTab>('profiles');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [fullName, setFullName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'manager' | 'admin'>('manager');
  const [phone, setPhone] = useState('');
  const [telegramId, setTelegramId] = useState('');

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole') || 'manager';
    setRole(savedRole);
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    try {
      const res = await fetch('/api/staff', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStaff(Array.isArray(data) ? data : []);
      } else {
        const payload = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: payload.error || 'Не удалось загрузить сотрудников.' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Ошибка соединения при загрузке сотрудников.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!fullName.trim() || !login.trim() || !password) {
      setMessage({ type: 'error', text: 'Заполните ФИО, логин и пароль.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: staffRole,
          full_name: fullName,
          login,
          password,
          phone,
          telegram_id: telegramId ? Number(telegramId) : null,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: payload.error || 'Не удалось создать сотрудника.' });
        return;
      }

      setStaff((prev) => [payload, ...prev]);
      setSelectedUser(payload);
      setActiveTab('profiles');
      setFullName('');
      setLogin('');
      setPassword('');
      setPhone('');
      setTelegramId('');
      setStaffRole('manager');
      setMessage({ type: 'success', text: 'Сотрудник создан. Профиль доступен директору.' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Ошибка соединения при создании сотрудника.' });
    } finally {
      setSubmitting(false);
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите полностью удалить этого сотрудника из базы?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchStaff();
        setSelectedUser(null);
      } else {
        const payload = await res.json().catch(() => ({}));
        alert(payload.error || 'Ошибка при удалении');
      }
    } catch (error) {
      console.error(error);
      alert('Ошибка соединения');
    }
  };

  const stats = useMemo(() => {
    const directors = staff.filter((user) => user.role === 'admin').length;
    const coordinators = staff.filter((user) => user.role === 'manager').length;
    const withTelegram = staff.filter((user) => user.telegram_id).length;
    return { directors, coordinators, withTelegram };
  }, [staff]);

  if (role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-lg font-extrabold text-slate-950">Доступ только для директора</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Профили сотрудников и координаторов может открывать и создавать только руководитель платформы.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Профиль директора</p>
            <h1 className="text-xl font-extrabold text-slate-950 flex items-center gap-2">
              <BriefcaseBusiness className="w-5 h-5 text-slate-900" />
              Сотрудники & координаторы
            </h1>
            <p className="text-xs text-slate-500">Создание аккаунтов, просмотр профилей и контроль Telegram-привязки штата</p>
          </div>

        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide ${activeTab === 'profiles' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Профили
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide ${activeTab === 'create' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Добавить
          </button>
        </div>
      </div>

      {message && (
        <div className={`rounded-2xl border px-4 py-3 text-xs font-semibold flex items-start gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel bg-white border border-slate-200 p-5 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Директоров</p>
          <p className="text-3xl font-extrabold text-slate-950 mt-2">{stats.directors}</p>
        </div>
        <div className="glass-panel bg-white border border-slate-200 p-5 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Координаторов</p>
          <p className="text-3xl font-extrabold text-slate-950 mt-2">{stats.coordinators}</p>
        </div>
        <div className="glass-panel bg-white border border-slate-200 p-5 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Telegram привязан</p>
          <p className="text-3xl font-extrabold text-slate-950 mt-2">{stats.withTelegram}</p>
        </div>
      </div>

      {activeTab === 'profiles' ? (
        <div className="glass-panel bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="premium-loader" />
            </div>
          ) : staff.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">Сотрудники еще не добавлены.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {staff.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
                      {user.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserRound className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-950 truncate">{user.full_name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                        {user.role === 'admin' ? 'Директор' : 'Координатор'} · @{user.login || 'без логина'}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    {user.telegram_id ? (
                      <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">TG привязан</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">TG не привязан</span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">Открыть профиль</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleCreateStaff} className="glass-panel bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 max-w-2xl">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-extrabold text-slate-950">Добавить сотрудника</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ФИО *</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm" placeholder="Например, Алишер Каримов" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Роль *</label>
              <select value={staffRole} onChange={(e) => setStaffRole(e.target.value as 'manager' | 'admin')} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm">
                <option value="manager">Координатор</option>
                <option value="admin">Директор / руководитель</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Логин *</label>
              <input value={login} onChange={(e) => setLogin(e.target.value)} required className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm" placeholder="coordinator.tashkent" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Пароль *</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} type="password" className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm" placeholder="Минимум 8 символов" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Телефон</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm" placeholder="+998..." />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telegram ID</label>
              <input value={telegramId} onChange={(e) => setTelegramId(e.target.value)} inputMode="numeric" className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm" placeholder="Например, 123456789" />
            </div>
          </div>

          <button disabled={submitting} className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-extrabold flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {submitting ? 'Создаем...' : 'Создать профиль'}
          </button>
        </form>
      )}
    </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <button className="flex-1" onClick={() => setSelectedUser(null)} aria-label="Закрыть профиль" />
          <aside className="w-full max-w-xl bg-white border-l border-slate-200 h-full p-6 shadow-2xl overflow-y-auto space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shrink-0">
                  {selectedUser.role === 'admin' ? <ShieldCheck className="w-7 h-7" /> : <UserRound className="w-7 h-7" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Профиль сотрудника</p>
                  <h2 className="text-lg font-extrabold text-slate-950 truncate">{selectedUser.full_name}</h2>
                  <p className="text-xs text-slate-500">{selectedUser.role === 'admin' ? 'Директор' : 'Координатор'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {role === 'admin' && (
                  <button
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="w-9 h-9 rounded-xl border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Удалить сотрудника"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setSelectedUser(null)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-950 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <ProfileLine icon={<KeyRound className="w-4 h-4" />} label="Логин" value={selectedUser.login ? `@${selectedUser.login}` : 'Не указан'} />
              <ProfileLine icon={<Phone className="w-4 h-4" />} label="Телефон" value={selectedUser.phone || 'Не указан'} />
              <ProfileLine icon={<Mail className="w-4 h-4" />} label="Telegram ID" value={selectedUser.telegram_id ? String(selectedUser.telegram_id) : 'Не привязан'} />
              <ProfileLine icon={<BadgeCheck className="w-4 h-4" />} label="Дата создания" value={new Date(selectedUser.created_at).toLocaleDateString('ru-RU')} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
              Только директор может просматривать этот профиль и создавать новые аккаунты сотрудников. Координаторы не имеют доступа к этой вкладке и защищенному API штата.
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function ProfileLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}
