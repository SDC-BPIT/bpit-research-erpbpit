const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

const SECRET = process.env.JWT_SECRET || 'bpit_erp_jwt_secret_2024';

const MODEL_MAP = {
  journals: 'journal',
  patents: 'patent',
  conferences: 'conference',
  fdp: 'fDP',
  bookchapters: 'bookChapter',
  books: 'book',
};

function sanitizePayload(body) {
  const sanitized = {};
  for (const [key, val] of Object.entries(body)) {
    if (key === 'id' || key === 'submittedById') {
      sanitized[key] = val;
    } else if (typeof val === 'number') {
      sanitized[key] = String(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

async function getUser(req, res) {
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
    let payload;
    try {
      payload = jwt.verify(token, SECRET);
    } catch (e) {
      if (res && !authHeader) {
        res.setHeader('Set-Cookie', 'erp_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
      }
      return null;
    }
    if (!payload || (!payload.id && payload.id !== 0)) return null;
    const userId = typeof payload.id === 'string' ? parseInt(payload.id, 10) : payload.id;
    if (!Number.isInteger(userId)) return null;
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      if (res && !authHeader) {
        res.setHeader('Set-Cookie', 'erp_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
      }
      return null;
    }
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      dept: dbUser.dept,
    };
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const user = await getUser(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const module = req.query.module;
  const modelKey = MODEL_MAP[module];
  if (!modelKey) return res.status(404).json({ error: 'Module not found' });

  const model = prisma[modelKey];

  try {
    if (req.method === 'GET') {
      const userRole = (user.role || '').toLowerCase().trim();
      const where = userRole === 'faculty' ? { submittedById: user.id } : {};
      let records = await model.findMany({ where, orderBy: { id: 'desc' } });
      console.log(`[DEBUG] GET /${module} - user: ${user.name} (id: ${user.id}, role: ${user.role}), records found: ${records.length}, filter: ${userRole === 'faculty' ? 'faculty' : 'all'}`);
      // For journals, populate department if missing
      if (module === 'journals') {
        records = await Promise.all(records.map(async (r) => {
          if (!r.department) {
            const usr = await prisma.user.findUnique({ where: { id: r.submittedById } });
            r.department = usr ? usr.dept : 'Unknown';
          }
          return r;
        }));
      }
      return res.json(records);
    }

    if (req.method === 'POST') {
      const body = Object.assign({}, req.body);
      delete body.id;
      body.submittedById = user.id;
      body.submittedByName = user.name;
      body.submittedAt = new Date().toISOString().split('T')[0];
      const record = await model.create({ data: sanitizePayload(body) });
      return res.json(record);
    }

    if (req.method === 'PUT') {
      const body = Object.assign({}, req.body);
      const id = parseInt(body.id);
      delete body.id;
      delete body.submittedById;
      delete body.submittedByName;
      delete body.submittedAt;
      delete body._mod;
      const userRole = (user.role || '').toLowerCase().trim();
      if (userRole !== 'admin') {
        const existing = await model.findUnique({ where: { id } });
        if (!existing || existing.submittedById !== user.id) return res.status(403).json({ error: 'Forbidden' });
      }
      const record = await model.update({ where: { id }, data: sanitizePayload(body) });
      return res.json(record);
    }

    if (req.method === 'DELETE') {
      const id = parseInt(req.query.id);
      const userRole = (user.role || '').toLowerCase().trim();
      if (userRole !== 'admin') {
        const existing = await model.findUnique({ where: { id } });
        if (!existing || existing.submittedById !== user.id) return res.status(403).json({ error: 'Forbidden' });
      }
      await model.delete({ where: { id } });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('API error:', e.message, '| Prisma code:', e.code, '| Module:', req.query.module);
    return res.status(500).json({ error: 'Server error: ' + e.message });
  }
};