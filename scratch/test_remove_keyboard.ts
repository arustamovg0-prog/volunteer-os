import 'dotenv/config';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_ID = 5384128752;

async function run() {
  console.log(`Sending remove_keyboard to Telegram ID ${TG_ID}...`);

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_ID,
      text: 'Iltimos, bot xabarlarini kuzatib boring.',
      reply_markup: {
        remove_keyboard: true
      }
    })
  });

  const data = await res.json();
  console.log('Result:', data);
}

run().catch(console.error);
