'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  FolderGit2,
  CheckSquare,
  Users2,
  MessageSquare,
  LogOut,
  UserCheck,
  Menu,
  X,
  Megaphone
} from 'lucide-react';

export default function CoordinatorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState('Координатор');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadSession = () => {
      let savedName = localStorage.getItem('currentUserName') || 'Координатор';
      if (savedName.includes('Алексей')) {
        savedName = 'Акмал Рустамов';
        localStorage.setItem('currentUserName', 'Акмал Рустамов');
      }
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
    { name: 'Мои Проекты', path: '/coordinator-dashboard', icon: FolderGit2 },
    { name: 'Задачи проектов', path: '/coordinator-dashboard/tasks', icon: CheckSquare },
    { name: 'Волонтеры', path: '/coordinator-dashboard/volunteers', icon: Users2 },
    { name: 'Чаты', path: '/coordinator-dashboard/chats', icon: MessageSquare },
    { name: 'Рассылка', path: '/coordinator-dashboard/broadcast', icon: Megaphone },
  ];

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    localStorage.clear();
    router.replace('/');
  }

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
          <UserCheck className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold text-slate-900 truncate">Координатор</p>
          <p className="text-[10px] text-slate-400 truncate font-medium">{name}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/coordinator-dashboard'
              ? pathname === '/coordinator-dashboard'
              : pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Выйти из системы
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white border-r border-slate-100 h-screen sticky top-0 z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <UserCheck className="w-4 h-4" />
          </div>
          <span className="text-xs font-extrabold text-slate-900">Координатор</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white h-full shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
