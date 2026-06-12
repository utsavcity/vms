const supabase = require('../config/supabase');

// Verify Supabase JWT and attach user + role to req
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authorization token' } });
  }

  const token = header.slice(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
  }

  // Role is stored in user_metadata by the admin when creating accounts
  const role = user.user_metadata?.role;
  req.user = { id: user.id, role, email: user.email };
  next();
}

// Middleware factory — throws 403 if caller role doesn't match
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `Access restricted to: ${roles.join(', ')}` } });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
