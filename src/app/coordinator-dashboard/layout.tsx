import AuthGuard from '@/components/AuthGuard';
import CoordinatorSidebar from '@/components/CoordinatorSidebar';

export const metadata = {
  title: 'Volunteer OS — Панель координатора',
  description: 'Панель координатора Volunteer OS',
};

export default function CoordinatorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={['coordinator', 'manager', 'admin']}>
      <div className="app-shell flex min-h-screen relative bg-[#F9FAFB] text-[#0F172A] overflow-x-hidden">
        <CoordinatorSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="app-main flex-1 p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 overflow-y-auto max-h-screen">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
