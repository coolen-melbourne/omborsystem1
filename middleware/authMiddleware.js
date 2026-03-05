const User = require('../models/User');

const requireLogin = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
};

const requireAdmin = async (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  if (user && (user.username === 'user2' || user.role === 'admin')) {
    return next();
  }
  res.status(403).send('Ruxsat yo‘q');
};

const requireReporter = async (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  if (user && (user.username === 'user3' || user.role === 'reporter')) {
    return next();
  }
  res.status(403).send('Ruxsat yo‘q');
};

module.exports = { requireLogin, requireAdmin, requireReporter };