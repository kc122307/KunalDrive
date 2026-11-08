import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { db } from '../config/database.js';
import { detectMimeType, getFileCategory, FOLDER_MIME_TYPE } from '../utils/fileTypes.js';
import { UPLOADS_DIR, TEMP_UPLOADS_DIR } from '../middleware/upload.js';

export function listFiles(req, res) {
  try {
    const userId = req.user.id;
    const {
      folderId,
      view = 'my-drive',
      sortBy = 'name',
      sortOrder = 'asc',
      type
    } = req.query;

    const orderDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    let orderColumn = 'name';
    if (sortBy === 'modified') orderColumn = 'updated_at';
    if (sortBy === 'size') orderColumn = 'size';

    if (view === 'trash') {
      const items = db.prepare(`
        SELECT f.*, u.name as owner_name, u.email as owner_email
        FROM files f
        JOIN users u ON f.user_id = u.id
        WHERE f.user_id = ? AND f.is_trashed = 1
        ORDER BY f.trashed_at DESC
      `).all(userId);

      const folders = items.filter(i => i.is_folder === 1);
      const files = items.filter(i => i.is_folder === 0).map(f => ({
        ...f,
        category: getFileCategory(f.mime_type, f.name)
      }));

      return res.json({ folders, files, currentFolder: null });
    }

    if (view === 'starred') {
      const items = db.prepare(`
        SELECT f.*, u.name as owner_name, u.email as owner_email
        FROM files f
        JOIN users u ON f.user_id = u.id
        WHERE f.user_id = ? AND f.is_starred = 1 AND f.is_trashed = 0
        ORDER BY f.${orderColumn} ${orderDirection}
      `).all(userId);

      const folders = items.filter(i => i.is_folder === 1);
      let files = items.filter(i => i.is_folder === 0).map(f => ({
        ...f,
        category: getFileCategory(f.mime_type, f.name)
      }));

      if (type && type !== 'all') {
        files = files.filter(f => f.category === type);
      }

      return res.json({ folders, files, currentFolder: null });
    }

    if (view === 'recent') {
      const files = db.prepare(`
        SELECT f.*, u.name as owner_name, u.email as owner_email
        FROM files f
        JOIN users u ON f.user_id = u.id
        WHERE f.user_id = ? AND f.is_folder = 0 AND f.is_trashed = 0
        ORDER BY f.last_accessed_at DESC
        LIMIT 50
      `).all(userId).map(f => ({
        ...f,
        category: getFileCategory(f.mime_type, f.name)
      }));

      return res.json({ folders: [], files, currentFolder: null });
    }

    if (view === 'shared') {
      const items = db.prepare(`
        SELECT f.*, s.permission as share_permission, s.token as share_token, u.name as owner_name, u.email as owner_email
        FROM shares s
        JOIN files f ON s.file_id = f.id
        JOIN users u ON f.user_id = u.id
        WHERE (s.shared_with_email = ? OR s.is_public = 1) AND f.is_trashed = 0 AND f.user_id != ?
        ORDER BY s.created_at DESC
      `).all(req.user.email, userId);

      const folders = items.filter(i => i.is_folder === 1);
      let files = items.filter(i => i.is_folder === 0).map(f => ({
        ...f,
        category: getFileCategory(f.mime_type, f.name)
      }));

      return res.json({ folders, files, currentFolder: null });
    }

    // Default: 'my-drive'
    const parentId = (folderId === 'root' || !folderId || folderId === 'null') ? null : folderId;

    let currentFolder = null;
    if (parentId) {
      currentFolder = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ? AND is_folder = 1').get(parentId, userId);
      if (!currentFolder) {
        return res.status(404).json({ error: 'Folder not found.' });
      }
    }

    const query = `
      SELECT f.*, u.name as owner_name, u.email as owner_email
      FROM files f
      JOIN users u ON f.user_id = u.id
      WHERE f.user_id = ?
        AND (f.parent_id = ? OR (f.parent_id IS NULL AND ? IS NULL))
        AND f.is_trashed = 0
      ORDER BY f.${orderColumn} ${orderDirection}
    `;

    const items = db.prepare(query).all(userId, parentId, parentId);

    const folders = items.filter(i => i.is_folder === 1);
    let files = items.filter(i => i.is_folder === 0).map(f => ({
      ...f,
      category: getFileCategory(f.mime_type, f.name)
    }));

    if (type && type !== 'all') {
      files = files.filter(f => f.category === type);
    }

    return res.json({ folders, files, currentFolder });
  } catch (error) {
    console.error('[Files listFiles error]', error);
    return res.status(500).json({ error: 'Internal server error listing files.' });
  }
}

