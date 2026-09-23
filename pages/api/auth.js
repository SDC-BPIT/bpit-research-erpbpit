const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

function getPrisma() {
  if (global.prisma) {
    try {
      const dmmf = global.prisma._runtimeDataModel || global.prisma._dmmf;
      const userFields = dmmf?.models?.User?.fields || dmmf?.datamodel?.models?.find(m => m.name === 'User')?.fields;
      if (userFields && !userFields.some(f => f.name === 'isArchived')) {
        global.prisma = null;
      }
    } catch (e) {
      global.prisma = null;
    }
  }
  if (!global.prisma) {
    try {
      delete require.cache[require.resolve('@prisma/client')];
    } catch (e) {}
    const { PrismaClient } = require('@prisma/client');
    global.prisma = new PrismaClient();
  }
  return global.prisma;
}

let prisma = getPrisma();

const mailTransporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  tls: { rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false' }
}) : null;

async function sendResetLink(email, name, resetToken) {
  const from = process.env.EMAIL_FROM || 'BPIT ERP <no-reply@bpitindia.com>';
  const subject = 'BPIT ERP Password Reset Link';
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  const text = `Hello ${name || 'User'},\n\nA password reset request was received for your BPIT ERP account. Use the link below to choose a new password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this message or contact your administrator.`;
  const html = `<p>Hello ${name || 'User'},</p><p>A password reset request was received for your BPIT ERP account. Use the link below to choose a new password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, please ignore this message or contact your administrator.</p>`;

  if (!mailTransporter) {
    console.log('Password reset email (no SMTP configured):', { to: email, subject, resetUrl });
    return;
  }

  await mailTransporter.sendMail({ from, to: email, subject, text, html });
}

const SECRET = process.env.JWT_SECRET || 'bpit_erp_jwt_secret_2024';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try { return jwt.verify(token, SECRET); }
  catch (e) { return null; }
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/erp_token=([^;]+)/);
  return match ? match[1] : null;
}

function setCookie(res, token) {
  res.setHeader('Set-Cookie', 'erp_token=' + token + '; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax');
}

function clearCookie(res) {
  res.setHeader('Set-Cookie', 'erp_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
}

module.exports = async function handler(req, res) {
  prisma = getPrisma();
  const action = req.query.action;

  if (action === 'login' && req.method === 'POST') {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      let isArchived = user.isArchived;
      if (typeof isArchived === 'undefined') {
        try {
          const rows = await prisma.$queryRawUnsafe(`SELECT isArchived FROM User WHERE id = ${user.id}`);
          if (rows && rows[0]) isArchived = Boolean(rows[0].isArchived);
        } catch (err) {}
      }
      if (isArchived) {
        return res.status(403).json({ error: 'Account has been archived/deactivated. Please contact administrator.' });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role, dept: user.dept });
      setCookie(res, token);
      return res.json({ token, id: user.id, name: user.name, email: user.email, role: user.role, dept: user.dept });
    } catch (e) {
      console.error('Login error:', e);
      return res.status(500).json({ error: 'Server error: ' + e.message });
    }
  }

  if (action === 'logout' && req.method === 'POST') {
    clearCookie(res);
    return res.json({ ok: true });
  }

  if (action === 'me' && req.method === 'GET') {
    const token = getTokenFromRequest(req);
    if (!token) {
      clearCookie(res);
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = verifyToken(token);
    if (!user) {
      clearCookie(res);
      return res.status(401).json({ error: 'Invalid token' });
    }
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { isArchived: true } });
    if (dbUser && dbUser.isArchived) {
      clearCookie(res);
      return res.status(403).json({ error: 'Account has been archived/deactivated' });
    }
    return res.json(user);
  }

  if (action === 'forgot-password' && req.method === 'POST') {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      await prisma.user.update({
        where: { email },
        data: { resetToken, resetTokenExpiry }
      });
      if (mailTransporter) {
        await sendResetLink(email, user.name, resetToken);
        return res.json({ message: 'Reset link sent to email' });
      }
      console.log(`Reset link: http://localhost:3000/reset-password?token=${resetToken}`);
      return res.json({ message: 'Reset link generated (check console for demo)', resetToken });
    } catch (e) {
      console.error('Forgot password error:', e);
      return res.status(500).json({ error: 'Server error: ' + e.message });
    }
  }

  if (action === 'reset-password' && req.method === 'POST') {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });
      const user = await prisma.user.findFirst({
        where: { resetToken: token, resetTokenExpiry: { gt: new Date() } }
      });
      if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
      });
      return res.json({ message: 'Password reset successfully' });
    } catch (e) {
      console.error('Reset password error:', e);
      return res.status(500).json({ error: 'Server error: ' + e.message });
    }
  }

  if (action === 'demo-users' && req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, dept: true }
      });
      return res.json(users);
    } catch (e) {
      console.error('Demo users error:', e);
      return res.status(500).json({ error: 'Server error: ' + e.message });
    }
  }

  return res.status(404).json({ error: 'Not found' });
};