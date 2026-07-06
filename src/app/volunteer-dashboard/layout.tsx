import TelegramSimulator from '@/components/TelegramSimulator';
import AuthGuard from '@/components/AuthGuard';

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
      <div className="app-shell min-h-screen bg-[#F9FAFB] text-slate-900 flex flex-col relative pb-20">
        {/* Main Content */}
        <div className="app-main flex-1 max-w-md mx-auto w-full p-4">
          {children}
        </div>

        {/* Floating Simulator */}
        <TelegramSimulator />
      </div>
    </AuthGuard>
  );
}
