import Sidebar from '@/components/Sidebar';
import TelegramSimulator from '@/components/TelegramSimulator';
import AuthGuard from '@/components/AuthGuard';
import { I18nProvider } from '@/lib/i18n';

export const metadata = {
  title: 'Volunteer OS — Dashboard',
  description: 'Volunteer OS management dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={['admin', 'manager']}>
      <I18nProvider>
        <div className="app-shell flex min-h-screen relative bg-[#F9FAFB] text-[#0F172A] overflow-x-hidden">
          {/* Sidebar Navigation */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <main className="app-main flex-1 p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 overflow-y-auto max-h-screen">
              {children}
            </main>
          </div>

          {/* Persistent Telegram Bot Simulator */}
          <TelegramSimulator />
        </div>
      </I18nProvider>
    </AuthGuard>
  );
}
