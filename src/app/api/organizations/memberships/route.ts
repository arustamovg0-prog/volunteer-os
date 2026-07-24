import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const userId = auth.session.role === 'volunteer' ? auth.session.userId : (searchParams.get('userId') || searchParams.get('user_id'));
    const orgId = searchParams.get('orgId') || searchParams.get('org_id');
    const status = searchParams.get('status');

    let memberships = await db.getOrganizationMemberships();

    if (userId) {
      memberships = memberships.filter(m => m.user_id === userId);
    }
    if (orgId) {
      memberships = memberships.filter(m => m.org_id === orgId);
    }
    if (status) {
      memberships = memberships.filter(m => m.status === status);
    }

    // Join user and organization details
    const users = await db.getUsers();
    const orgs = await db.getOrganizations();

    const joinedMemberships = memberships.map(m => {
      const user = users.find(u => u.id === m.user_id);
      const org = orgs.find(o => o.id === m.org_id);
      return {
        ...m,
        user: user ? {
          id: user.id,
          full_name: user.full_name,
          phone: user.phone,
          telegram_id: user.telegram_id,
          rating: user.rating
        } : null,
        org: org ? {
          id: org.id,
          name: org.name
        } : null
      };
    });

    // Sort by created_at descending
    joinedMemberships.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(joinedMemberships);
  } catch (error) {
    console.error('Failed to fetch memberships:', error);
    return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { org_id, cover_letter, status: requestedStatus } = body;
    const user_id = auth.session.role === 'volunteer' ? auth.session.userId : body.user_id;

    if (!org_id || !user_id) {
      return NextResponse.json({ error: 'org_id and user_id are required' }, { status: 400 });
    }

    // Check if membership already exists
    const existing = (await db.getOrganizationMemberships()).find(
      m => m.org_id === org_id && m.user_id === user_id
    );

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json({ error: 'Волонтер уже прикреплен к этой организации' }, { status: 400 });
      }
      // Update status if admin/manager is approving
      if (['admin', 'manager'].includes(auth.session.role)) {
        const updated = await db.updateOrganizationMembership(existing.id, 'approved');
        return NextResponse.json(updated, { status: 200 });
      }
      return NextResponse.json({ error: 'Заявка волонтера уже подана и ожидает решения' }, { status: 400 });
    }

    const initialStatus = (['admin', 'manager'].includes(auth.session.role) && requestedStatus === 'approved') 
      ? 'approved' 
      : 'pending';

    const newMemb = await db.createOrganizationMembership({
      org_id,
      user_id,
      status: initialStatus,
      cover_letter: cover_letter || (initialStatus === 'approved' ? 'Назначен Руководителем / Координатором' : '')
    });

    // If approved, create chat for organization-to-volunteer
    if (newMemb.status === 'approved') {
      const orgs = await db.getOrganizations();
      const org = orgs.find(o => o.id === newMemb.org_id);
      const chats = await db.getChats();
      
      const chatExists = chats.some(
        c => c.type === 'organization' && c.volunteer_id === newMemb.user_id && c.target_org_id === newMemb.org_id
      );

      if (!chatExists && org) {
        await db.createChat({
          type: 'organization',
          title: org.name,
          volunteer_id: newMemb.user_id,
          target_org_id: newMemb.org_id
        });
      }
    }

    return NextResponse.json(newMemb, { status: 201 });
  } catch (error) {
    console.error('Failed to create membership:', error);
    return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid id and status ("approved" or "rejected") are required' }, { status: 400 });
    }

    const updatedMemb = await db.updateOrganizationMembership(id, status);

    // If approved, create a chat for organization-to-volunteer if it doesn't exist
    if (status === 'approved') {
      const orgs = await db.getOrganizations();
      const org = orgs.find(o => o.id === updatedMemb.org_id);
      const chats = await db.getChats();
      
      const chatExists = chats.some(
        c => c.type === 'organization' && c.volunteer_id === updatedMemb.user_id && c.target_org_id === updatedMemb.org_id
      );

      if (!chatExists && org) {
        await db.createChat({
          type: 'organization',
          title: org.name,
          volunteer_id: updatedMemb.user_id,
          target_org_id: updatedMemb.org_id
        });
      }
    }

    return NextResponse.json(updatedMemb);
  } catch (error) {
    console.error('Failed to update membership:', error);
    return NextResponse.json({ error: 'Failed to update membership' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Membership id is required' }, { status: 400 });
    }

    await db.deleteOrganizationMembership(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete membership:', error);
    return NextResponse.json({ error: 'Failed to delete membership' }, { status: 500 });
  }
}
