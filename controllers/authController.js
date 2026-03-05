const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res) => {
  if (req.session.userId) {
    // Agar allaqachon kirgan boʻlsa, rolga qarab yoʻnaltirish
    if (req.session.role === 'admin') return res.redirect('/dashboard2');
    if (req.session.role === 'reporter') return res.redirect('/dashboard3');
    return res.redirect('/dashboard');
  }
  res.render('login', { title: 'Kirish', error: null });
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username }).lean();
    if (!user) {
      return res.render('login', { title: 'Kirish', error: 'Login yoki parol noto‘g‘ri' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { title: 'Kirish', error: 'Login yoki parol noto‘g‘ri' });
    }
    // Sessiyaga yozish
    req.session.userId = user._id.toString();
    req.session.username = user.username;
    req.session.role = user.role;

    // Majburiy saqlash (baʼzi sessiya storeʼlari uchun)
    req.session.save(err => {
      if (err) console.error('Session save error:', err);
      // Rolga qarab yoʻnaltirish
      if (user.role === 'admin') return res.redirect('/dashboard2');
      if (user.role === 'reporter') return res.redirect('/dashboard3');
      res.redirect('/dashboard');
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server xatosi');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};