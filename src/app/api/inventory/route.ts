import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const resources = await db.getResources();
    const allocations = await db.getAllocations();
    // Load projects to display in selection dropdowns
    // Since we need title/org metadata
    const projects = await db.getProjects();
    const tasks = await db.getTasks();

    return NextResponse.json({
      resources,
      allocations,
      projects,
      tasks
    });
  } catch (error) {
    console.error('Failed to load inventory data:', error);
    return NextResponse.json({ error: 'Failed to load inventory data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { action, ...payload } = body;

    if (action === 'add') {
      const { name, category, total_qty, unit, location } = payload;
      if (!name || !category || total_qty === undefined || !unit || !location) {
        return NextResponse.json({ error: 'Missing required fields for adding resource' }, { status: 400 });
      }
      const newRes = await db.addResource({
        name,
        category,
        total_qty: Number(total_qty),
        unit,
        location
      });
      return NextResponse.json({ success: true, resource: newRes });
    }

    if (action === 'allocate') {
      const { resource_id, project_id, task_id, qty } = payload;
      if (!resource_id || !project_id || qty === undefined) {
        return NextResponse.json({ error: 'Missing required fields for allocation' }, { status: 400 });
      }
      const newAlloc = await db.allocateResource(
        resource_id,
        project_id,
        task_id || null,
        Number(qty)
      );
      return NextResponse.json({ success: true, allocation: newAlloc });
    }

    if (action === 'return') {
      const { allocation_id } = payload;
      if (!allocation_id) {
        return NextResponse.json({ error: 'Missing allocation ID' }, { status: 400 });
      }
      const updatedAlloc = await db.returnResource(allocation_id);
      return NextResponse.json({ success: true, allocation: updatedAlloc });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Inventory transaction failed:', error);
    return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 500 });
  }
}
