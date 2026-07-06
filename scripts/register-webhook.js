const https = require('https');

const botToken = '8903932806:AAGDTScq-QhXJj8CzSqJKetcozg3Tb1lErk';
const webhookUrl = 'https://volunteer-os-zeta.vercel.app/api/telegram/webhook';
const secretToken = '1wzL4HCJLVcSf0tIYp-LAoy0QUVBUeid5wwv0oItP0A';

const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&secret_token=${secretToken}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Response from Telegram:', data);
  });
}).on('error', (err) => {
  console.error('Error setting webhook:', err.message);
});