export function uploadFiles(req, res) {
  try {
    const userId = req.user.id;
    const parentId = (req.body.parent_id === 'root' || !req.body.parent_id || req.body.parent_id === 'null') ? null : req.body.parent_id;
    const files = req.files || (req.file ? [req.file] : []);

    if (!files.length) {
      return res.status(400).json({ error: 'No files provided for upload.' });
    }

    const user = db.prepare('SELECT storage_used, storage_quota FROM users WHERE id = ?').get(userId);
    const totalNewSize = files.reduce((acc, f) => acc + f.size, 0);

    if (user.storage_used + totalNewSize > user.storage_quota) {
      // Clean up uploaded temp files
      for (const f of files) {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      }
      return res.status(413).json({ error: 'Storage quota exceeded. Please free up space or upgrade quota.' });
    }

    if (parentId) {
      const parent = db.prepare('SELECT id, is_folder, is_trashed FROM files WHERE id = ? AND user_id = ?').get(parentId, userId);
      if (!parent || !parent.is_folder || parent.is_trashed) {
        for (const f of files) {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        }
        return res.status(404).json({ error: 'Target parent folder does not exist or is in trash.' });
      }
    }

    const createdFiles = [];
    const now = new Date().toISOString();

    for (const file of files) {
      const fileId = crypto.randomUUID();
      const detectedMime = detectMimeType(file.originalname, file.mimetype);
      const relativeStoragePath = path.relative(path.resolve(UPLOADS_DIR, '..'), file.path);

      db.prepare(`
        INSERT INTO files (id, user_id, parent_id, name, mime_type, size, is_folder, is_starred, is_trashed, storage_path, created_at, updated_at, last_accessed_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?)
      `).run(fileId, userId, parentId, file.originalname, detectedMime, file.size, relativeStoragePath, now, now, now);

      const record = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
      createdFiles.push({
        ...record,
        category: getFileCategory(record.mime_type, record.name)
      });
    }

    db.prepare('UPDATE users SET storage_used = storage_used + ? WHERE id = ?').run(totalNewSize, userId);

    return res.status(201).json({
      files: createdFiles,
      message: `Successfully uploaded ${createdFiles.length} file(s).`
    });
  } catch (error) {
    console.error('[Files uploadFiles error]', error);
    return res.status(500).json({ error: 'Internal server error during upload.' });
  }
}

