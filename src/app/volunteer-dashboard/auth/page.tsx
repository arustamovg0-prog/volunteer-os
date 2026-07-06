'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, MessageSquare, ArrowRight, Loader2, Sparkles, Camera, Check, Plus, User } from 'lucide-react';

interface VolunteerOption {
  id: string;
  full_name: string;
  phone: string;
}

export default function VolunteerAuthPage() {
  const router = useRouter();
  
  // Auth Modes: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Volunteers list for simulation login
  const [volunteers, setVolunteers] = useState<VolunteerOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regLogin, setRegLogin] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regTelegramId, setRegTelegramId] = useState('');
  const [regAvatar, setRegAvatar] = useState<string | null>(null);
  
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableSkills = ['Первая помощь', 'Внедорожник', 'Поиск людей', 'Связь / Рация', 'Экология'];
  const availableInterests = ['Экология', 'Защита животных', 'Социальная помощь', 'Здравоохранение', 'Образование'];

  useEffect(() => {
    async function loadVolunteers() {
      try {
        const res = await fetch('/api/users?role=volunteer');
        if (res.ok) {
          const data = await res.json();
          setVolunteers(data);
          if (data.length > 0) {
            setSelectedId(data[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load volunteers for auth:', e);
      } finally {
        setLoading(false);
      }
    }
    loadVolunteers();
  }, []);

  // Handle local photo upload (converts to base64)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 1.5 МБ');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle skills selections
  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  // Toggle interests selections
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  // Handle volunteer login redirect
  const handleLogin = () => {
    setAuthLoading(true);
    const volunteer = volunteers.find(v => v.id === selectedId);
    if (volunteer) {
      localStorage.setItem('volunteerId', volunteer.id);
      localStorage.setItem('volunteerName', volunteer.full_name);
      
      window.dispatchEvent(new Event('volunteer-session-change'));
      
      setTimeout(() => {
        router.push('/volunteer-dashboard');
      }, 1000);
    }
  };

  // Handle new volunteer registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regLogin.trim() || !regPassword) {
      alert('ФИО, логин, пароль и номер телефона обязательны для заполнения');
      return;
    }

    if (regPassword.length < 8) {
      alert('Пароль должен быть не короче 8 символов');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'volunteer',
          full_name: regName.trim(),
          login: regLogin.trim().toLowerCase(),
          password: regPassword,
          phone: regPhone.trim(),
          telegram_id: regTelegramId ? Number(regTelegramId) : null,
          skills: selectedSkills,
          interests: selectedInterests,
          avatar_url: regAvatar
        })
      });

      if (res.ok) {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'volunteer', login: regLogin.trim().toLowerCase(), password: regPassword })
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          localStorage.setItem('volunteerId', loginData.user.id);
          localStorage.setItem('volunteerName', loginData.user.full_name);
          localStorage.setItem('currentUserId', loginData.user.id);
          localStorage.setItem('currentUserName', loginData.user.full_name);
          localStorage.setItem('currentUserRole', 'volunteer');
          window.dispatchEvent(new Event('volunteer-session-change'));
          window.dispatchEvent(new Event('auth-session-change'));
        }

        router.push('/volunteer-dashboard');
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Ошибка при регистрации');
        setAuthLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка соединения при регистрации');
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200 shadow-xl rounded-2xl p-6 text-center space-y-6">
        
        {/* Brand Header */}
        <div className="relative inline-flex mx-auto">
          <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md">
            <MessageSquare className="w-7 h-7" />
          </div>
          <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-4 border-white text-white p-1 rounded-full">
            <ShieldCheck className="w-3 h-3" />
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold text-slate-950">Кабинет Волонтера</h1>
          <p className="text-xs text-slate-500">
            Единая мобильная платформа для координации волонтерских сил
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-650'
            }`}
          >
            Войти
          </button>
          <button
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-650'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* MODE 1: LOGIN FLOW */}
        {authMode === 'login' ? (
          <div className="space-y-4 text-left">
            <button
              onClick={() => router.push('/login?role=volunteer')}
              disabled={authLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs active:scale-98"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Авторизация в системе...
                </>
              ) : (
                <>
                  Перейти к входу по логину и паролю
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* MODE 2: REGISTRATION FORM */
          <form onSubmit={handleRegister} className="space-y-4 text-left">
            
            {/* Photo Upload Row */}
            <div className="flex items-center gap-4 border-b pb-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-450 transition-all cursor-pointer overflow-hidden relative group shrink-0"
              >
                {regAvatar ? (
                  <img src={regAvatar} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-bold text-white transition-opacity">
                  Сменить
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900">Фотография профиля</h4>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Загрузите портретное фото для карточки волонтера (макс. 1.5 МБ, JPEG/PNG)
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">ФИО Волонтера</label>
                <input
                  type="text"
                  required
                  placeholder="Иван Петров"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white text-slate-850 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Логин</label>
                <input
                  type="text"
                  required
                  placeholder="ivan"
                  value={regLogin}
                  onChange={(e) => setRegLogin(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white text-slate-850 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Пароль</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Минимум 8 символов"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white text-slate-850 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Номер телефона</label>
                <input
                  type="tel"
                  required
                  placeholder="+998 (90) 123-45-67"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white text-slate-850 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Telegram ID (для интеграции с ботом)</label>
                <input
                  type="number"
                  placeholder="123456789"
                  value={regTelegramId}
                  onChange={(e) => setRegTelegramId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white text-slate-855 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono"
                />
              </div>
            </div>

            {/* Skills checklist tags */}
            <div className="space-y-1.5 border-t pt-3">
              <label className="text-[9px] font-bold text-slate-455 uppercase tracking-wider block">Ваши практические навыки</label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {availableSkills.map(sk => {
                  const isChecked = selectedSkills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all flex items-center gap-1 ${
                        isChecked 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350'
                      }`}
                    >
                      {isChecked ? <Check className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-slate-400" />}
                      {sk}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interests checklist tags */}
            <div className="space-y-1.5 border-t pt-3 pb-2">
              <label className="text-[9px] font-bold text-slate-455 uppercase tracking-wider block">Сферы интересов</label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {availableInterests.map(interest => {
                  const isChecked = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all flex items-center gap-1 ${
                        isChecked 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350'
                      }`}
                    >
                      {isChecked ? <Check className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-slate-400" />}
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Register */}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs active:scale-98"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Создание аккаунта...
                </>
              ) : (
                <>
                  Зарегистрироваться и войти
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Info Footer */}
        <div className="border-t pt-4 text-[9px] text-slate-400 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
          <span>Синхронизация с цифровым архивом и базой Ассоциации</span>
        </div>

      </div>
    </div>
  );
}
