'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Camera, 
  Check, 
  Plus, 
  Loader2, 
  ShieldCheck, 
  Building2, 
  FileText, 
  MessageSquare,
  Award,
  Clock,
  TrendingUp,
  Save,
  CheckCircle2
} from 'lucide-react';
import VolunteerBottomNav from '@/components/VolunteerBottomNav';
import Link from 'next/link';

interface UserDetails {
  id: string;
  full_name: string;
  phone?: string | null;
  telegram_id?: number | null;
  rating: number;
  xp?: number;
  level?: number;
  badges?: string[];
  skills?: string[];
  interests?: string[];
  avatar_url?: string | null;
}

interface OrganizationMembership {
  id: string;
  org_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  cover_letter?: string;
  created_at: string;
  org?: {
    id: string;
    name: string;
  } | null;
}

export default function VolunteerProfilePage() {
  const router = useRouter();
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  
  // Loading and alerts
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Volunteer state
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);

  // Editing form states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTelegramId, setEditTelegramId] = useState('');
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableSkills = ['Первая помощь', 'Внедорожник', 'Поиск людей', 'Связь / Рация', 'Экология'];
  const availableInterests = ['Экология', 'Защита животных', 'Социальная помощь', 'Здравоохранение', 'Образование'];

  useEffect(() => {
    const cachedId = localStorage.getItem('volunteerId');
    if (!cachedId) {
      router.push('/volunteer-dashboard/auth');
      return;
    }
    setVolunteerId(cachedId);
    loadProfileData(cachedId);
  }, []);

  async function loadProfileData(userId: string) {
    setLoading(true);
    try {
      // Fetch user details
      const resU = await fetch(`/api/users`);
      const usersList = await resU.json();
      const user = usersList.find((u: any) => u.id === userId);
      
      // Fetch user memberships
      const resM = await fetch(`/api/organizations/memberships?userId=${userId}`);
      const membershipsList = await resM.json();

      if (user) {
        setUserDetails(user);
        setEditName(user.full_name);
        setEditPhone(user.phone || '');
        setEditTelegramId(user.telegram_id ? String(user.telegram_id) : '');
        setEditAvatar(user.avatar_url || null);
        setSelectedSkills(user.skills || []);
        setSelectedInterests(user.interests || []);
        setMemberships(membershipsList);
      }
    } catch (e) {
      console.error('Failed to load profile data:', e);
    } finally {
      setLoading(false);
    }
  }

  // Handle avatar local photo upload (FileReader to Base64)
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 1.5 МБ');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim() || !volunteerId) {
      alert('ФИО и телефон обязательны для заполнения');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: volunteerId,
          full_name: editName.trim(),
          phone: editPhone.trim(),
          telegram_id: editTelegramId ? Number(editTelegramId) : null,
          skills: selectedSkills,
          interests: selectedInterests,
          avatar_url: editAvatar
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUserDetails(updatedUser);
        localStorage.setItem('volunteerName', updatedUser.full_name);
        
        // Trigger session event to update headers
        window.dispatchEvent(new Event('volunteer-session-change'));
        
        setToastMessage('Изменения профиля сохранены успешно!');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert('Ошибка при обновлении профиля');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка соединения при сохранении профиля');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  // Calculate rating grade properties
  const ratingVal = userDetails?.rating ?? 5.0;
  const getRatingLetter = (rating: number) => {
    if (rating >= 4.8) return { letter: 'A', text: 'Отлично', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (rating >= 4.0) return { letter: 'B', text: 'Хорошо', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (rating >= 3.0) return { letter: 'C', text: 'Удовлетворительно', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { letter: 'D', text: 'Неудовлетворительно', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  };
  const currentGrade = getRatingLetter(ratingVal);
  const xpProgress = (userDetails?.xp || 0) % 100;

  return (
    <div className="space-y-6 pb-24 animate-fade-in px-1 bg-[#F9FAFB] min-h-screen">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-slate-900" />
        <h2 className="text-base font-bold text-slate-900">Мой профиль волонтера</h2>
      </div>

      {/* Profile summary header card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          
          {/* Avatar Area with Camera Overlay */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-650 hover:border-slate-450 transition-all cursor-pointer overflow-hidden relative group shrink-0"
          >
            {editAvatar ? (
              <img src={editAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-slate-350" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <Camera className="w-4 h-4" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-slate-950 truncate leading-snug">{userDetails?.full_name}</h3>
              <span className="px-1.5 py-0.2 rounded bg-slate-100 border text-[8px] font-black text-slate-700 font-mono uppercase shrink-0">
                ID: {userDetails?.id}
              </span>
            </div>
            <p className="text-[10px] text-slate-450 font-bold flex items-center gap-1.5">
              <span>Уровень: <span className="text-slate-900 font-extrabold">{userDetails?.level || 1}</span></span>
              <span>•</span>
              <span>Опыт: <span className="text-slate-900 font-extrabold">{userDetails?.xp || 0} XP</span></span>
            </p>
          </div>

          {/* Letter Grade */}
          <div className="shrink-0">
            <div className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center shadow-sm ${currentGrade.color}`}>
              <span className="text-lg font-black tracking-tighter">{currentGrade.letter}</span>
              <span className="text-[6px] font-black uppercase tracking-wider -mt-1">{currentGrade.text}</span>
            </div>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="space-y-1.5 pt-1 border-t">
          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
            <span>Прогресс до уровня {(userDetails?.level || 1) + 1}</span>
            <span className="font-mono text-slate-700">{xpProgress} / 100 XP</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
            <div 
              className="bg-slate-900 h-full rounded-full transition-all duration-300" 
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Edit Details Form */}
      <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block border-b pb-2">Личные данные волонтера</h4>
        
        <div className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">ФИО Волонтера</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Номер телефона</label>
            <input
              type="tel"
              required
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Telegram ID (для сбора по тревоге)</label>
            <input
              type="number"
              value={editTelegramId}
              onChange={(e) => setEditTelegramId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
            />
          </div>
        </div>

        {/* Skills list checkbox selector */}
        <div className="space-y-1.5 border-t pt-3.5">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Ваши навыки</label>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {availableSkills.map(sk => {
              const isChecked = selectedSkills.includes(sk);
              return (
                <button
                  key={sk}
                  type="button"
                  onClick={() => toggleSkill(sk)}
                  className={`px-3 py-1.5 rounded-xl border text-[9px] font-bold transition-all flex items-center gap-1 ${
                    isChecked 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350'
                  }`}
                >
                  {isChecked ? <Check className="w-2.5 h-2.5 text-white" /> : <Plus className="w-2.5 h-2.5 text-slate-400" />}
                  {sk}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interests list checkbox selector */}
        <div className="space-y-1.5 border-t pt-3.5 pb-2">
          <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Направления интересов</label>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {availableInterests.map(interest => {
              const isChecked = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-xl border text-[9px] font-bold transition-all flex items-center gap-1 ${
                    isChecked 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350'
                  }`}
                >
                  {isChecked ? <Check className="w-2.5 h-2.5 text-white" /> : <Plus className="w-2.5 h-2.5 text-slate-400" />}
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs active:scale-98"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Сохранение профиля...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Сохранить изменения
            </>
          )}
        </button>
      </form>

      {/* Applications Section ("Мои заявки в организации") */}
      <div className="space-y-3">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1 block">
          Мои заявки на вступление ({memberships.length})
        </span>

        {memberships.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs py-10">
            Вы еще не подавали заявок в волонтерские организации.
          </div>
        ) : (
          <div className="space-y-3">
            {memberships.map((memb) => {
              const statusColors = {
                pending: 'bg-amber-50 text-amber-700 border-amber-150',
                approved: 'bg-emerald-50 text-emerald-700 border-emerald-150',
                rejected: 'bg-rose-50 text-rose-700 border-rose-150'
              }[memb.status] || 'bg-slate-50 text-slate-700';

              const statusLabels = {
                pending: 'На рассмотрении',
                approved: 'Одобрена',
                rejected: 'Отклонена'
              }[memb.status] || memb.status;

              return (
                <div key={memb.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Building2 className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                      {memb.org?.name || 'Загрузка организации...'}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${statusColors}`}>
                      {statusLabels}
                    </span>
                  </div>

                  {memb.cover_letter && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-500 italic text-[10px] leading-relaxed">
                      "{memb.cover_letter}"
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Подана: {new Date(memb.created_at).toLocaleDateString('ru-RU')}</span>
                    
                    {/* Chat shortcut if approved */}
                    {memb.status === 'approved' && (
                      <Link 
                        href="/volunteer-dashboard/chats"
                        className="text-slate-900 hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Открыть чат
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
