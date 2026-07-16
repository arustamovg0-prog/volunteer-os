import Link from 'next/link';
import { Building2, ClipboardList, BookOpen, MessageSquare, UserCheck, UserRound, ChevronRight, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-blue-400/5 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse duration-[8s]" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-emerald-400/5 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse duration-[10s]" />

      {/* Main Container */}
      <div className="max-w-4xl w-full text-center space-y-12 animate-fade-in">
        {/* Logo and Brand */}
        <div className="space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
            <span className="font-extrabold text-white text-3xl tracking-wider">V</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Volunteer <span className="text-blue-600 bg-clip-text">OS</span>
          </h1>
          <p className="text-slate-650 max-w-lg mx-auto text-sm md:text-base leading-relaxed font-medium">
            Единая экосистема операционного управления волонтерскими проектами, интеграции с Telegram-ботом, базы знаний и аналитики KPI.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.02)] space-y-3 transition-all hover:scale-[1.02] duration-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h3 className="text-slate-900 font-bold text-sm">Канбан-доска</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Гибкое управление задачами с автоматическим контролем дедлайнов.</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.02)] space-y-3 transition-all hover:scale-[1.02] duration-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-slate-900 font-bold text-sm">Telegram Бот</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Быстрые микро-отчеты от волонтеров напрямую из мессенджера.</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.02)] space-y-3 transition-all hover:scale-[1.02] duration-200">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-slate-900 font-bold text-sm">Учет и KPI</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Автоматический расчет рейтингов на основе соблюдения дедлайнов.</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.02)] space-y-3 transition-all hover:scale-[1.02] duration-200">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-slate-900 font-bold text-sm">База знаний</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Иерархическое хранение регламентов, Markdown-статей и паролей.</p>
          </div>
        </div>

        {/* 3-Segment Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center flex-wrap">
          <Link
            href="/login?role=leader"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-slate-900/10 transition-all duration-200 active:scale-98 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            Руководитель и Сотрудники
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login?role=coordinator"
            className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/15 transition-all duration-200 active:scale-98 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            Координатор
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login?role=volunteer"
            className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/10 transition-all duration-200 active:scale-98 cursor-pointer"
          >
            <UserRound className="w-4 h-4" />
            Волонтер
            <ChevronRight className="w-4 h-4" />
          </Link>
          <a
            href="https://t.me/Volunteer_OS_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm transition-all duration-200 hover:scale-102 cursor-pointer flex items-center gap-1.5"
          >
            Открыть Telegram-бота
          </a>
        </div>

        {/* Footer */}
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          © {new Date().getFullYear()} Ассоциация волонтеров. Все права защищены.
        </p>
      </div>
    </main>
  );
}
