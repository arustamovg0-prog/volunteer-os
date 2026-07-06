const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function serializeDate(d) {
  return d instanceof Date ? d.toISOString() : (d || null);
}

async function main() {
  console.log("=== НАЧАЛО РЕЗЕРВНОГО КОПИРОВАНИЯ БАЗЫ ДАННЫХ ===");
  
  const backup = {};

  // 1. BotConfig
  console.log("Downloading BotConfig...");
  const bc = await prisma.botConfig.findUnique({ where: { id: 1 } });
  if (bc) {
    backup.botConfig = {
      bot_token: bc.botToken,
      webhook_url: bc.webhookUrl,
      is_simulator_enabled: bc.isSimulatorEnabled
    };
  }

  // 2. Users
  console.log("Downloading Users...");
  const users = await prisma.user.findMany();
  backup.users = users.map(u => ({
    id: u.id,
    role: u.role,
    full_name: u.fullName,
    telegram_id: u.telegramId ? Number(u.telegramId) : null,
    phone: u.phone,
    rating: u.rating,
    created_at: serializeDate(u.createdAt),
    xp: u.xp,
    level: u.level,
    badges: u.badges,
    interests: u.interests,
    skills: u.skills,
    latitude: u.latitude,
    longitude: u.longitude,
    avatar_url: u.avatarUrl
  }));

  // 3. Organizations
  console.log("Downloading Organizations...");
  const orgs = await prisma.volunteerOrganization.findMany();
  backup.organizations = orgs.map(o => ({
    id: o.id,
    name: o.name,
    description: o.description,
    category: o.category,
    avatar_url: o.avatarUrl,
    contacts: o.contacts,
    created_at: serializeDate(o.createdAt),
    goals: o.goals,
    leader_name: o.leaderName,
    org_structure: o.orgStructure
  }));

  // 4. Projects
  console.log("Downloading Projects...");
  const projects = await prisma.project.findMany();
  backup.projects = projects.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    start_date: serializeDate(p.startDate),
    end_date: serializeDate(p.endDate),
    org_id: p.orgId,
    created_at: serializeDate(p.createdAt),
    latitude: p.latitude,
    longitude: p.longitude
  }));

  // 5. Tasks
  console.log("Downloading Tasks...");
  const tasks = await prisma.task.findMany();
  backup.tasks = tasks.map(t => ({
    id: t.id,
    project_id: t.projectId,
    assigned_to: t.assignedTo,
    title: t.title,
    deadline: serializeDate(t.deadline),
    status: t.status,
    is_overdue: t.isOverdue,
    created_at: serializeDate(t.createdAt)
  }));

  // 6. Check-Ins
  console.log("Downloading Check-ins...");
  const checkins = await prisma.checkIn.findMany();
  backup.check_ins = checkins.map(c => ({
    id: c.id,
    user_id: c.userId,
    project_id: c.projectId,
    text_report: c.textReport,
    hours: c.hours,
    created_at: serializeDate(c.createdAt),
    kpi_score: c.kpiScore,
    feedback: c.feedback,
    reviewed_by: c.reviewedBy,
    reviewed_at: serializeDate(c.reviewedAt)
  }));

  // 7. Meetings
  console.log("Downloading Meetings...");
  const meetings = await prisma.meeting.findMany();
  backup.meetings = meetings.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    scheduled_at: serializeDate(m.scheduledAt),
    link: m.link,
    project_id: m.projectId,
    created_by: m.createdBy,
    created_at: serializeDate(m.createdAt)
  }));

  // 8. Knowledge Base
  console.log("Downloading Knowledge Base...");
  const kb = await prisma.knowledgeBase.findMany();
  backup.kb_articles = kb.map(k => ({
    id: k.id,
    category: k.category,
    title: k.title,
    content: k.content,
    file_url: k.fileUrl,
    created_at: serializeDate(k.createdAt)
  }));

  // 9. Chats
  console.log("Downloading Chats...");
  const chats = await prisma.chat.findMany();
  backup.chats = chats.map(c => ({
    id: c.id,
    type: c.type,
    title: c.title,
    project_id: c.projectId,
    volunteer_id: c.volunteerId,
    target_org_id: c.targetOrgId,
    created_at: serializeDate(c.createdAt)
  }));

  // 10. Chat Messages
  console.log("Downloading Chat Messages...");
  const messages = await prisma.chatMessage.findMany();
  backup.chat_messages = messages.map(m => ({
    id: m.id,
    chat_id: m.chatId,
    sender_id: m.senderId,
    sender_name: m.senderName,
    sender_role: m.senderRole,
    text: m.text,
    created_at: serializeDate(m.createdAt)
  }));

  // 11. Org News
  console.log("Downloading Organization News...");
  const news = await prisma.organizationNews.findMany();
  backup.org_news = news.map(n => ({
    id: n.id,
    org_id: n.orgId,
    title: n.title,
    content: n.content,
    created_at: serializeDate(n.createdAt)
  }));

  // 12. Org Memberships
  console.log("Downloading Memberships...");
  const memberships = await prisma.organizationMembership.findMany();
  backup.org_memberships = memberships.map(m => ({
    id: m.id,
    org_id: m.orgId,
    user_id: m.userId,
    status: m.status,
    cover_letter: m.coverLetter,
    created_at: serializeDate(m.createdAt)
  }));

  // 13. Telegram Sessions
  console.log("Downloading Telegram Sessions...");
  const sessions = await prisma.telegramSession.findMany();
  backup.telegramSessions = sessions.map(s => ({
    telegram_id: Number(s.telegramId),
    state: s.state,
    data: s.data,
    updated_at: serializeDate(s.updatedAt)
  }));

  // 14. Mock Messages
  console.log("Downloading Mock Messages...");
  const mockMsgs = await prisma.mockMessage.findMany();
  backup.mockMessages = mockMsgs.map(m => ({
    id: m.id,
    telegram_id: Number(m.telegramId),
    sender: m.sender,
    text: m.text,
    keyboard: m.keyboard,
    created_at: serializeDate(m.createdAt)
  }));

  // 15. Resource Items
  console.log("Downloading Resources...");
  const resources = await prisma.resourceItem.findMany();
  backup.resources = resources.map(r => ({
    id: r.id,
    name: r.name,
    category: r.category,
    total_qty: r.totalQty,
    allocated_qty: r.allocatedQty,
    unit: r.unit,
    location: r.location,
    created_at: serializeDate(r.createdAt)
  }));

  // 16. Resource Allocations
  console.log("Downloading Resource Allocations...");
  const allocations = await prisma.resourceAllocation.findMany();
  backup.allocations = allocations.map(a => ({
    id: a.id,
    resource_id: a.resourceId,
    project_id: a.projectId,
    task_id: a.taskId,
    qty: a.qty,
    status: a.status,
    created_at: serializeDate(a.createdAt)
  }));

  // 17. Badges
  console.log("Downloading Badges...");
  const badges = await prisma.badge.findMany();
  backup.badges = badges.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    xp_required: b.xpRequired
  }));

  // 18. Generated Docs
  console.log("Downloading Generated Documents...");
  const docs = await prisma.generatedDoc.findMany();
  backup.documents = docs.map(d => ({
    id: d.id,
    template_type: d.templateType,
    title: d.title,
    volunteer_id: d.volunteerId,
    project_id: d.projectId,
    created_at: serializeDate(d.createdAt)
  }));

  // 19. Access Keys
  console.log("Downloading Access Keys...");
  const keys = await prisma.accessKey.findMany();
  backup.access_keys = keys.map(k => ({
    id: k.id,
    name: k.name,
    category: k.category,
    username: k.username,
    password_encrypted: k.passwordEncrypted,
    notes: k.notes,
    created_at: serializeDate(k.createdAt)
  }));

  // 20. Archive Items
  console.log("Downloading Archive Items...");
  const archive = await prisma.archiveItem.findMany();
  backup.archive_items = archive.map(a => ({
    id: a.id,
    chat_title: a.chatTitle,
    file_name: a.fileName,
    file_type: a.fileType,
    file_size: a.fileSize,
    file_url: a.fileUrl,
    extracted_at: serializeDate(a.extractedAt)
  }));

  // 21. Partners
  console.log("Downloading Partners...");
  const partners = await prisma.partner.findMany();
  backup.partners = partners.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    anniversary_date: p.anniversaryDate,
    contact_person: p.contactPerson,
    email: p.email,
    phone: p.phone,
    auto_greet_enabled: p.autoGreetEnabled,
    created_at: serializeDate(p.createdAt)
  }));

  // 22. HR Documents
  console.log("Downloading HR Documents...");
  const hr = await prisma.hrDocument.findMany();
  backup.hr_documents = hr.map(h => ({
    id: h.id,
    employee_name: h.employeeName,
    doc_type: h.docType,
    details: h.details,
    created_at: serializeDate(h.createdAt)
  }));

  // 23. Didox Invoices
  console.log("Downloading Didox Invoices...");
  const invoices = await prisma.didoxInvoice.findMany();
  backup.didox_invoices = invoices.map(i => ({
    id: i.id,
    supplier_name: i.supplierName,
    item_name: i.itemName,
    price: i.price,
    qty: i.qty,
    avg_historic_price: i.avgHistoricPrice,
    flagged_reason: i.flaggedReason,
    created_at: serializeDate(i.createdAt)
  }));

  // 24. Employee Reviews
  console.log("Downloading Employee Reviews...");
  const reviews = await prisma.employeeReview.findMany();
  backup.employee_reviews = reviews.map(r => ({
    id: r.id,
    employee_name: r.employeeName,
    kpi_score: r.kpiScore,
    feedback: r.feedback,
    created_by: r.createdBy,
    created_at: serializeDate(r.createdAt)
  }));

  // 25. Emergency Alerts
  console.log("Downloading Emergency Alerts...");
  const alerts = await prisma.emergencyAlert.findMany();
  backup.emergencyAlerts = alerts.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    latitude: a.latitude,
    longitude: a.longitude,
    required_skills: a.requiredSkills,
    radius_km: a.radiusKm,
    status: a.status,
    notified_volunteer_ids: a.notifiedVolunteerIds,
    attending_volunteer_ids: a.attendingVolunteerIds,
    created_at: serializeDate(a.createdAt)
  }));

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `volunteer_os_db_backup_${timestamp}.json`;
  const backupPath = path.join(process.cwd(), 'backups', backupFileName);
  
  // Create backups folder if it doesn't exist
  if (!fs.existsSync(path.join(process.cwd(), 'backups'))) {
    fs.mkdirSync(path.join(process.cwd(), 'backups'));
  }
  
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`\n✅ Бэкап базы данных успешно сохранен в: backups/${backupFileName}`);
}

main()
  .catch((e) => {
    console.error("Backup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
