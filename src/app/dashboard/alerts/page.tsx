'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  Send,
  Loader2,
  Check
} from 'lucide-react';
import { getPrivilegedHeaders } from '@/lib/client-security';

interface Volunteer {
  id: string;
  full_name: string;
  skills?: string[];
  latitude?: number;
  longitude?: number;
  rating: number;
}

interface EmergencyAlert {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  required_skills: string[];
  status: 'active' | 'resolved';
  notified_volunteer_ids: string[];
  attending_volunteer_ids: string[];
  created_at: string;
}

export default function EmergencyAlertsPage() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('manager');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(41.311);
  const [longitude, setLongitude] = useState(69.240);
  const [radius, setRadius] = useState(10);
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Поиск людей']);
  const [submitting, setSubmitting] = useState(false);
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedDistrict, setSelectedDistrict] = useState('Center');

  const availableSkills = ['Первая помощь', 'Внедорожник', 'Поиск людей', 'Связь / Рация'];

  const districts = [
    { name: 'Юнусабад', lat: 41.355, lng: 69.280, id: 'Yunusabad' },
    { name: 'Шайхантахур', lat: 41.325, lng: 69.215, id: 'Shayxontohur' },
    { name: 'Мирабад / Центр', lat: 41.311, lng: 69.240, id: 'Center' },
    { name: 'Чиланзар', lat: 41.285, lng: 69.205, id: 'Chilonzor' },
    { name: 'Сергели', lat: 41.240, lng: 69.210, id: 'Sergeli' }
  ];

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole') || 'manager';
    setRole(savedRole);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, usersRes] = await Promise.all([
        fetch('/api/alerts'),
        fetch('/api/users?role=volunteer')
      ]);
      
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (usersRes.ok) setVolunteers(await usersRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictSelect = (districtId: string) => {
    const d = districts.find(item => item.id === districtId);
    if (d) {
      setSelectedDistrict(districtId);
      setLatitude(d.lat);
      setLongitude(d.lng);
    }
  };

  const toggleSkill = (skill: string) => {
    setRequiredSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  // Haversine distance helper
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Compute matched volunteers in real-time
  const matchedVolunteers = volunteers.filter(v => {
    const vLat = v.latitude || 41.311;
    const vLng = v.longitude || 69.240;
    const dist = calculateDistance(latitude, longitude, vLat, vLng);
    
    const vSkills = v.skills || [];
    const matchesSkill = requiredSkills.some(s => vSkills.includes(s));
    
    return dist <= radius && matchesSkill;
  });

  const handleTriggerAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    if (!title || !description || requiredSkills.length === 0) {
      setFormMessage({ type: 'error', text: 'Заполните все обязательные поля и выберите хотя бы один навык.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getPrivilegedHeaders() },
        body: JSON.stringify({
          title,
          description,
          latitude,
          longitude,
          required_skills: requiredSkills,
          radius_km: radius
        })
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        await fetchData();
        setFormMessage({ type: 'success', text: 'Оповещение по тревоге запущено. Подходящие волонтеры получили уведомление.' });
      } else {
        const payload = await res.json().catch(() => ({}));
        setFormMessage({ type: 'error', text: payload.error || 'Ошибка запуска оповещения.' });
      }
    } catch (err) {
      console.error(err);
      setFormMessage({ type: 'error', text: 'Ошибка соединения при запуске оповещения.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveAlert = async (id: string) => {
    setFormMessage(null);
    setResolvingAlertId(id);

    try {
      const res = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getPrivilegedHeaders() },
        body: JSON.stringify({ id, status: 'resolved' })
      });
      if (res.ok) {
        await fetchData();
        setFormMessage({ type: 'success', text: 'Инцидент закрыт и переведен в статус «Решено».' });
      } else {
        const payload = await res.json().catch(() => ({}));
        setFormMessage({ type: 'error', text: payload.error || 'Не удалось закрыть инцидент.' });
      }
    } catch (err) {
      console.error(err);
      setFormMessage({ type: 'error', text: 'Ошибка соединения при закрытии инцидента.' });
    } finally {
      setResolvingAlertId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
          Экстренные Сборы & Тревоги (Emergency Control)
        </h1>
        <p className="text-xs text-slate-500">Система мгновенной мобилизации волонтеров по геолокации и спасательным навыкам</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Trigger Alarm */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Запустить экстренный сбор
            </h2>

            <form onSubmit={handleTriggerAlert} className="space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Название инцидента *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Поиск пропавшего человека в лесу"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Описание и точка сбора *</label>
                <textarea
                  required
                  placeholder="Потерялся ребенок 8 лет, дезориентирован. Сбор у главного входа Юнусабадского парка. С собой иметь фонари."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800 resize-none bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Сектор реагирования (Ташкент)</label>
                <div className="grid grid-cols-5 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {districts.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleDistrictSelect(d.id)}
                      className={`py-3.5 px-1.5 rounded-lg border text-[9px] font-bold text-center transition-all leading-tight ${
                        selectedDistrict === d.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Радиус (км) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs focus:border-slate-800 bg-white"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Широта (Lat)</label>
                  <input
                    type="text"
                    readOnly
                    value={latitude.toFixed(4)}
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-slate-400 rounded-xl text-xs font-mono outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Долгота (Lng)</label>
                  <input
                    type="text"
                    readOnly
                    value={longitude.toFixed(4)}
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-slate-400 rounded-xl text-xs font-mono outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Skills select checklist */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Требуемые навыки волонтеров *</label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map(skill => {
                    const isChecked = requiredSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                          isChecked 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real-time matched counter */}
              <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl text-red-800 text-[10px] font-semibold flex items-center justify-between">
                <span>Подходящих волонтеров в зоне сбора:</span>
                <span className="bg-red-650 text-white font-extrabold px-2 py-0.5 rounded-lg text-xs">
                  {matchedVolunteers.length} чел.
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting || matchedVolunteers.length === 0}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                ЗАПУСТИТЬ ОПОВЕЩЕНИЕ ПО ТРЕВОГЕ
              </button>

              {formMessage && (
                <div className={`rounded-xl border px-3 py-2 text-[11px] font-semibold ${
                  formMessage.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}>
                  {formMessage.text}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right list: Active & Resolved Alerts */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Текущие и прошлые тревоги
            </h2>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-900" /></div>
            ) : alerts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Журнал тревог пуст</p>
            ) : (
              <div className="space-y-4">
                {alerts.map(a => {
                  const isActive = a.status === 'active';
                  
                  return (
                    <div 
                      key={a.id} 
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all shadow-xs ${
                        isActive ? 'border-red-200 bg-red-50/10' : 'border-slate-200 bg-white opacity-80'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase border tracking-wider ${
                            isActive 
                              ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' 
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {isActive ? 'АКТИВНАЯ ТРЕВОГА' : 'РЕШЕНО / ЗАКРЫТО'}
                          </span>
                          <span className="text-[10px] text-slate-400">{new Date(a.created_at).toLocaleString('ru-RU')}</span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-xs leading-snug">{a.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs">
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Радиус</p>
                          <p className="font-semibold text-slate-700">{a.radius_km} км</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Сектор</p>
                          <p className="font-semibold text-slate-700">{a.latitude.toFixed(3)}, {a.longitude.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Оповещено</p>
                          <p className="font-semibold text-slate-700">{a.notified_volunteer_ids?.length || 0} чел.</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Откликнулось</p>
                          <p className="font-semibold text-slate-900">{a.attending_volunteer_ids?.length || 0} чел.</p>
                        </div>
                      </div>

                      {/* Attendee details list */}
                      {isActive && a.attending_volunteer_ids?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Выехали на место сбора:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {a.attending_volunteer_ids.map(vId => {
                              const vol = volunteers.find(v => v.id === vId);
                              return (
                                <span key={vId} className="px-2.5 py-1 rounded bg-slate-900 text-white font-bold text-[9px]">
                                  🚗 {vol ? vol.full_name : 'Волонтер'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {isActive && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleResolveAlert(a.id)}
                            disabled={resolvingAlertId === a.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-xs transition-colors"
                          >
                            {resolvingAlertId === a.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            {resolvingAlertId === a.id ? 'Закрываем...' : 'Закрыть инцидент (Решено)'}
                          </button>
                        </div>
                      )}
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
