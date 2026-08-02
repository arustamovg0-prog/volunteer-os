import AwardsDashboard from '@/components/AwardsDashboard';

export const metadata = {
  title: 'Награждение - Volunteer OS'
};

export default function AwardsPage() {
  return (
    <div className="p-6">
      <AwardsDashboard role="manager" />
    </div>
  );
}
