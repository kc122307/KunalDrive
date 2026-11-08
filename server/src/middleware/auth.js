import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-google-drive-clone-jwt-key-2026';

export function authenticate(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    // For media streaming and direct download requests
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userStmt = db.prepare('SELECT id, name, email, storage_used, storage_quota, avatar_url FROM users WHERE id = ?');
    const user = userStmt.get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function optionalAuthenticate(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userStmt = db.prepare('SELECT id, name, email, storage_used, storage_quota, avatar_url FROM users WHERE id = ?');
    const user = userStmt.get(decoded.id);
    if (user) {
      req.user = user;
    }
  } catch (e) {
    // Ignore invalid optional tokens
  }
  next();
}
