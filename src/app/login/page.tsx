'use client';

import { Suspense } from 'react';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Shield,
  UserCheck,
  UserRound,
} from 'lucide-react';

type Segment = 'leader' | 'coordinator' | 'volunteer' | 'developer';

const segments = [
  {
    id: 'leader' as Segment,
    label: 'Руководитель и Сотрудники',
    sublabel: 'Полный доступ к платформе',
    description: 'Управление проектами, CRM, аналитика, финансы, настройки системы и назначение координаторов.',
    icon: Building2,
    color: 'slate',
    bg: 'bg-slate-900',
    ring: 'ring-slate-900',
    border: 'border-slate-900',
    textAccent: 'text-slate-900',
    hint: 'Например: admin',
  },
  {
    id: 'coordinator' as Segment,
    label: 'Координатор',
    sublabel: 'Доступ к назначенным проектам',
    description: 'Просмотр и управление только теми проектами, которые назначил руководитель. Задачи, волонтеры и чаты проектов.',
    icon: UserCheck,
    color: 'blue',
    bg: 'bg-blue-600',
    ring: 'ring-blue-600',
    border: 'border-blue-600',
    textAccent: 'text-blue-600',
    hint: 'Например: alexey',
  },
  {
    id: 'volunteer' as Segment,
    label: 'Волонтер',
    sublabel: 'Личный кабинет',
    description: 'Взятие задач, сдача отчетов через бота, просмотр своего рейтинга, уровня и наград.',
    icon: UserRound,
    color: 'emerald',
    bg: 'bg-emerald-600',
    ring: 'ring-emerald-600',
    border: 'border-emerald-600',
    textAccent: 'text-emerald-600',
    hint: 'Например: ivan',
  },
  {
    id: 'developer' as Segment,
    label: 'Разработчик Системы',
    sublabel: 'Доступ 24/7 к логам и здоровью',
    description: 'Автономная панель мониторинга, просмотр критических ошибок, системных логов и метрик БД/сервера.',
    icon: Shield,
    color: 'purple',
    bg: 'bg-purple-700',
    ring: 'ring-purple-700',
    border: 'border-purple-700',
    textAccent: 'text-purple-700',
    hint: 'Логин: developer',
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  // Determine initial segment from URL param
  const rawRole = searchParams.get('role');
  const initialSegment: Segment | null =
    rawRole === 'developer' ? 'developer' :
    rawRole === 'volunteer' ? 'volunteer' :
    rawRole === 'coordinator' ? 'coordinator' :
    rawRole === 'manager' || rawRole === 'leader' ? 'leader' : null;

  const [step, setStep] = useState<'choose' | 'login'>(initialSegment ? 'login' : 'choose');
  const [segment, setSegment] = useState<Segment | null>(initialSegment);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedSegment = segments.find((s) => s.id === segment);

  function pickSegment(id: Segment) {
    setSegment(id);
    setStep('login');
    setError('');
    setLogin('');
    setPassword('');
  }

  function goBack() {
    setStep('choose');
    setSegment(null);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: segment, login, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Не удалось войти');
        setLoading(false);
        return;
      }

      const user = data.user;
      if (data.token) {
        localStorage.setItem('sessionToken', data.token);
      }
      localStorage.setItem('currentUserId', user.id);
      localStorage.setItem('currentUserName', user.full_name);
      localStorage.setItem('currentUserRole', user.role);

      if (user.role === 'volunteer') {
        localStorage.setItem('volunteerId', user.id);
        localStorage.setItem('volunteerName', user.full_name);
        window.dispatchEvent(new Event('volunteer-session-change'));
      }

      window.dispatchEvent(new Event('auth-session-change'));
      const targetUrl = next && !next.startsWith('/login') ? next : (data.redirectTo || '/dashboard');
      router.replace(targetUrl);
      router.refresh();
    } catch {
      setError('Ошибка соединения. Проверьте, что платформа запущена.');
      setLoading(false);
    }
  }

  // ── STEP 1: Choose a segment ───────────────────────────────────────────────
  if (step === 'choose') {
    return (
      <main className="app-shell min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="w-full max-w-2xl space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Выберите ваш профиль</h1>
            <p className="text-sm text-slate-500">Выберите сегмент, соответствующий вашей роли в организации</p>
          </div>

          {/* Segment cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {segments.filter((seg) => seg.id !== 'developer').map((seg) => {
              const Icon = seg.icon;
              return (
                <button
                  key={seg.id}
                  onClick={() => pickSegment(seg.id)}
                  className={`group relative text-left p-5 rounded-2xl bg-white border-2 border-transparent hover:border-current hover:shadow-lg transition-all duration-200 shadow-sm hover:scale-[1.02] ${seg.textAccent} focus:outline-none focus:ring-2 ${seg.ring} focus:ring-offset-2`}
                >
                  <div className={`w-11 h-11 rounded-xl ${seg.bg} flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-105 transition-transform duration-200`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-tight mb-1">{seg.label}</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${seg.textAccent}`}>{seg.sublabel}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{seg.description}</p>

                  <div className={`absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <ArrowRight className={`w-4 h-4 ${seg.textAccent}`} />
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-center text-[10px] text-slate-400 font-medium">
            © {new Date().getFullYear()} Ассоциация волонтеров. Все права защищены.
          </p>
        </div>
      </main>
    );
  }

  // ── STEP 2: Login form for the chosen segment ──────────────────────────────
  const Icon = selectedSegment!.icon;

  return (
    <main className="app-shell min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-6 animate-slide-up">
        {/* Back button */}
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к выбору профиля
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className={`mx-auto w-14 h-14 rounded-2xl ${selectedSegment!.bg} flex items-center justify-center text-white shadow-md ring-1 ring-white/30`}>
              <Icon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-extrabold text-slate-950">
                {selectedSegment!.label}
              </h1>
              <p className={`text-[11px] font-bold uppercase tracking-wider ${selectedSegment!.textAccent}`}>
                {selectedSegment!.sublabel}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Логин</label>
              <input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder={selectedSegment!.hint}
                autoComplete="username"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Пароль</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              disabled={loading || !login.trim() || !password}
              className={`w-full py-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed ${selectedSegment!.bg} hover:opacity-90`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Проверка доступа...
                </>
              ) : (
                <>
                  Войти
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {segment === 'volunteer' && (
            <div className="text-center text-xs text-slate-500">
              Нет аккаунта?{' '}
              <button onClick={() => router.push('/volunteer-dashboard/auth')} className="font-bold text-emerald-700 hover:text-emerald-800">
                Зарегистрироваться
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="app-shell min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <div className="premium-loader" />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
