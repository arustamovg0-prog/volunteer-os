import { prisma } from '../src/lib/db';

async function main() {
  console.log('Fixing RSVP tasks deadlines in database...');

  // Get all tasks starting with RSVP:
  const rsvpTasks = await prisma.task.findMany({
    where: {
      title: { startsWith: 'RSVP:' }
    }
  });

  console.log(`Found ${rsvpTasks.length} RSVP tasks to update.`);

  let updatedCount = 0;
  for (const task of rsvpTasks) {
    const project = await prisma.project.findUnique({
      where: { id: task.projectId }
    });

    let newDeadline: Date;
    if (project && project.endDate) {
      newDeadline = new Date(project.endDate);
    } else if (project && project.startDate) {
      // Default to 7 days after start date or current date + 7 days
      const startDate = new Date(project.startDate);
      newDeadline = new Date(Math.max(startDate.getTime() + 7 * 24 * 3600 * 1000, Date.now() + 7 * 24 * 3600 * 1000));
    } else {
      newDeadline = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    }

    await prisma.task.update({
      where: { id: task.id },
      data: {
        deadline: newDeadline,
        isOverdue: false
      }
    });

    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} RSVP tasks deadlines.`);
}

main().catch(console.error);
