import AwardsDashboard from '@/components/AwardsDashboard';

export const metadata = {
  title: 'Награждение - Volunteer OS'
};

export default function CoordinatorAwardsPage() {
  return (
    <div className="p-6">
      <AwardsDashboard role="coordinator" />
    </div>
  );
}
