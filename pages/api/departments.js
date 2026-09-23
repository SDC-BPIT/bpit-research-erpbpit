const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

const SECRET = process.env.JWT_SECRET || 'bpit_erp_jwt_secret_2024';

function getUser(req) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = req.headers.cookie || '';
      const match = cookieHeader.match(/erp_token=([^;]+)/);
      if (match) token = match[1];
    }
    if (!token) return null;
    return jwt.verify(token, SECRET);
  } catch (e) { return null; }
}

module.exports = async function handler(req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const depts = await prisma.department.findMany({ orderBy: { name: 'asc' } });
      return res.json(depts.map(function(d) { return d.name; }));
    }

    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    if (req.method === 'POST') {
      const name = req.body.name.trim().toUpperCase();
      const existing = await prisma.department.findUnique({ where: { name } });
      if (existing) return res.status(400).json({ error: 'Branch already exists' });
      await prisma.department.create({ data: { name } });
      return res.json({ ok: true, name });
    }

    if (req.method === 'DELETE') {
      const name = req.query.name;
      await prisma.department.delete({ where: { name } });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Departments API error:', e);
    return res.status(500).json({ error: 'Server error: ' + e.message });
  }
};