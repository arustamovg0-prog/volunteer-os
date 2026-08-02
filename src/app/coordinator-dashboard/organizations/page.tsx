// Re-export the shared organizations page component.
// Because this file lives under /coordinator-dashboard/organizations/,
// Next.js renders it inside the coordinator-dashboard layout (with CoordinatorSidebar),
// while the component logic is shared with the admin dashboard version.
export { default } from '@/app/dashboard/organizations/page';
