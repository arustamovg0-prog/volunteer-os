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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/88 backdrop-blur-2xl border-t border-slate-200 shadow-[0_-18px_44px_rgba(15,23,42,0.12)] pb-[env(safe-area-inset-bottom)]">
      <div className="h-16 grid grid-cols-6 items-center px-1.5 max-w-md mx-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path;
        
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`min-w-0 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              isActive ? 'bg-slate-900 text-white scale-105 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="w-full px-0.5 text-center text-[9px] font-semibold truncate">{item.name}</span>
          </Link>
        );
      })}

      <button
        onClick={handleLogout}
        className="min-w-0 h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
      >
        <LogOut className="w-5 h-5 shrink-0" />
        <span className="w-full px-0.5 text-center text-[9px] font-semibold truncate">Выйти</span>
      </button>
      </div>
    </div>
  );
}
