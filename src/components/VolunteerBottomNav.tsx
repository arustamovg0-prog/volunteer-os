'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, LogOut, Folder, MessageSquare, Building2, User } from 'lucide-react';

export default function VolunteerBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm('Вы уверены, что хотите выйти из кабинета волонтера?')) {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      localStorage.removeItem('volunteerId');
      localStorage.removeItem('volunteerName');
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('currentUserName');
      localStorage.removeItem('currentUserRole');
      router.push('/');
    }
  };

  const navItems = [
    { name: 'Задачи', path: '/volunteer-dashboard', icon: ClipboardList },
    { name: 'Проекты', path: '/volunteer-dashboard/projects', icon: Folder },
    { name: 'Чаты', path: '/volunteer-dashboard/chats', icon: MessageSquare },
    { name: 'Профиль', path: '/volunteer-dashboard/profile', icon: User },
    { name: 'Орг.', path: '/volunteer-dashboard/organizations', icon: Building2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
      <div 
        className="max-w-md mx-auto w-full grid grid-cols-6 items-center px-1.5 pt-1.5"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`min-w-0 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 ${
                isActive 
                  ? 'bg-slate-900 text-white font-bold shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span className="w-full px-0.5 text-center text-[9px] font-bold truncate leading-none">{item.name}</span>
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="min-w-0 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95 cursor-pointer"
          title="Выйти из аккаунта"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400" />
          <span className="w-full px-0.5 text-center text-[9px] font-bold truncate leading-none">Выйти</span>
        </button>
      </div>
    </nav>
  );
}
