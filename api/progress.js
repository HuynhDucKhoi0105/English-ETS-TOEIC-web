// API đồng bộ tiến độ: GET = tải, PUT = lưu. Chạy trên Vercel (Node).
// Biến môi trường (đặt trên Vercel, KHÔNG ghi vào code): MONGODB_URI, SYNC_KEY, (tuỳ chọn) MONGODB_DB
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

let clientPromise = null;
function getDb() {
  if (!clientPromise) clientPromise = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 3, serverSelectionTimeoutMS: 8000 }).connect();
  return clientPromise.then(c => c.db(process.env.MONGODB_DB || 'english_lab'));
}
function keyOk(k) {
  const a = Buffer.from(String(k || '')), b = Buffer.from(String(process.env.SYNC_KEY || ''));
  return b.length >= 12 && a.length === b.length && crypto.timingSafeEqual(a, b);
}
const KEEP = 20; // số bản lưu cũ giữ lại để phục hồi khi ghi đè nhầm

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // cho phép bản mở từ file trên máy gọi vào; vẫn cần mã đồng bộ
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-sync-key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!process.env.MONGODB_URI || !process.env.SYNC_KEY) return res.status(500).json({ error: 'Máy chủ chưa cấu hình MONGODB_URI / SYNC_KEY' });
  if (!keyOk(req.headers['x-sync-key'])) return res.status(401).json({ error: 'Sai mã đồng bộ' });
  const profile = String((req.query && req.query.p) || 'main').slice(0, 40);
  try {
    const db = await getDb(), col = db.collection('progress');
    if (req.method === 'GET') {
      const d = await col.findOne({ _id: profile });
      return res.status(200).json(d ? { data: d.data, upd: d.upd } : { data: null, upd: 0 });
    }
    if (req.method === 'PUT') {
      let b = req.body;
      if (typeof b === 'string') b = JSON.parse(b || '{}');
      if (!b || typeof b.data !== 'object' || b.data === null) return res.status(400).json({ error: 'Thiếu dữ liệu' });
      const cur = await col.findOne({ _id: profile });
      if (cur && !b.force && cur.upd > (Number(b.base) || 0)) return res.status(409).json({ error: 'Trên mây có bản mới hơn từ thiết bị khác', upd: cur.upd });
      if (cur) {
        const hist = db.collection('progress_history');
        await hist.insertOne({ profile, upd: cur.upd, data: cur.data, savedAt: new Date() });
        const old = await hist.find({ profile }, { projection: { _id: 1 } }).sort({ upd: -1 }).skip(KEEP).toArray();
        if (old.length) await hist.deleteMany({ _id: { $in: old.map(x => x._id) } });
      }
      const upd = Date.now();
      await col.updateOne({ _id: profile }, { $set: { data: b.data, upd, ua: String(req.headers['user-agent'] || '').slice(0, 160) } }, { upsert: true });
      return res.status(200).json({ ok: true, upd });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Lỗi máy chủ: ' + e.message });
  }
};
