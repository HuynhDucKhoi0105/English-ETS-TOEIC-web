// POST /api/auth  { action: 'register' | 'login' | 'password', user, pass, newPass }
const crypto = require('crypto');
const { getDb, cors, body, makeToken, hashPass, checkPass } = require('./_lib');

module.exports = async (req, res) => {
  if (cors(req, res, 'POST')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const b = body(req), action = b.action, user = String(b.user || '').trim().toLowerCase(), pass = String(b.pass || '');
  if (!/^[a-z0-9_.-]{3,24}$/.test(user)) return res.status(400).json({ error: 'Tên đăng nhập 3–24 ký tự: chữ không dấu, số, dấu _ . -' });
  if (pass.length < 4) return res.status(400).json({ error: 'Mật khẩu tối thiểu 4 ký tự' });
  try {
    const users = (await getDb()).collection('users');
    if (action === 'register') {
      const salt = crypto.randomBytes(16).toString('hex');
      try { await users.insertOne({ _id: user, salt, hash: hashPass(pass, salt), created: new Date() }); }
      catch (e) { if (e.code === 11000) return res.status(409).json({ error: 'Tên “' + user + '” đã có người dùng — chọn tên khác' }); throw e; }
      return res.status(200).json({ ok: true, user, token: makeToken(user), isNew: true });
    }
    const u = await users.findOne({ _id: user });
    if (!u || !checkPass(pass, u)) return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    if (action === 'login') {
      await users.updateOne({ _id: user }, { $set: { lastLogin: new Date() } });
      return res.status(200).json({ ok: true, user, token: makeToken(user) });
    }
    if (action === 'password') {
      const np = String(b.newPass || '');
      if (np.length < 4) return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 4 ký tự' });
      const salt = crypto.randomBytes(16).toString('hex');
      await users.updateOne({ _id: user }, { $set: { salt, hash: hashPass(np, salt) } });
      return res.status(200).json({ ok: true, user, token: makeToken(user) });
    }
    return res.status(400).json({ error: 'action không hợp lệ' });
  } catch (e) {
    return res.status(500).json({ error: 'Lỗi máy chủ: ' + e.message });
  }
};