export function resumableInit(req, res) {
  try {
    const userId = req.user.id;
    const { filename, mime_type, total_size, parent_id } = req.body;

    if (!filename || !total_size) {
      return res.status(400).json({ error: 'Filename and total_size are required.' });
    }

    const user = db.prepare('SELECT storage_used, storage_quota FROM users WHERE id = ?').get(userId);
    if (user.storage_used + total_size > user.storage_quota) {
      return res.status(413).json({ error: 'Storage quota exceeded.' });
    }

    const sessionId = crypto.randomUUID();
    const tempFilename = `temp-${sessionId}-${path.basename(filename)}`;
    const tempPath = path.join(TEMP_UPLOADS_DIR, tempFilename);

    // Create empty temp file
    fs.writeFileSync(tempPath, '');

    const parentIdClean = (parent_id === 'root' || !parent_id || parent_id === 'null') ? null : parent_id;

    db.prepare(`
      INSERT INTO upload_sessions (id, user_id, parent_id, filename, mime_type, total_size, uploaded_bytes, temp_path)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(sessionId, userId, parentIdClean, filename, mime_type || detectMimeType(filename), total_size, tempPath);

    return res.status(201).json({
      sessionId,
      uploadUrl: `/api/files/upload/chunk/${sessionId}`,
      uploadedBytes: 0,
      totalSize: total_size
    });
  } catch (error) {
    console.error('[Resumable Init error]', error);
    return res.status(500).json({ error: 'Internal server error initializing resumable upload.' });
  }
}

export function resumableChunk(req, res) {
  try {
    const { sessionId } = req.params;
    const session = db.prepare('SELECT * FROM upload_sessions WHERE id = ?').get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Upload session not found or expired.' });
    }

    const contentRange = req.headers['content-range']; // bytes 0-262143/1048576
    const chunk = req.body;

    if (!Buffer.isBuffer(chunk)) {
      return res.status(400).json({ error: 'Invalid binary chunk body.' });
    }

    fs.appendFileSync(session.temp_path, chunk);
    const newUploadedBytes = session.uploaded_bytes + chunk.length;

    if (newUploadedBytes >= session.total_size) {
      // Completed! Move to permanent storage
      const finalFilename = `${Date.now()}-${crypto.randomUUID()}${path.extname(session.filename)}`;
      const finalPath = path.join(UPLOADS_DIR, finalFilename);
      fs.renameSync(session.temp_path, finalPath);

      const fileId = crypto.randomUUID();
      const relativeStoragePath = path.relative(path.resolve(UPLOADS_DIR, '..'), finalPath);
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO files (id, user_id, parent_id, name, mime_type, size, is_folder, is_starred, is_trashed, storage_path, created_at, updated_at, last_accessed_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?)
      `).run(fileId, session.user_id, session.parent_id, session.filename, session.mime_type, session.total_size, relativeStoragePath, now, now, now);

      db.prepare('UPDATE users SET storage_used = storage_used + ? WHERE id = ?').run(session.total_size, session.user_id);
      db.prepare('DELETE FROM upload_sessions WHERE id = ?').run(sessionId);

      const file = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
      return res.status(200).json({
        status: 'complete',
        file: { ...file, category: getFileCategory(file.mime_type, file.name) }
      });
    }

    db.prepare('UPDATE upload_sessions SET uploaded_bytes = ? WHERE id = ?').run(newUploadedBytes, sessionId);

    // Google Drive returns 308 Resume Incomplete
    res.setHeader('Range', `bytes 0-${newUploadedBytes - 1}`);
    return res.status(308).json({
      status: 'incomplete',
      uploadedBytes: newUploadedBytes,
      totalSize: session.total_size
    });
  } catch (error) {
    console.error('[Resumable Chunk error]', error);
    return res.status(500).json({ error: 'Internal server error processing chunk.' });
  }
}

export function downloadFile(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const shareToken = req.query.shareToken;

    let file = null;
    if (shareToken) {
      const share = db.prepare('SELECT * FROM shares WHERE token = ?').get(shareToken);
      if (share && share.file_id === id) {
        file = db.prepare('SELECT * FROM files WHERE id = ? AND is_trashed = 0').get(id);
      }
    } else if (userId) {
      file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ? AND is_trashed = 0').get(id, userId);
    }

    if (!file || file.is_folder || !file.storage_path) {
      return res.status(404).json({ error: 'File not found or inaccessible.' });
    }

    const absolutePath = path.resolve(UPLOADS_DIR, path.basename(file.storage_path));
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File binary does not exist on disk.' });
    }

    // Update last accessed
    db.prepare('UPDATE files SET last_accessed_at = ? WHERE id = ?').run(new Date().toISOString(), file.id);

    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Length', file.size);

    const stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
  } catch (error) {
    console.error('[Files download error]', error);
    return res.status(500).json({ error: 'Internal server error downloading file.' });
  }
}

