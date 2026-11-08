import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-google-drive-clone-jwt-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = crypto.randomUUID();
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const insertStmt = db.prepare(`
      INSERT INTO users (id, name, email, password, storage_used, storage_quota, avatar_url)
      VALUES (?, ?, ?, ?, 0, 16106127360, ?)
    `);
    insertStmt.run(userId, name.trim(), email.toLowerCase().trim(), hashedPassword, avatarUrl);

    const token = jwt.sign({ id: userId, email: email.toLowerCase().trim() }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    const user = {
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      storage_used: 0,
      storage_quota: 16106127360,
      avatar_url: avatarUrl
    };

    return res.status(201).json({ user, token });
  } catch (error) {
    console.error('[Auth register error]', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      storage_used: user.storage_used,
      storage_quota: user.storage_quota,
      avatar_url: user.avatar_url
    };

    return res.json({ user: safeUser, token });
  } catch (error) {
    console.error('[Auth login error]', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

export function getMe(req, res) {
  try {
    const user = db.prepare('SELECT id, name, email, storage_used, storage_quota, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user });
  } catch (error) {
    console.error('[Auth getMe error]', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export function updateProfile(req, res) {
  try {
    const { name, avatar_url } = req.body;
    if (!name && !avatar_url) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (avatar_url) {
      updates.push('avatar_url = ?');
      params.push(avatar_url.trim());
    }

    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updatedUser = db.prepare('SELECT id, name, email, storage_used, storage_quota, avatar_url FROM users WHERE id = ?').get(req.user.id);
    return res.json({ user: updatedUser });
  } catch (error) {
    console.error('[Auth updateProfile error]', error);
    return res.status(500).json({ error: 'Internal server error updating profile.' });
  }
}

