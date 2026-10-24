// Dùng chung cho các API (file bắt đầu bằng "_" nên Vercel không coi là route)
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

let clientPromise = null;
function getDb() {
  if (!clientPromise) clientPromise = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 3, serverSelectionTimeoutMS: 8000 }).connect()
    .catch(e => { clientPromise = null; throw e; });
  return clientPromise.then(c => c.db(process.env.MONGODB_DB || 'english_lab'));
}
function cors(req, res, methods) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', methods + ', OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  if (!process.env.MONGODB_URI) { res.status(500).json({ error: 'Máy chủ chưa cấu hình MONGODB_URI' }); return true; }
  return false;
}
function body(req) { let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b || '{}'); } catch (e) { b = {}; } } return b || {}; }

// Token đăng nhập không lưu trên máy chủ: base64url(user.hạn).chữ-ký-HMAC
const secret = () => process.env.AUTH_SECRET || crypto.createHash('sha256').update('englishlab:' + process.env.MONGODB_URI).digest('hex');
const sign = s => crypto.createHmac('sha256', secret()).update(s).digest('base64url');
function makeToken(user) {
  const p = Buffer.from(user + '.' + (Date.now() + 365 * 864e5)).toString('base64url');
  return p + '.' + sign(p);
}
function readToken(req) {
  const t = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), [p, s] = t.split('.');
  if (!p || !s) return null;
  const a = Buffer.from(sign(p)), b = Buffer.from(s);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const [user, exp] = Buffer.from(p, 'base64url').toString().split('.');
  return Number(exp) > Date.now() ? user : null;
}
const hashPass = (pass, salt) => crypto.scryptSync(String(pass), salt, 32).toString('hex');
function checkPass(pass, u) {
  const a = Buffer.from(hashPass(pass, u.salt), 'hex'), b = Buffer.from(u.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
module.exports = { getDb, cors, body, makeToken, readToken, hashPass, checkPass };
