const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const localEnvPath = path.join(process.cwd(), '.env');

if (fs.existsSync(localEnvPath)) {
  const envFile = fs.readFileSync(localEnvPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      value = value.replace(/^(['"])(.*)\1$/, '$2');
      if (value.includes('#')) {
          value = value.split('#')[0].trim();
      }
      process.env[key] = value.replace(/^(['"])(.*)\1$/, '$2').trim();
    }
  });
}

async function testEmail() {
  console.log("Testing SMTP connection...");
  console.log("Host:", process.env.SMTP_HOST);
  console.log("Port:", process.env.SMTP_PORT);
  console.log("Secure:", process.env.SMTP_SECURE);
  console.log("User:", process.env.SMTP_USER);
  
  const pass = process.env.SMTP_PASS || "";
  console.log("Pass length:", pass.length, pass.length > 0 ? "(Password is set)" : "(Password is EMPTY!)");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.verify();
    console.log("✅ SUCCESS! Your SMTP credentials are valid.");
  } catch (err) {
    console.error("❌ FAILED! Error details:");
    console.error(err);
  }
}

testEmail();