export function streamFile(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const shareToken = req.query.shareToken;

    let file = null;
    if (shareToken) {
      const share = db.prepare('SELECT * FROM shares WHERE token = ?').get(shareToken);
      if (share && share.file_id === id) {
        file = db.prepare('SELECT * FROM files WHERE id = ? AND is_trashed = 0').get(id);
      }
    } else if (userId) {
      file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ? AND is_trashed = 0').get(id, userId);
    }

    if (!file || file.is_folder || !file.storage_path) {
      return res.status(404).json({ error: 'File not found or inaccessible.' });
    }

    const absolutePath = path.resolve(UPLOADS_DIR, path.basename(file.storage_path));
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File binary missing from disk.' });
    }

    const stat = fs.statSync(absolutePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Update last accessed time
    db.prepare('UPDATE files SET last_accessed_at = ? WHERE id = ?').run(new Date().toISOString(), file.id);

    if (range) {
      // Partial content streaming for video, audio, and large docs
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': file.mime_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`
      });

      const stream = fs.createReadStream(absolutePath, { start, end });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': file.mime_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`
      });

      const stream = fs.createReadStream(absolutePath);
      stream.pipe(res);
    }
  } catch (error) {
    console.error('[Files stream error]', error);
    return res.status(500).json({ error: 'Internal server error streaming file.' });
  }
}

export function getFileDetails(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = db.prepare(`
      SELECT f.*, u.name as owner_name, u.email as owner_email
      FROM files f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = ? AND (f.user_id = ? OR f.id IN (SELECT file_id FROM shares WHERE shared_with_email = ? OR is_public = 1))
    `).get(id, userId, req.user.email);

    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    return res.json({
      file: {
        ...file,
        category: getFileCategory(file.mime_type, file.name)
      }
    });
  } catch (error) {
    console.error('[Files getDetails error]', error);
    return res.status(500).json({ error: 'Internal server error fetching details.' });
  }
}

export function renameFile(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'File name cannot be empty.' });
    }

    const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ? AND is_trashed = 0').get(id, userId);
    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE files SET name = ?, updated_at = ? WHERE id = ?').run(name.trim(), now, id);

    const updated = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    return res.json({ file: { ...updated, category: getFileCategory(updated.mime_type, updated.name) } });
  } catch (error) {
    console.error('[Files rename error]', error);
    return res.status(500).json({ error: 'Internal server error renaming file.' });
  }
}

export function moveFile(req, res) {
  try {
    const { id } = req.params;
    const { target_parent_id } = req.body;
    const userId = req.user.id;
    const newParentId = (target_parent_id === 'root' || !target_parent_id || target_parent_id === 'null') ? null : target_parent_id;

    const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ? AND is_trashed = 0').get(id, userId);
    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    if (newParentId) {
      const parent = db.prepare('SELECT id, is_folder, is_trashed FROM files WHERE id = ? AND user_id = ?').get(newParentId, userId);
      if (!parent || !parent.is_folder || parent.is_trashed) {
        return res.status(400).json({ error: 'Destination folder does not exist or is trashed.' });
      }
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE files SET parent_id = ?, updated_at = ? WHERE id = ?').run(newParentId, now, id);

    const updated = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    return res.json({ file: { ...updated, category: getFileCategory(updated.mime_type, updated.name) } });
  } catch (error) {
    console.error('[Files move error]', error);
    return res.status(500).json({ error: 'Internal server error moving file.' });
  }
}

export function copyFile(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ? AND is_trashed = 0').get(id, userId);
    if (!file || file.is_folder) {
      return res.status(404).json({ error: 'File not found or cannot copy a folder directly.' });
    }

    const user = db.prepare('SELECT storage_used, storage_quota FROM users WHERE id = ?').get(userId);
    if (user.storage_used + file.size > user.storage_quota) {
      return res.status(413).json({ error: 'Storage quota exceeded.' });
    }

    const srcPath = path.resolve(UPLOADS_DIR, path.basename(file.storage_path));
    const ext = path.extname(file.name);
    const newDiskFilename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const destPath = path.join(UPLOADS_DIR, newDiskFilename);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    }

    const newFileId = crypto.randomUUID();
    const relativeStoragePath = path.relative(path.resolve(UPLOADS_DIR, '..'), destPath);
    const copyName = `Copy of ${file.name}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO files (id, user_id, parent_id, name, mime_type, size, is_folder, is_starred, is_trashed, storage_path, created_at, updated_at, last_accessed_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?)
    `).run(newFileId, userId, file.parent_id, copyName, file.mime_type, file.size, relativeStoragePath, now, now, now);

    db.prepare('UPDATE users SET storage_used = storage_used + ? WHERE id = ?').run(file.size, userId);

    const newRecord = db.prepare('SELECT * FROM files WHERE id = ?').get(newFileId);
    return res.status(201).json({ file: { ...newRecord, category: getFileCategory(newRecord.mime_type, newRecord.name) } });
  } catch (error) {
    console.error('[Files copy error]', error);
    return res.status(500).json({ error: 'Internal server error copying file.' });
  }
}

