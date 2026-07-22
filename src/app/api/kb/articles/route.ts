import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || searchParams.get('categoryId'); // Support category query param

    let articles = await db.getKBArticles();

    if (category) {
      // If categories can be IDs or names, support loose matching
      articles = articles.filter(a => a.category === category || a.id === category);
    }

    // Sort by creation date descending
    articles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Failed to fetch KB articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { category, title, content, file_url, media_type, source_link } = body;

    // Use category_id as fallback if dashboard frontend sends category_id
    const finalCategory = category || body.category_id;

    if (!finalCategory || !title || !content) {
      return NextResponse.json({ error: 'Category, title, and content are required' }, { status: 400 });
    }

    const newArticle = await db.createKBArticle({
      category: finalCategory,
      title,
      content,
      file_url: file_url || null,
      media_type: media_type || null,
      source_link: source_link || null
    });

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error('Failed to create KB article:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
