import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePrivilegedRequest } from '@/lib/security';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(dateValue?: string | null) {
  if (!dateValue) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - new Date(dateValue).getTime()) / DAY_MS);
}

function daysUntil(dateValue: string) {
  return Math.ceil((new Date(dateValue).getTime() - Date.now()) / DAY_MS);
}

function clampRisk(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function GET(req: NextRequest) {
  const authError = requirePrivilegedRequest(req, ['admin', 'manager']);
  if (authError) return authError;

  try {
    const [tasks, projects, users, checkins, chats, alerts] = await Promise.all([
      db.getTasks(),
      db.getProjects(),
      db.getUsers(),
      db.getCheckIns(),
      db.getChats(),
      db.getEmergencyAlerts(),
    ]);

    const now = new Date();
    const volunteers = users.filter((user) => user.role === 'volunteer');
    const availableVolunteers = volunteers.filter((user) => {
      if (user.availability_status !== 'available') return false;
      if (!user.available_until) return true;
      return new Date(user.available_until) > now;
    });

    const activeTasks = tasks.filter((task) => task.status !== 'completed');
    const unassignedTasks = activeTasks.filter((task) => !task.assigned_to);
    const overdueTasks = activeTasks.filter((task) => task.is_overdue || new Date(task.deadline) < now);
    const urgentTasks = activeTasks.filter((task) => {
      const left = daysUntil(task.deadline);
      return left >= 0 && left <= 2;
    });

    const volunteerLastCheckin = new Map<string, string>();
    for (const checkin of checkins) {
      const current = volunteerLastCheckin.get(checkin.user_id);
      if (!current || new Date(checkin.created_at) > new Date(current)) {
        volunteerLastCheckin.set(checkin.user_id, checkin.created_at);
      }
    }

    const dormantVolunteers = volunteers
      .filter((volunteer) => daysSince(volunteerLastCheckin.get(volunteer.id)) >= 7)
      .slice(0, 8);

    const riskProjects = projects.map((project) => {
      const projectTasks = tasks.filter((task) => task.project_id === project.id);
      const openProjectTasks = projectTasks.filter((task) => task.status !== 'completed');
      const overdueProjectTasks = openProjectTasks.filter((task) => task.is_overdue || new Date(task.deadline) < now);
      const urgentProjectTasks = openProjectTasks.filter((task) => {
        const left = daysUntil(task.deadline);
        return left >= 0 && left <= 2;
      });
      const projectCheckins = checkins.filter((checkin) => checkin.project_id === project.id);
      const lastCheckin = projectCheckins
        .map((checkin) => checkin.created_at)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
      const assignedVolunteerIds = new Set(projectTasks.map((task) => task.assigned_to).filter(Boolean));

      const reasons: string[] = [];
      let score = 0;

      if (overdueProjectTasks.length > 0) {
        score += overdueProjectTasks.length * 18;
        reasons.push(`${overdueProjectTasks.length} просроченных задач`);
      }
      if (urgentProjectTasks.length > 0) {
        score += urgentProjectTasks.length * 8;
        reasons.push(`${urgentProjectTasks.length} задач со сроком до 2 дней`);
      }
      if (openProjectTasks.length > 0 && assignedVolunteerIds.size === 0) {
        score += 25;
        reasons.push('нет активных исполнителей');
      }
      if (project.status === 'active' && daysSince(lastCheckin) >= 5) {
        score += 22;
        reasons.push('нет чек-инов 5+ дней');
      }
      if (project.status === 'planning' && projectTasks.length === 0) {
        score += 12;
        reasons.push('план без задач');
      }

      const completedCount = projectTasks.filter((task) => task.status === 'completed').length;
      const progress = projectTasks.length ? Math.round((completedCount / projectTasks.length) * 100) : 0;
      const riskScore = clampRisk(score);
      const level = riskScore >= 70 ? 'critical' : riskScore >= 35 ? 'watch' : 'healthy';

      return {
        id: project.id,
        title: project.title,
        status: project.status,
        riskScore,
        level,
        progress,
        openTasks: openProjectTasks.length,
        overdueTasks: overdueProjectTasks.length,
        activeVolunteers: assignedVolunteerIds.size,
        lastCheckin: lastCheckin || null,
        reasons: reasons.length ? reasons : ['стабильная динамика'],
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    const inbox = [];
    for (const chat of chats) {
      const messages = await db.getChatMessages(chat.id);
      const last = messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      if (!last || last.sender_role !== 'volunteer') continue;

      const ageHours = Math.round((Date.now() - new Date(last.created_at).getTime()) / (60 * 60 * 1000));
      const lowerText = last.text.toLowerCase();
      const priority = lowerText.includes('срочно') || lowerText.includes('помогите') || lowerText.includes('проблем')
        ? 'high'
        : ageHours >= 12 ? 'medium' : 'normal';

      inbox.push({
        chatId: chat.id,
        chatTitle: chat.title,
        senderName: last.sender_name,
        text: last.text,
        createdAt: last.created_at,
        ageHours,
        priority,
      });
    }

    inbox.sort((a, b) => {
      const weight = { high: 3, medium: 2, normal: 1 };
      return weight[b.priority as keyof typeof weight] - weight[a.priority as keyof typeof weight]
        || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const activeAlerts = alerts.filter((alert) => alert.status === 'active');
    const topRisk = riskProjects[0];
    const digest = [
      `Активных задач: ${activeTasks.length}; просрочено: ${overdueTasks.length}; без исполнителя: ${unassignedTasks.length}.`,
      `Проектов в зоне риска: ${riskProjects.filter((project) => project.level !== 'healthy').length}. ${topRisk ? `Самый рискованный: ${topRisk.title} (${topRisk.riskScore}/100).` : ''}`,
      `Готовы помочь сейчас: ${availableVolunteers.length}; неактивны 7+ дней: ${dormantVolunteers.length}.`,
      `Неразобранных обращений: ${inbox.length}; активных тревог: ${activeAlerts.length}.`,
    ];

    return NextResponse.json({
      generatedAt: now.toISOString(),
      radar: {
        activeTasks: activeTasks.length,
        overdueTasks: overdueTasks.length,
        urgentTasks: urgentTasks.length,
        unassignedTasks: unassignedTasks.length,
        dormantVolunteers: dormantVolunteers.length,
        availableVolunteers: availableVolunteers.length,
        activeAlerts: activeAlerts.length,
        inboxItems: inbox.length,
      },
      actionItems: [
        ...overdueTasks.slice(0, 5).map((task) => ({
          type: 'overdue_task',
          severity: 'critical',
          title: task.title,
          subtitle: `Срок: ${new Date(task.deadline).toLocaleDateString('ru-RU')}`,
          href: `/dashboard/projects/${task.project_id}`,
        })),
        ...unassignedTasks.slice(0, 4).map((task) => ({
          type: 'unassigned_task',
          severity: 'watch',
          title: task.title,
          subtitle: 'Нет исполнителя',
          href: `/dashboard/projects/${task.project_id}`,
        })),
        ...dormantVolunteers.slice(0, 4).map((volunteer) => ({
          type: 'dormant_volunteer',
          severity: 'watch',
          title: volunteer.full_name,
          subtitle: 'Нет чек-инов 7+ дней',
          href: '/dashboard/volunteers',
        })),
      ],
      riskProjects,
      inbox: inbox.slice(0, 10),
      availableVolunteers: availableVolunteers.slice(0, 10).map((volunteer) => ({
        id: volunteer.id,
        full_name: volunteer.full_name,
        skills: volunteer.skills || [],
        available_until: volunteer.available_until,
        availability_note: volunteer.availability_note,
      })),
      digest,
    });
  } catch (error) {
    console.error('Failed to build operations overview:', error);
    return NextResponse.json({ error: 'Failed to build operations overview' }, { status: 500 });
  }
}
