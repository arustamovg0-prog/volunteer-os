import 'dotenv/config';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = 5384128752;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function run() {
  console.log(`Deep scanning message IDs 7800 to 7880 for chat_id ${CHAT_ID}...`);

  for (let msgId = 7875; msgId >= 7800; msgId--) {
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
        console.log(`🎉🎉🎉 MATCH FOUND & REMOVED! chat_id ${CHAT_ID} message_id ${msgId}`);
      } else {
        console.log(`msgId ${msgId}: ${data.description}`);
      }

      await sleep(50);
    } catch (e) {
      console.error(`Error on msg ${msgId}:`, e);
    }
  }
}

run().catch(console.error);
