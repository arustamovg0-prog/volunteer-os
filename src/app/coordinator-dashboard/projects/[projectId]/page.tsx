// Re-export the shared project detail component.
// Because this file lives under /coordinator-dashboard/projects/[projectId]/,
// Next.js renders it inside the coordinator-dashboard layout (with CoordinatorSidebar),
// while the component logic is identical to the admin dashboard version.
export { default } from '@/app/dashboard/projects/[projectId]/page';
