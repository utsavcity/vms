const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const PHONE = process.env.TWILIO_PHONE_NUMBER;
const WHATSAPP = process.env.TWILIO_WHATSAPP_NUMBER;

async function sendSMS(to, body) {
  return client.messages.create({ from: PHONE, to, body });
}

async function sendWhatsApp(to, body) {
  // Twilio sandbox WhatsApp number — replace with approved sender in production
  const from = WHATSAPP;
  const toWA = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  return client.messages.create({ from, to: toWA, body });
}

module.exports = { client, sendSMS, sendWhatsApp };
