import { NextRequest, NextResponse } from 'next/server';
import { loadLocalKnowledgeBase, recordAndLearnQueryResponse, runLearningCycle } from '@/lib/learning-module';
import { requireSessionRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req);
    if ('response' in auth) return auth.response;

    const items = loadLocalKnowledgeBase();
    const stats = await runLearningCycle();

    return NextResponse.json({
      items,
      stats,
    });
  } catch (error) {
    console.error('Failed to fetch learning knowledge base:', error);
    return NextResponse.json({ error: 'Failed to fetch learning data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const { query, response, category, source } = body;

    if (query && response) {
      const learned = await recordAndLearnQueryResponse({
        query,
        response,
        category: category || 'Пользовательский опыт',
        source: source || 'api',
      });
      const stats = await runLearningCycle();
      return NextResponse.json({ learned, stats }, { status: 201 });
    }

    // Trigger full training cycle if no single item provided
    const stats = await runLearningCycle();
    return NextResponse.json({ message: 'Цикл обучения выполнен успешно', stats });
  } catch (error) {
    console.error('Failed to run learning cycle:', error);
    return NextResponse.json({ error: 'Failed to execute learning module' }, { status: 500 });
  }
}
