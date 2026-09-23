import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const SECRET = process.env.JWT_SECRET || 'bpit_erp_jwt_secret_2024';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); }
  catch (e) { return null; }
}

export function getUser(req) {
  try {
    const token = req.cookies && req.cookies.erp_token;
    if (!token) return null;
    return verifyToken(token);
  } catch (e) { return null; }
}

export function setTokenCookie(res, token) {
  res.setHeader('Set-Cookie', serialize('erp_token', token, {
    httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax'
  }));
}

export function clearTokenCookie(res) {
  res.setHeader('Set-Cookie', serialize('erp_token', '', {
    httpOnly: true, path: '/', maxAge: 0
  }));
}