export function toggleStar(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = db.prepare('SELECT id, is_starred FROM files WHERE id = ? AND user_id = ?').get(id, userId);
    if (!file) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const newStarred = file.is_starred ? 0 : 1;
    db.prepare('UPDATE files SET is_starred = ? WHERE id = ?').run(newStarred, id);

    return res.json({ id, is_starred: newStarred });
  } catch (error) {
    console.error('[Files toggleStar error]', error);
    return res.status(500).json({ error: 'Internal server error updating star.' });
  }
}

export function trashFile(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = db.prepare('SELECT id, is_folder FROM files WHERE id = ? AND user_id = ?').get(id, userId);
    if (!file) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const now = new Date().toISOString();

    // Soft delete
    db.prepare('UPDATE files SET is_trashed = 1, trashed_at = ? WHERE id = ?').run(now, id);

    // If folder, also soft delete all sub-items
    if (file.is_folder) {
      function trashRecursively(folderId) {
        const subItems = db.prepare('SELECT id, is_folder FROM files WHERE user_id = ? AND parent_id = ?').all(userId, folderId);
        for (const item of subItems) {
          db.prepare('UPDATE files SET is_trashed = 1, trashed_at = ? WHERE id = ?').run(now, item.id);
          if (item.is_folder) trashRecursively(item.id);
        }
      }
      trashRecursively(id);
    }

    return res.json({ id, is_trashed: 1, message: 'Item moved to trash.' });
  } catch (error) {
    console.error('[Files trash error]', error);
    return res.status(500).json({ error: 'Internal server error moving to trash.' });
  }
}

export function restoreFile(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = db.prepare('SELECT id, is_folder, parent_id FROM files WHERE id = ? AND user_id = ?').get(id, userId);
    if (!file) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    // Check if parent folder is in trash; if so, restore to root
    if (file.parent_id) {
      const parent = db.prepare('SELECT is_trashed FROM files WHERE id = ? AND user_id = ?').get(file.parent_id, userId);
      if (!parent || parent.is_trashed) {
        db.prepare('UPDATE files SET parent_id = NULL WHERE id = ?').run(id);
      }
    }

    db.prepare('UPDATE files SET is_trashed = 0, trashed_at = NULL WHERE id = ?').run(id);

    if (file.is_folder) {
      function restoreRecursively(folderId) {
        const subItems = db.prepare('SELECT id, is_folder FROM files WHERE user_id = ? AND parent_id = ?').all(userId, folderId);
        for (const item of subItems) {
          db.prepare('UPDATE files SET is_trashed = 0, trashed_at = NULL WHERE id = ?').run(item.id);
          if (item.is_folder) restoreRecursively(item.id);
        }
      }
      restoreRecursively(id);
    }

    return res.json({ id, is_trashed: 0, message: 'Item restored.' });
  } catch (error) {
    console.error('[Files restore error]', error);
    return res.status(500).json({ error: 'Internal server error restoring item.' });
  }
}

