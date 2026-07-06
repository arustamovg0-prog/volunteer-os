import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const dbPath = path.join(process.cwd(), 'volunteer_os_db.json');
  if (!fs.existsSync(dbPath)) {
    console.log('No volunteer_os_db.json file found to seed from.');
    return;
  }

  console.log('Reading volunteer_os_db.json...');
  const fileData = fs.readFileSync(dbPath, 'utf-8');
  const data = JSON.parse(fileData);

  console.log('Clearing existing data from database...');
  // Delete in reverse dependency order
  await prisma.resourceAllocation.deleteMany();
  await prisma.resourceItem.deleteMany();
  await prisma.organizationNews.deleteMany();
  await prisma.organizationMembership.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.volunteerOrganization.deleteMany();
  await prisma.user.deleteMany();
  await prisma.telegramSession.deleteMany();
  await prisma.mockMessage.deleteMany();
  await prisma.botConfig.deleteMany();
  await prisma.knowledgeBase.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.generatedDoc.deleteMany();
  await prisma.accessKey.deleteMany();
  await prisma.archiveItem.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.hrDocument.deleteMany();
  await prisma.didoxInvoice.deleteMany();
  await prisma.employeeReview.deleteMany();
  await prisma.emergencyAlert.deleteMany();

  console.log('Seeding BotConfig...');
  if (data.botConfig) {
    await prisma.botConfig.create({
      data: {
        id: 1,
        botToken: data.botConfig.bot_token || null,
        webhookUrl: data.botConfig.webhook_url || null,
        isSimulatorEnabled: data.botConfig.is_simulator_enabled ?? true,
      },
    });
  }

  console.log('Seeding Users...');
  if (data.users && Array.isArray(data.users)) {
    for (const u of data.users) {
      await prisma.user.create({
        data: {
          id: u.id,
          role: u.role,
          fullName: u.full_name,
          login: u.login || null,
          passwordHash: u.password_hash || null,
          telegramId: u.telegram_id ? BigInt(u.telegram_id) : null,
          phone: u.phone || null,
          rating: Number(u.rating || 0.0),
          createdAt: u.created_at ? new Date(u.created_at) : new Date(),
          xp: u.xp || 0,
          level: u.level || 1,
          badges: u.badges || [],
          interests: u.interests || [],
          skills: u.skills || [],
          latitude: u.latitude || null,
          longitude: u.longitude || null,
          avatarUrl: u.avatar_url || null,
          availabilityStatus: u.availability_status || 'offline',
          availableUntil: u.available_until ? new Date(u.available_until) : null,
          availabilityNote: u.availability_note || null,
        },
      });
    }
  }

  console.log('Seeding Volunteer Organizations...');
  if (data.organizations && Array.isArray(data.organizations)) {
    for (const org of data.organizations) {
      await prisma.volunteerOrganization.create({
        data: {
          id: org.id,
          name: org.name,
          description: org.description || '',
          category: org.category || '',
          avatarUrl: org.avatar_url || null,
          contacts: org.contacts || '',
          createdAt: org.created_at ? new Date(org.created_at) : new Date(),
          goals: org.goals || null,
          leaderName: org.leader_name || null,
          orgStructure: org.org_structure || null,
        },
      });
    }
  }

  console.log('Seeding Projects...');
  if (data.projects && Array.isArray(data.projects)) {
    for (const p of data.projects) {
      await prisma.project.create({
        data: {
          id: p.id,
          title: p.title,
          description: p.description || null,
          status: p.status,
          startDate: p.start_date ? new Date(p.start_date) : null,
          endDate: p.end_date ? new Date(p.end_date) : null,
          orgId: p.org_id || null,
          createdAt: p.created_at ? new Date(p.created_at) : new Date(),
          latitude: p.latitude || null,
          longitude: p.longitude || null,
        },
      });
    }
  }

  console.log('Seeding Tasks...');
  if (data.tasks && Array.isArray(data.tasks)) {
    for (const t of data.tasks) {
      await prisma.task.create({
        data: {
          id: t.id,
          projectId: t.project_id,
          assignedTo: t.assigned_to || null,
          title: t.title,
          deadline: new Date(t.deadline),
          status: t.status,
          isOverdue: t.is_overdue ?? false,
          createdAt: t.created_at ? new Date(t.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Check-Ins...');
  if (data.check_ins && Array.isArray(data.check_ins)) {
    for (const c of data.check_ins) {
      await prisma.checkIn.create({
        data: {
          id: c.id,
          userId: c.user_id,
          projectId: c.project_id || null,
          textReport: c.text_report,
          hours: Number(c.hours),
          createdAt: c.created_at ? new Date(c.created_at) : new Date(),
          kpiScore: c.kpi_score || null,
          feedback: c.feedback || null,
          reviewedBy: c.reviewed_by || null,
          reviewedAt: c.reviewed_at ? new Date(c.reviewed_at) : null,
        },
      });
    }
  }

  console.log('Seeding Meetings...');
  if (data.meetings && Array.isArray(data.meetings)) {
    for (const m of data.meetings) {
      await prisma.meeting.create({
        data: {
          id: m.id,
          title: m.title,
          description: m.description || null,
          scheduledAt: new Date(m.scheduled_at),
          link: m.link || null,
          projectId: m.project_id || null,
          createdBy: m.created_by || null,
          createdAt: m.created_at ? new Date(m.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Knowledge Base...');
  if (data.kb_articles && Array.isArray(data.kb_articles)) {
    for (const kb of data.kb_articles) {
      await prisma.knowledgeBase.create({
        data: {
          id: kb.id,
          category: kb.category,
          title: kb.title,
          content: kb.content,
          fileUrl: kb.file_url || null,
          createdAt: kb.created_at ? new Date(kb.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Chats...');
  if (data.chats && Array.isArray(data.chats)) {
    for (const ch of data.chats) {
      await prisma.chat.create({
        data: {
          id: ch.id,
          type: ch.type,
          title: ch.title,
          projectId: ch.project_id || null,
          volunteerId: ch.volunteer_id || null,
          targetOrgId: ch.target_org_id || null,
          createdAt: ch.created_at ? new Date(ch.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Chat Messages...');
  if (data.chat_messages && Array.isArray(data.chat_messages)) {
    // Some mock senders might not exist in users, make sure we filter or handle gracefully.
    // However, in our DB users and chat messages are consistent.
    for (const msg of data.chat_messages) {
      const chatExists = await prisma.chat.findUnique({ where: { id: msg.chat_id } });
      const senderExists = await prisma.user.findUnique({ where: { id: msg.sender_id } });
      if (chatExists && senderExists) {
        await prisma.chatMessage.create({
          data: {
            id: msg.id,
            chatId: msg.chat_id,
            senderId: msg.sender_id,
            senderName: msg.sender_name,
            senderRole: msg.sender_role,
            text: msg.text,
            createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
          },
        });
      }
    }
  }

  console.log('Seeding Organization News...');
  if (data.org_news && Array.isArray(data.org_news)) {
    for (const n of data.org_news) {
      await prisma.organizationNews.create({
        data: {
          id: n.id,
          orgId: n.org_id,
          title: n.title,
          content: n.content,
          createdAt: n.created_at ? new Date(n.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Organization Memberships...');
  if (data.org_memberships && Array.isArray(data.org_memberships)) {
    for (const mem of data.org_memberships) {
      await prisma.organizationMembership.create({
        data: {
          id: mem.id,
          orgId: mem.org_id,
          userId: mem.user_id,
          status: mem.status,
          coverLetter: mem.cover_letter || null,
          createdAt: mem.created_at ? new Date(mem.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Telegram Sessions...');
  if (data.telegramSessions && Array.isArray(data.telegramSessions)) {
    for (const ts of data.telegramSessions) {
      await prisma.telegramSession.create({
        data: {
          telegramId: BigInt(ts.telegram_id),
          state: ts.state,
          data: ts.data || {},
          updatedAt: ts.updated_at ? new Date(ts.updated_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Mock Messages...');
  if (data.mockMessages && Array.isArray(data.mockMessages)) {
    for (const mm of data.mockMessages) {
      await prisma.mockMessage.create({
        data: {
          id: mm.id,
          telegramId: BigInt(mm.telegram_id),
          sender: mm.sender,
          text: mm.text,
          keyboard: mm.keyboard || null,
          createdAt: mm.created_at ? new Date(mm.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Resource Items...');
  if (data.resources && Array.isArray(data.resources)) {
    for (const res of data.resources) {
      await prisma.resourceItem.create({
        data: {
          id: res.id,
          name: res.name,
          category: res.category,
          totalQty: Number(res.total_qty),
          allocatedQty: Number(res.allocated_qty || 0),
          unit: res.unit,
          location: res.location,
          createdAt: res.created_at ? new Date(res.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Resource Allocations...');
  if (data.allocations && Array.isArray(data.allocations)) {
    for (const alc of data.allocations) {
      await prisma.resourceAllocation.create({
        data: {
          id: alc.id,
          resourceId: alc.resource_id,
          projectId: alc.project_id,
          taskId: alc.task_id || null,
          qty: Number(alc.qty),
          status: alc.status,
          createdAt: alc.created_at ? new Date(alc.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Badges...');
  if (data.badges && Array.isArray(data.badges)) {
    for (const b of data.badges) {
      await prisma.badge.create({
        data: {
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon,
          xpRequired: Number(b.xp_required),
        },
      });
    }
  }

  console.log('Seeding Generated Documents...');
  if (data.documents && Array.isArray(data.documents)) {
    for (const doc of data.documents) {
      await prisma.generatedDoc.create({
        data: {
          id: doc.id,
          templateType: doc.template_type,
          title: doc.title,
          volunteerId: doc.volunteer_id || null,
          projectId: doc.project_id || null,
          createdAt: doc.created_at ? new Date(doc.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Access Keys...');
  if (data.access_keys && Array.isArray(data.access_keys)) {
    for (const ak of data.access_keys) {
      await prisma.accessKey.create({
        data: {
          id: ak.id,
          name: ak.name,
          category: ak.category,
          username: ak.username,
          passwordEncrypted: ak.password_encrypted,
          notes: ak.notes || null,
          createdAt: ak.created_at ? new Date(ak.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Archive Items...');
  if (data.archive_items && Array.isArray(data.archive_items)) {
    for (const ai of data.archive_items) {
      await prisma.archiveItem.create({
        data: {
          id: ai.id,
          chatTitle: ai.chat_title,
          fileName: ai.file_name,
          fileType: ai.file_type,
          fileSize: Number(ai.file_size),
          fileUrl: ai.file_url,
          extractedAt: ai.extracted_at ? new Date(ai.extracted_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Partners...');
  if (data.partners && Array.isArray(data.partners)) {
    for (const p of data.partners) {
      await prisma.partner.create({
        data: {
          id: p.id,
          name: p.name,
          category: p.category,
          anniversaryDate: p.anniversary_date,
          contactPerson: p.contact_person,
          email: p.email || null,
          phone: p.phone || null,
          autoGreetEnabled: p.auto_greet_enabled ?? false,
          createdAt: p.created_at ? new Date(p.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding HR Documents...');
  if (data.hr_documents && Array.isArray(data.hr_documents)) {
    for (const hr of data.hr_documents) {
      await prisma.hrDocument.create({
        data: {
          id: hr.id,
          employeeName: hr.employee_name,
          docType: hr.doc_type,
          details: hr.details,
          createdAt: hr.created_at ? new Date(hr.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Didox Invoices...');
  if (data.didox_invoices && Array.isArray(data.didox_invoices)) {
    for (const inv of data.didox_invoices) {
      await prisma.didoxInvoice.create({
        data: {
          id: inv.id,
          supplierName: inv.supplier_name,
          itemName: inv.item_name,
          price: Number(inv.price),
          qty: Number(inv.qty),
          avgHistoricPrice: Number(inv.avg_historic_price),
          flaggedReason: inv.flagged_reason || null,
          createdAt: inv.created_at ? new Date(inv.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Employee Reviews...');
  if (data.employee_reviews && Array.isArray(data.employee_reviews)) {
    for (const er of data.employee_reviews) {
      await prisma.employeeReview.create({
        data: {
          id: er.id,
          employeeName: er.employee_name,
          kpiScore: Number(er.kpi_score),
          feedback: er.feedback,
          createdBy: er.created_by,
          createdAt: er.created_at ? new Date(er.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Seeding Emergency Alerts...');
  if (data.emergencyAlerts && Array.isArray(data.emergencyAlerts)) {
    for (const ea of data.emergencyAlerts) {
      await prisma.emergencyAlert.create({
        data: {
          id: ea.id,
          title: ea.title,
          description: ea.description,
          latitude: Number(ea.latitude),
          longitude: Number(ea.longitude),
          requiredSkills: ea.required_skills || [],
          radiusKm: Number(ea.radius_km),
          status: ea.status || 'active',
          notifiedVolunteerIds: ea.notified_volunteer_ids || [],
          attendingVolunteerIds: ea.attending_volunteer_ids || [],
          createdAt: ea.created_at ? new Date(ea.created_at) : new Date(),
        },
      });
    }
  }

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
