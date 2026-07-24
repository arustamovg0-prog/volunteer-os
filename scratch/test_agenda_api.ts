import { prisma, db } from '../src/lib/db';
import { compact } from 'fs';

async function main() {
  console.log('=== TESTING AGENDA ITEMS PARSING DIRECTLY ===');

  const period = '7d';
  const now = Date.now();
  const days = 7;
  const minTime = now - days * 24 * 60 * 60 * 1000;

  const chats = await db.getChats();
  console.log(`db.getChats() returned ${chats.length} chats`);

  let chatItemsCount = 0;
  let recentChatItemsCount = 0;

  for (const chat of chats) {
    const messages = await db.getChatMessages(chat.id);
    for (const message of messages) {
      if (!message.text || !message.text.trim()) continue;
      chatItemsCount++;
      const created = new Date(message.created_at).getTime();
      if (created >= minTime) {
        recentChatItemsCount++;
      }
    }
  }

  console.log(`Total non-empty chat messages: ${chatItemsCount}`);
  console.log(`Non-empty chat messages within last 7 days: ${recentChatItemsCount}`);
}

main().catch(console.error);