export function deleteFilePermanent(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = db.prepare('SELECT id, is_folder, size, storage_path FROM files WHERE id = ? AND user_id = ?').get(id, userId);
    if (!file) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    let reclaimedBytes = 0;

    if (file.is_folder) {
      function purgeRecursively(folderId) {
        const items = db.prepare('SELECT id, is_folder, size, storage_path FROM files WHERE user_id = ? AND parent_id = ?').all(userId, folderId);
        for (const item of items) {
          if (item.is_folder) {
            purgeRecursively(item.id);
          } else {
            reclaimedBytes += item.size;
            if (item.storage_path) {
              const diskPath = path.resolve(UPLOADS_DIR, path.basename(item.storage_path));
              if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
            }
          }
          db.prepare('DELETE FROM files WHERE id = ?').run(item.id);
        }
      }
      purgeRecursively(id);
      db.prepare('DELETE FROM files WHERE id = ?').run(id);
    } else {
      reclaimedBytes += file.size;
      if (file.storage_path) {
        const diskPath = path.resolve(UPLOADS_DIR, path.basename(file.storage_path));
        if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
      }
      db.prepare('DELETE FROM files WHERE id = ?').run(id);
    }

    if (reclaimedBytes > 0) {
      db.prepare('UPDATE users SET storage_used = MAX(0, storage_used - ?) WHERE id = ?').run(reclaimedBytes, userId);
    }

    return res.json({ id, message: 'Permanently deleted.' });
  } catch (error) {
    console.error('[Files deletePermanent error]', error);
    return res.status(500).json({ error: 'Internal server error permanently deleting item.' });
  }
}

export function emptyTrash(req, res) {
  try {
    const userId = req.user.id;
    const trashedFiles = db.prepare('SELECT id, is_folder, size, storage_path FROM files WHERE user_id = ? AND is_trashed = 1').all(userId);

    let reclaimedBytes = 0;
    for (const item of trashedFiles) {
      if (!item.is_folder && item.storage_path) {
        reclaimedBytes += item.size;
        const diskPath = path.resolve(UPLOADS_DIR, path.basename(item.storage_path));
        if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
      }
    }

    db.prepare('DELETE FROM files WHERE user_id = ? AND is_trashed = 1').run(userId);
    if (reclaimedBytes > 0) {
      db.prepare('UPDATE users SET storage_used = MAX(0, storage_used - ?) WHERE id = ?').run(reclaimedBytes, userId);
    }

    return res.json({ message: 'Trash emptied successfully.', purgedCount: trashedFiles.length });
  } catch (error) {
    console.error('[Files emptyTrash error]', error);
    return res.status(500).json({ error: 'Internal server error emptying trash.' });
  }
}

export function searchFiles(req, res) {
  try {
    const userId = req.user.id;
    const {
      q = '',
      type = 'all',
      modified = 'all',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const conditions = ['f.user_id = ?', 'f.is_trashed = 0'];
    const params = [userId];

    if (q.trim()) {
      conditions.push('f.name LIKE ?');
      params.push(`%${q.trim()}%`);
    }

    if (modified === 'today') {
      conditions.push("f.updated_at >= datetime('now', 'start of day')");
    } else if (modified === '7days') {
      conditions.push("f.updated_at >= datetime('now', '-7 days')");
    } else if (modified === '30days') {
      conditions.push("f.updated_at >= datetime('now', '-30 days')");
    }

    const orderDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    let orderColumn = 'name';
    if (sortBy === 'modified') orderColumn = 'updated_at';
    if (sortBy === 'size') orderColumn = 'size';

    const sql = `
      SELECT f.*, u.name as owner_name, u.email as owner_email
      FROM files f
      JOIN users u ON f.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY f.${orderColumn} ${orderDirection}
    `;

    const items = db.prepare(sql).all(...params);

    const folders = items.filter(i => i.is_folder === 1);
    let files = items.filter(i => i.is_folder === 0).map(f => ({
      ...f,
      category: getFileCategory(f.mime_type, f.name)
    }));

    if (type && type !== 'all') {
      files = files.filter(f => f.category === type);
    }

    return res.json({ folders, files, totalMatches: folders.length + files.length });
  } catch (error) {
    console.error('[Files searchFiles error]', error);
    return res.status(500).json({ error: 'Internal server error searching files.' });
  }
}
