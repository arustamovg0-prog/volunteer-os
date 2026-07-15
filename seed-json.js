const fs = require('fs');

const data = {
  users: [
    {
      id: "u_admin_1",
      role: "admin",
      fullName: "John Admin",
      login: "admin",
      phone: "+998901234567",
      rating: 5.0,
      xp: 1500,
      level: 5,
      availabilityStatus: "online",
      created_at: new Date().toISOString()
    },
    {
      id: "u_manager_1",
      role: "manager",
      fullName: "Sarah Coordinator",
      login: "manager",
      phone: "+998901234568",
      rating: 4.8,
      xp: 1200,
      level: 4,
      availabilityStatus: "online",
      created_at: new Date().toISOString()
    },
    {
      id: "u_vol_1",
      role: "volunteer",
      fullName: "Alex Volunteer",
      login: "alex",
      phone: "+998901111111",
      rating: 4.5,
      xp: 500,
      level: 2,
      availabilityStatus: "online",
      created_at: new Date().toISOString()
    },
    {
      id: "u_vol_2",
      role: "volunteer",
      fullName: "Maria Helper",
      login: "maria",
      phone: "+998902222222",
      rating: 4.9,
      xp: 850,
      level: 3,
      availabilityStatus: "offline",
      created_at: new Date().toISOString()
    }
  ],
  volunteer_organizations: [
    {
      id: "org_1",
      name: "Eco Warriors",
      description: "Environmental protection organization",
      category: "Экология",
      contacts: "eco@example.com",
      created_at: new Date().toISOString()
    }
  ],
  projects: [
    {
      id: "proj_1",
      title: "Park Cleanup 2026",
      description: "Annual city park cleanup event",
      status: "active",
      org_id: "org_1",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: "task_1",
      project_id: "proj_1",
      assigned_to: "u_vol_1",
      title: "Gather equipment",
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      is_overdue: false,
      created_at: new Date().toISOString()
    },
    {
      id: "task_2",
      project_id: "proj_1",
      assigned_to: "u_vol_2",
      title: "Coordinate volunteers",
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "completed",
      is_overdue: true,
      created_at: new Date().toISOString()
    }
  ],
  check_ins: [
    {
      id: "checkin_1",
      user_id: "u_vol_1",
      project_id: "proj_1",
      text_report: "Spent 2 hours gathering garbage bags and gloves.",
      hours: 2.0,
      kpi_score: 10,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "checkin_2",
      user_id: "u_vol_2",
      project_id: "proj_1",
      text_report: "Packed 50 food boxes. Everything went smoothly.",
      hours: 4.5,
      kpi_score: 15,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

fs.writeFileSync('volunteer_os_db.json', JSON.stringify(data, null, 2), 'utf8');
console.log('volunteer_os_db.json created successfully.');
