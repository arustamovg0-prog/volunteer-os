'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type AuthRole = 'admin' | 'manager' | 'coordinator' | 'volunteer' | 'developer';

interface AuthGuardProps {
  allowedRoles: AuthRole[];
  children: React.ReactNode;
}

export default function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'checking' | 'allowed'>('checking');

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      if (pathname === '/volunteer-dashboard/auth') {
        setStatus('allowed');
        return;
      }

      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`);
          return;
        }

        const data = await res.json();
        const user = data.user;
        if (!user || !allowedRoles.includes(user.role)) {
          // Redirect to the appropriate home for this user's role
          if (user?.role === 'developer') router.replace('/dashboard/monitor');
          else if (user?.role === 'volunteer') router.replace('/volunteer-dashboard');
          else if (user?.role === 'coordinator') router.replace('/coordinator-dashboard');
          else router.replace('/dashboard');
          return;
        }

        let fullName = user.full_name || '';
        if (fullName.includes('Алексей') || user.login?.includes('rustamov')) {
          fullName = 'Акмал Рустамов';
        }

        localStorage.setItem('currentUserId', user.id);
        localStorage.setItem('currentUserName', fullName);
        localStorage.setItem('currentUserRole', user.role);

        if (user.role === 'volunteer') {
          localStorage.setItem('volunteerId', user.id);
          localStorage.setItem('volunteerName', user.full_name);
          window.dispatchEvent(new Event('volunteer-session-change'));
        }

        window.dispatchEvent(new Event('auth-session-change'));
        if (isMounted) setStatus('allowed');
      } catch {
        router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`);
      }
    }

    checkSession();
    return () => {
      isMounted = false;
    };
  }, [allowedRoles, pathname, router]);

  if (status !== 'allowed') {
    return (
      <div className="app-shell min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="premium-loader" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Проверяем доступ</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
