const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  console.log('=== PROTECT CALLED ===');
  console.log('next type:', typeof next);
  console.log('next name:', next?.name);
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized. Token missing.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.id, role: decoded.role };
    console.log('=== CALLING NEXT ===');
    return next();
  } catch (error) {
    console.log('=== PROTECT ERROR ===', error.message);
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

module.exports = { protect };
