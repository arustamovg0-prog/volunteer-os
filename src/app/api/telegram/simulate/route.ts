import { NextRequest, NextResponse } from 'next/server';
import { handleBotUpdate } from '@/lib/bot-logic';
import { db } from '@/lib/db';
import { generateLeaderKnowledgeAnswer, isLeaderMention } from '@/lib/leader-ai';
import { requireSessionRequest } from '@/lib/security';

// POST: Simulate user sending message or sharing contact
export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { telegramId, text, phone, username, groupTitle } = await req.json();

    if (!telegramId) {
      return NextResponse.json({ error: 'telegramId is required' }, { status: 400 });
    }

    if (groupTitle || Number(telegramId) < 0) {
      const groupText = `[Группа: ${groupTitle || 'Telegram группа'}] ${username ? `@${username}` : 'участник'}: ${text || ''}`;
      await db.createMockMessage(telegramId, 'user', groupText);

      let response = null;
      if (text && isLeaderMention(text)) {
        response = await generateLeaderKnowledgeAnswer(groupText);
        await db.createMockMessage(telegramId, 'bot', response.text);
      }

      const history = await db.getMockMessages(telegramId);
      return NextResponse.json({
        ok: true,
        response,
        history
      });
    }

    // Save message to simulator history as user input
    try {
      if (text || phone) {
        await db.createMockMessage(
          telegramId,
          'user',
          phone ? `📱 [Поделился контактом: ${phone}]` : text
        );
      }
    } catch (e) {
      console.error(e);
    }

    // Process update through the state-machine
    const response = await handleBotUpdate(telegramId, text || '', username || 'volunteer_sim', phone);

    // Save bot response to simulator history
    try {
      await db.createMockMessage(
        telegramId,
        'bot',
        response.text,
        response.keyboard
      );
    } catch (e) {
      console.error(e);
    }

    // Return updated history and current keyboard options
    const history = await db.getMockMessages(telegramId);
    return NextResponse.json({
      ok: true,
      response,
      history
    });
  } catch (error) {
    console.error('Simulator error:', error);
    return NextResponse.json({ error: 'Failed to simulate message' }, { status: 500 });
  }
}

// GET: Fetch message history for a user
export async function GET(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
      return NextResponse.json({ error: 'telegramId is required' }, { status: 400 });
    }

    const id = parseInt(telegramId);
    const history = await db.getMockMessages(id);
    const session = await db.getTelegramSession(id);

    return NextResponse.json({
      history,
      session
    });
  } catch (error) {
    console.error('Failed to get simulator history:', error);
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}

// DELETE: Reset session and clear chat history
export async function DELETE(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
      return NextResponse.json({ error: 'telegramId is required' }, { status: 400 });
    }

    const id = parseInt(telegramId);
    await db.clearTelegramSession(id);
    await db.clearMockMessages(id);

    return NextResponse.json({ ok: true, message: 'Chat history and session reset successful' });
  } catch (error) {
    console.error('Failed to reset simulator:', error);
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
  }
}
