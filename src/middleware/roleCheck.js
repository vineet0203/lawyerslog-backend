const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied. This route is for: ${roles.join(', ')}` });
    }
    next();
  };
};
module.exports = { allowRoles };
