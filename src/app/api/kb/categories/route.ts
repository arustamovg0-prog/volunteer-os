import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const articles = await db.getKBArticles();
    const uniqueCategories = Array.from(new Set(articles.map(a => a.category)));
    
    // Add default category if articles are empty
    if (uniqueCategories.length === 0) {
      uniqueCategories.push('Инструкции');
    }
    
    const categories = uniqueCategories.map(cat => ({
      id: cat,
      name: cat,
      description: `Материалы и регламенты раздела ${cat}`
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch KB categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    return NextResponse.json({
      id: name,
      name,
      description: description || ''
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create KB category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
