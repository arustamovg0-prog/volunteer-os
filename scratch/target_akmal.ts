import 'dotenv/config';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = 5384128752;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function run() {
  console.log(`Scanning message IDs 7800 to 7900 for chat_id ${CHAT_ID}...`);

  for (let msgId = 7900; msgId >= 7800; msgId--) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          message_id: msgId,
          reply_markup: { inline_keyboard: [] }
        })
      });

      const data = await res.json();
      if (data.ok) {
        console.log(`🎉🎉🎉 SUCCESS! Removed buttons on message_id ${msgId} for chat ${CHAT_ID}`);
      } else if (res.status === 429 || (data.parameters && data.parameters.retry_after)) {
        const waitSec = data.parameters?.retry_after || 3;
        console.log(`[Rate Limit] Waiting ${waitSec}s...`);
        await sleep((waitSec + 1) * 1000);
        msgId++; // retry
      } else if (!data.description?.includes('message to edit not found')) {
        console.log(`Msg ${msgId}:`, data.description);
      }

      await sleep(35);
    } catch (e) {
      console.error(`Error on msg ${msgId}:`, e);
    }
  }

  console.log('Finished scanning 7800-7900.');
}

run().catch(console.error);
