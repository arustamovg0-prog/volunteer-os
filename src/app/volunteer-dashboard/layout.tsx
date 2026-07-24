import TelegramSimulator from '@/components/TelegramSimulator';
import AuthGuard from '@/components/AuthGuard';
import VolunteerBottomNav from '@/components/VolunteerBottomNav';

export const metadata = {
  title: 'Volunteer OS — Кабинет Волонтера',
  description: 'Панель операционной работы волонтера',
};

export default function VolunteerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={['volunteer']}>
      <div className="app-shell min-h-screen bg-[#F9FAFB] text-slate-900 flex flex-col relative">
        {/* Main Content Container: centered max-w-md on desktop, full width on mobile */}
        <main className="app-main flex-1 max-w-md mx-auto w-full p-4 pb-24">
          {children}
        </main>

        {/* Global Fixed Bottom Nav Bar */}
        <VolunteerBottomNav />

        {/* Floating Simulator */}
        <TelegramSimulator />
      </div>
    </AuthGuard>
  );
}
