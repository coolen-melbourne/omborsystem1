const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || 'Serverda xatolik yuz berdi';
  res.status(status).json({ error: message });
};

module.exports = errorHandler;