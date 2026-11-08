import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { db } from './config/database.js';

import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import { FOLDER_MIME_TYPE } from './utils/fileTypes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Dev mode: allow any local client
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Google Drive Clone Backend API'
  });
});

// Seed default demo user and sample folders if database is brand new
async function seedDemoDataIfEmpty() {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
      console.log('[Seed] Seeding initial demo account...');
      const demoId = crypto.randomUUID();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO users (id, name, email, password, storage_used, storage_quota, avatar_url, created_at)
        VALUES (?, 'Kunal Sharma', 'demo@google.com', ?, 0, 16106127360, 'https://api.dicebear.com/7.x/initials/svg?seed=Kunal', ?)
      `).run(demoId, hashedPassword, now);

      // Create a few starter folders
      const folders = ['Documents', 'Projects', 'Images & Media', 'Finance'];
      for (const fName of folders) {
        const folderId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO files (id, user_id, parent_id, name, mime_type, size, is_folder, is_starred, is_trashed, created_at, updated_at, last_accessed_at)
          VALUES (?, ?, NULL, ?, ?, 0, 1, 0, 0, ?, ?, ?)
        `).run(folderId, demoId, fName, FOLDER_MIME_TYPE, now, now, now);
      }
      console.log('[Seed] Demo account created: demo@google.com / password123');
    }
  } catch (err) {
    console.error('[Seed Error]', err);
  }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/storage', storageRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File size limit exceeded.' });
  }
  return res.status(500).json({ error: err.message || 'Internal server error.' });
});

// Start Server
seedDemoDataIfEmpty().then(() => {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Google Drive Clone Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
});
