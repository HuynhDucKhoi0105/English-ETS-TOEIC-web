// GET = tải tiến độ, PUT = lưu tiến độ của tài khoản đang đăng nhập (header Authorization: Bearer <token>)
const { getDb, cors, body, readToken } = require('./_lib');
const KEEP = 20; // số bản lưu cũ giữ lại cho mỗi người để phục hồi khi ghi đè nhầm

module.exports = async (req, res) => {
  if (cors(req, res, 'GET, PUT')) return;
  const user = readToken(req);
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên đã hết hạn — đăng nhập lại' });
  try {
    const db = await getDb(), col = db.collection('progress');
    if (req.method === 'GET') {
      const d = await col.findOne({ _id: user });
      return res.status(200).json(d ? { data: d.data, upd: d.upd } : { data: null, upd: 0 });
    }
    if (req.method === 'PUT') {
      const b = body(req);
      if (!b.data || typeof b.data !== 'object') return res.status(400).json({ error: 'Thiếu dữ liệu' });
      const cur = await col.findOne({ _id: user });
      if (cur && !b.force && cur.upd > (Number(b.base) || 0)) return res.status(409).json({ error: 'Trên mây có bản mới hơn từ thiết bị khác', upd: cur.upd });
      if (cur) {
        const hist = db.collection('progress_history');
        await hist.insertOne({ profile: user, upd: cur.upd, data: cur.data, savedAt: new Date() });
        const old = await hist.find({ profile: user }, { projection: { _id: 1 } }).sort({ upd: -1 }).skip(KEEP).toArray();
        if (old.length) await hist.deleteMany({ _id: { $in: old.map(x => x._id) } });
      }
      const upd = Date.now();
      await col.updateOne({ _id: user }, { $set: { data: b.data, upd, ua: String(req.headers['user-agent'] || '').slice(0, 160) } }, { upsert: true });
      return res.status(200).json({ ok: true, upd });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Lỗi máy chủ: ' + e.message });
  }
};
