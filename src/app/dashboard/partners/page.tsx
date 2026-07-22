'use client';

import { useState, useEffect } from 'react';
import { 
  Handshake, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  Gift, 
  Trash2, 
  Loader2,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  AlertCircle
} from 'lucide-react';
import { getPrivilegedHeaders } from '@/lib/client-security';

interface Partner {
  id: string;
  name: string;
  category: 'donor' | 'sponsor' | 'ministry' | 'partner';
  anniversary_date: string; // YYYY-MM-DD
  contact_person: string;
  email?: string;
  phone?: string;
  auto_greet_enabled: boolean;
  created_at: string;
}

interface PartnerActivity {
  id: string;
  partnerId: string;
  eventName: string;
  description: string | null;
  date: string;
  createdAt: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('manager');

  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'donor' | 'sponsor' | 'ministry' | 'partner'>('partner');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [autoGreet, setAutoGreet] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mutatingPartnerId, setMutatingPartnerId] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Activities state
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [activities, setActivities] = useState<PartnerActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  
  const [actEventName, setActEventName] = useState('');
  const [actDescription, setActDescription] = useState('');
  const [actDate, setActDate] = useState('');
  const [submittingAct, setSubmittingAct] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole') || 'manager';
    setRole(savedRole);
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/partners');
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoGreet = async (id: string, currentStatus: boolean) => {
    setFormMessage(null);
    setMutatingPartnerId(id);
    try {
      const res = await fetch('/api/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getPrivilegedHeaders() },
        body: JSON.stringify({ id, auto_greet_enabled: !currentStatus })
      });
      if (res.ok) {
        setPartners(prev => prev.map(p => p.id === id ? { ...p, auto_greet_enabled: !currentStatus } : p));
      } else {
        const payload = await res.json().catch(() => ({}));
        setFormMessage({ type: 'error', text: payload.error || 'Не удалось изменить статус авто-поздравлений.' });
      }
    } catch (err) {
      console.error(err);
      setFormMessage({ type: 'error', text: 'Ошибка соединения при изменении статуса авто-поздравлений.' });
    } finally {
      setMutatingPartnerId(null);
    }
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    if (!name || !anniversaryDate || !contactPerson) {
      setFormMessage({ type: 'error', text: 'Пожалуйста, заполните обязательные поля.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getPrivilegedHeaders() },
        body: JSON.stringify({
          name,
          category,
          anniversary_date: anniversaryDate,
          contact_person: contactPerson,
          email,
          phone,
          auto_greet_enabled: autoGreet
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        // Clear form
        setName('');
        setAnniversaryDate('');
        setContactPerson('');
        setEmail('');
        setPhone('');
        setAutoGreet(true);
        await fetchPartners();
        setFormMessage({ type: 'success', text: 'Партнер добавлен в CRM.' });
      } else {
        const payload = await res.json().catch(() => ({}));
        setFormMessage({ type: 'error', text: payload.error || 'Ошибка при сохранении партнера.' });
      }
    } catch (err) {
      console.error(err);
      setFormMessage({ type: 'error', text: 'Ошибка соединения при сохранении партнера.' });
    } finally {
      setSubmitting(false);
    }
  };

  const openActivities = async (p: Partner) => {
    setSelectedPartner(p);
    setShowActivitiesModal(true);
    setLoadingActivities(true);
    try {
      const res = await fetch(`/api/partners/${p.id}/activities`);
      if (res.ok) setActivities(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner || !actEventName) return;
    setSubmittingAct(true);
    try {
      const res = await fetch(`/api/partners/${selectedPartner.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: actEventName, description: actDescription, date: actDate })
      });
      if (res.ok) {
        const newAct = await res.json();
        setActivities([newAct, ...activities]);
        setActEventName('');
        setActDescription('');
        setActDate('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAct(false);
    }
  };

  const handleDeletePartner = async (id: string) => {
    setFormMessage(null);
    if (role !== 'admin') {
      setFormMessage({ type: 'error', text: 'Удалять партнеров может только Руководитель.' });
      return;
    }
    setMutatingPartnerId(id);
    try {
      const res = await fetch(`/api/partners?id=${id}`, {
        method: 'DELETE',
        headers: getPrivilegedHeaders()
      });
      if (res.ok) {
        await fetchPartners();
        setFormMessage({ type: 'success', text: 'Партнер удален из CRM.' });
      } else {
        const payload = await res.json().catch(() => ({}));
        setFormMessage({ type: 'error', text: payload.error || 'Не удалось удалить партнера.' });
      }
    } catch (err) {
      console.error(err);
      setFormMessage({ type: 'error', text: 'Ошибка соединения при удалении партнера.' });
    } finally {
      setMutatingPartnerId(null);
    }
  };

  // Helper to check if anniversary is in the current month
  const isAnniversaryUpcoming = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length < 3) return false;
    const annMonth = parseInt(parts[1], 10) - 1; // 0-indexed month
    const annDay = parseInt(parts[2], 10);
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    // Check if the anniversary is in the same month (and within next 30 days roughly)
    return annMonth === currentMonth;
  };

  // Helper to check if anniversary is exactly today
  const isAnniversaryToday = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length < 3) return false;
    const annMonth = parseInt(parts[1], 10) - 1;
    const annDay = parseInt(parts[2], 10);
    
    const today = new Date();
    return annMonth === today.getMonth() && annDay === today.getDate();
  };

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.contact_person.toLowerCase().includes(search.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  );

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'donor': return { label: 'Донор / Грантодатель', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'sponsor': return { label: 'Коммерческий спонсор', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'ministry': return { label: 'Гос. ведомство / Министерство', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'partner': return { label: 'ННО Партнер', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
      default: return { label: cat, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Get active anniversary items
  const celebratingToday = partners.filter(p => isAnniversaryToday(p.anniversary_date));
  const upcomingThisMonth = partners.filter(p => isAnniversaryUpcoming(p.anniversary_date) && !isAnniversaryToday(p.anniversary_date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Handshake className="w-5 h-5 text-slate-800" />
            Партнеры & Спонсоры CRM
          </h1>
          <p className="text-xs text-slate-500">Управление внешними контрагентами, поздравлениями и календарем годовщин</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Добавить партнера
        </button>
      </div>

      {formMessage && (
        <div className={`rounded-xl border px-4 py-3 text-xs font-semibold ${
          formMessage.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {formMessage.text}
        </div>
      )}

      {/* Anniversary Alert Banner */}
      {(celebratingToday.length > 0 || upcomingThisMonth.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {celebratingToday.map(p => (
            <div key={p.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 flex items-start gap-3 shadow-xs">
              <Gift className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
              <div className="text-xs space-y-1">
                <p className="font-bold">🎉 СЕГОДНЯ ГОДОВЩИНА ОСНОВАНИЯ ПАРТНЕРА!</p>
                <p className="font-semibold">{p.name}</p>
                <p className="text-[10px] text-rose-600">
                  {p.auto_greet_enabled ? '🤖 Авто-поздравление отправлено по email / SMS.' : '⚠️ Авто-поздравление выключено. Отправьте поздравление вручную.'}
                </p>
              </div>
            </div>
          ))}

          {upcomingThisMonth.map(p => {
            const parts = p.anniversary_date.split('-');
            const dateStr = `${parts[2]}.${parts[1]}`;
            return (
              <div key={p.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 flex items-start gap-3 shadow-xs">
                <Calendar className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">📆 Предстоящая годовщина ({dateStr})</p>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-[10px] text-amber-600">Ответственный: {p.contact_person}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск партнеров по названию, представителю, почте..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* CRM List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">Загрузка контрагентов...</span>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
          <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-700">Ни один партнер не найден</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPartners.map((p) => {
            const catBadge = getCategoryBadge(p.category);
            
            return (
              <div 
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${catBadge.bg}`}>
                      {catBadge.label}
                    </span>
                    
                    {role === 'admin' && (
                      <button
                        onClick={() => handleDeletePartner(p.id)}
                        disabled={mutatingPartnerId === p.id}
                        className="text-slate-400 hover:text-red-500 disabled:text-slate-300 p-1 rounded-lg transition-colors"
                        title="Удалить из CRM"
                      >
                        {mutatingPartnerId === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{p.name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-semibold uppercase">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      Годовщина: {p.anniversary_date ? new Date(p.anniversary_date).toLocaleDateString('ru-RU') : 'Не указана'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <p className="text-slate-700 font-semibold">👤 {p.contact_person}</p>
                    
                    {p.email && (
                      <p className="text-slate-500 flex items-center gap-1.5 select-all">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        {p.email}
                      </p>
                    )}
                    
                    {p.phone && (
                      <p className="text-slate-500 flex items-center gap-1.5 select-all">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {p.phone}
                      </p>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <button
                      onClick={() => openActivities(p)}
                      className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-blue-100"
                    >
                      <Calendar className="w-4 h-4" />
                      История участия
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Авто-поздравления:</span>
                  <button
                    onClick={() => handleToggleAutoGreet(p.id, p.auto_greet_enabled)}
                    disabled={mutatingPartnerId === p.id}
                    className="flex items-center gap-1.5 font-bold hover:opacity-85 disabled:opacity-60 text-slate-800"
                  >
                    {p.auto_greet_enabled ? (
                      <>
                        <ToggleRight className="w-6 h-6 text-slate-900 shrink-0" />
                        <span className="text-slate-800 text-[10px] uppercase font-bold">Активны</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-6 h-6 text-slate-300 shrink-0" />
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Выключены</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Handshake className="w-4 h-4 text-slate-800" />
                Новая запись контрагента
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-950 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleAddPartner} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Название организации *</label>
                <input
                  type="text"
                  required
                  placeholder="Coca-Cola Ichimligi, Министерство..."
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
                    <option value="donor">Донор</option>
                    <option value="sponsor">Спонсор</option>
                    <option value="ministry">Гос. ведомство</option>
                    <option value="partner">ННО Партнер</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Дата Годовщины / Рег. *</label>
                  <input
                    type="date"
                    required
                    value={anniversaryDate}
                    onChange={(e) => setAnniversaryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Контактное лицо (ФИО, должность) *</label>
                <input
                  type="text"
                  required
                  placeholder="Иван Иванов (PR-директор)"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
                  <input
                    type="email"
                    placeholder="partner@mail.uz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Телефон</label>
                  <input
                    type="text"
                    placeholder="+998901234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto_greet"
                  checked={autoGreet}
                  onChange={(e) => setAutoGreet(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-200 text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="auto_greet" className="text-xs text-slate-700 font-semibold select-none">
                  Разрешить авто-поздравления по ИИ-шаблону
                </label>
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
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activities Modal */}
      {showActivitiesModal && selectedPartner && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                История: {selectedPartner.name}
              </h3>
              <button onClick={() => setShowActivitiesModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Add Activity Form */}
              <form onSubmit={handleAddActivity} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Новое мероприятие</h4>
                <div>
                  <input required type="text" placeholder="Название мероприятия / проекта" value={actEventName} onChange={e => setActEventName(e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <textarea placeholder="Как именно помог партнер? Описание поддержки (необязательно)" value={actDescription} onChange={e => setActDescription(e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 resize-none h-16"></textarea>
                </div>
                <div className="flex gap-3">
                  <input required type="date" value={actDate} onChange={e => setActDate(e.target.value)} className="w-1/2 p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900" />
                  <button type="submit" disabled={submittingAct} className="w-1/2 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {submittingAct ? 'Добавление...' : 'Добавить в историю'}
                  </button>
                </div>
              </form>

              {/* Timeline */}
              <div className="space-y-4 relative pt-4">
                <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200"></div>
                {loadingActivities ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : activities.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-6">История участия пока пуста.</p>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-bold text-slate-900 text-sm">{act.eventName}</h5>
                          <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-md">
                            {new Date(act.date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        {act.description && <p className="text-xs text-slate-600">{act.description}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
