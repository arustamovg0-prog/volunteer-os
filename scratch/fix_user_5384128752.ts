import 'dotenv/config';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_ID = 5384128752;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function run() {
  console.log(`Searching and removing buttons for TG ID ${TG_ID}...`);

  for (let msgId = 1; msgId <= 2000; msgId++) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_ID,
          message_id: msgId,
          reply_markup: { inline_keyboard: [] }
        })
      });

      const data = await res.json();
      if (data.ok) {
        console.log(`🎉 SUCCESS! Removed buttons for user ${TG_ID} on message_id ${msgId}!`);
      } else if (res.status === 429 || (data.parameters && data.parameters.retry_after)) {
        const waitSec = data.parameters?.retry_after || 3;
        console.log(`[Rate Limit] Waiting ${waitSec}s...`);
        await sleep((waitSec + 1) * 1000);
        msgId--; // retry same msgId
      } else if (!data.description?.includes('message to edit not found')) {
        console.log(`Msg ${msgId} response:`, data.description);
      }

      // 30ms delay to stay well under rate limits
      await sleep(35);
    } catch (e) {
      console.error(`Error on msg ${msgId}:`, e);
    }
  }

  console.log('Finished scan for TG ID 5384128752.');
}

run().catch(console.error);
