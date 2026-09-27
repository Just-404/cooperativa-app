const authService = require('../services/auth.service');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { token, usuario } = await authService.login(email, password);
    res.json({ token, usuario });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
