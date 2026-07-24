import { db, prisma } from '../src/lib/db';

async function main() {
  console.log('=== INSPECTING DB CHATS & MESSAGES FOR AGENDA ===');

  const chats = await db.getChats();
  console.log(`Total chats found via db.getChats(): ${chats.length}`);

  let totalChatMessages = 0;
  for (const chat of chats) {
    const messages = await db.getChatMessages(chat.id);
    console.log(`Chat "${chat.title}" (${chat.id}, type=${chat.type}): ${messages.length} messages`);
    totalChatMessages += messages.length;
    if (messages.length > 0) {
      console.log('  Sample msg:', messages[0]);
    }
  }

  console.log(`Total chat messages across all chats: ${totalChatMessages}`);

  const mockMessages = await db.getAllMockMessages();
  console.log(`Total mockMessages: ${mockMessages.length}`);

  const rawChatsCount = await prisma.chat.count();
  const rawMessagesCount = await prisma.chatMessage.count();
  console.log(`Prisma Chat count: ${rawChatsCount}, Prisma ChatMessage count: ${rawMessagesCount}`);

  // Fetch last 10 messages from Prisma
  const lastMessages = await prisma.chatMessage.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log('Last 10 ChatMessages in Prisma:', lastMessages);
}

main().catch(console.error);
