'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import NotificationsBell from '@/components/NotificationsBell';
import { useTranslation } from '@/lib/i18n';
import { 
  LayoutDashboard, 
  FolderGit2, 
  Users2, 
  BookOpen, 
  FileSpreadsheet, 
  ShieldCheck,
  Shield,
  UserCircle2,
  CalendarDays,
  MessageSquare,
  Building2,
  Settings,
  Boxes,
  Trophy,
  Key,
  Archive,
  Handshake,
  FileText,
  Calculator,
  Sparkles,
  AlertTriangle,
  LogOut,
  Bot,
  BriefcaseBusiness,
  Menu,
  X,
  Megaphone,
  Activity
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const [role, setRole] = useState('manager');
  const [name, setName] = useState('Пользователь');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadSession = () => {
      const savedRole = localStorage.getItem('currentUserRole') || 'manager';
      let savedName = localStorage.getItem('currentUserName') || 'Пользователь';
      if (savedName.includes('Алексей')) {
        savedName = 'Акмал Рустамов';
        localStorage.setItem('currentUserName', 'Акмал Рустамов');
      }
      setRole(savedRole);
      setName(savedName);
    };

    loadSession();

    window.addEventListener('storage', loadSession);
    window.addEventListener('auth-session-change', loadSession);

    return () => {
      window.removeEventListener('storage', loadSession);
      window.removeEventListener('auth-session-change', loadSession);
    };
  }, []);

  const menuItems = [
    { name: t('sidebar.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('sidebar.projects'), path: '/dashboard/projects', icon: FolderGit2 },
    { name: t('sidebar.calendar'), path: '/dashboard/calendar', icon: CalendarDays },
    { name: t('sidebar.volunteers'), path: '/dashboard/volunteers', icon: Users2 },
    { name: t('sidebar.organizations'), path: '/dashboard/organizations', icon: Building2 },
    { name: t('sidebar.inventory'), path: '/dashboard/inventory', icon: Boxes },
    { name: t('sidebar.leaderboards'), path: '/dashboard/leaderboards', icon: Trophy },
    { name: t('sidebar.partners'), path: '/dashboard/partners', icon: Handshake },
    { name: t('sidebar.agenda'), path: '/dashboard/agenda-assistant', icon: Bot },
    { name: t('sidebar.kb'), path: '/dashboard/kb', icon: BookOpen },
    { name: t('sidebar.chats'), path: '/dashboard/chats', icon: MessageSquare },
    { name: t('sidebar.archive'), path: '/dashboard/archive', icon: Archive },
    { name: t('sidebar.access_keys'), path: '/dashboard/access-keys', icon: Key },
    { name: t('sidebar.hr_documents'), path: '/dashboard/hr-documents', icon: FileText },
    { name: t('sidebar.smm'), path: '/dashboard/smm-assistant', icon: Sparkles },
    { name: t('sidebar.alerts'), path: '/dashboard/alerts', icon: AlertTriangle },
    { name: t('sidebar.broadcast'), path: '/dashboard/broadcast', icon: Megaphone },
    ...(role === 'developer' ? [
      { name: t('sidebar.monitor') || 'Монитор 24/7 (Dev)', path: '/dashboard/monitor', icon: Activity },
    ] : []),
    ...(role === 'admin' ? [
      { name: t('sidebar.staff'), path: '/dashboard/staff', icon: BriefcaseBusiness },
      { name: t('sidebar.roles') || 'Роли и Доступы', path: '/dashboard/roles', icon: Shield },
      { name: t('sidebar.finance'), path: '/dashboard/finance', icon: Calculator },
      { name: t('sidebar.reports'), path: '/dashboard/reports', icon: FileSpreadsheet },
      { name: t('sidebar.kpi') || 'Управление KPI', path: '/dashboard/kpi', icon: Activity },
      { name: t('sidebar.bot_settings'), path: '/dashboard/bot-settings', icon: Settings }
    ] : []),
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    localStorage.clear();
    router.push('/login?role=manager');
  };

  const renderMenu = (onNavigate?: () => void) => (
    <nav className="flex-1 px-3 py-4 lg:px-4 lg:py-6 space-y-1 overflow-y-auto">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
        
        return (
          <Link
            key={item.path}
            href={item.path}
            onClick={onNavigate}
            className={`flex min-h-11 items-center gap-3 px-3.5 lg:px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
              isActive 
                ? 'bg-slate-900 text-white shadow-md ring-1 ring-emerald-300/20' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:shadow-sm'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  const profileFooter = (
    <div className="p-4 border-t border-slate-100 bg-slate-50/60">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
          <UserCircle2 className="w-5 h-5 text-slate-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
          <p className="text-[10px] text-slate-400 truncate uppercase font-semibold tracking-wider">
            {role === 'admin' ? 'Руководитель' : 'Координатор'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <select 
            value={locale} 
            onChange={(e) => setLocale(e.target.value as 'ru'|'en'|'uz')}
            className="text-xs bg-transparent border-none text-slate-500 font-medium focus:ring-0 cursor-pointer hover:text-slate-700"
          >
            <option value="ru">RU</option>
            <option value="en">EN</option>
            <option value="uz">UZ</option>
          </select>
          <NotificationsBell />
          <button
            onClick={handleLogout}
            className="w-8 h-8 shrink-0 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-all ml-1"
            aria-label="Выйти"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white/90 backdrop-blur-2xl border-b border-slate-200 flex items-center justify-between px-3 shadow-sm">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center"
          aria-label="Открыть меню"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0 text-center px-2">
          <h1 className="font-bold text-slate-900 text-sm leading-tight truncate">Volunteer OS</h1>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold truncate">
            {role === 'admin' ? 'Руководитель' : 'Координатор'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 flex items-center justify-center"
          aria-label="Выйти"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <aside className="w-[min(86vw,320px)] h-full bg-white border-r border-slate-200 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img src="/logo.png" alt="Volunteer OS" className="w-8 h-8 shrink-0 object-contain" />
                <div className="min-w-0">
                  <h1 className="font-bold text-slate-900 text-sm tracking-wide truncate">Volunteer OS</h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate">Меню платформы</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-9 h-9 shrink-0 rounded-xl hover:bg-slate-100 text-slate-500 flex items-center justify-center"
                aria-label="Закрыть меню"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderMenu(() => setIsMobileMenuOpen(false))}
            {role === 'admin' && (
              <div className="mx-4 mb-2 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700">
                <ShieldCheck className="w-4 h-4 shrink-0 text-slate-900" />
                <span className="text-[10px] font-bold uppercase tracking-wider truncate">Режим Директора</span>
              </div>
            )}
            {profileFooter}
          </aside>
          <button
            className="flex-1"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Закрыть меню"
          />
        </div>
      )}

      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white/90 backdrop-blur-2xl flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <img src="/logo.png" alt="Volunteer OS" className="w-8 h-8 object-contain" />
        <div>
          <h1 className="font-bold text-slate-900 text-sm tracking-wide">Volunteer OS</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Операционное Управление</p>
        </div>
      </div>

      {/* Navigation Menu */}
      {renderMenu()}

      {/* Admin indicator if applicable */}
      {role === 'admin' && (
        <div className="mx-4 mb-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700">
          <ShieldCheck className="w-4 h-4 shrink-0 text-slate-900" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Режим Директора</span>
        </div>
      )}

      {/* User Footer Profile */}
      {profileFooter}
    </aside>
    </>
  );
}
