import crypto from 'node:crypto';
import { db } from '../config/database.js';
import { getFileCategory } from '../utils/fileTypes.js';

export function createShare(req, res) {
  try {
    const { file_id, permission = 'viewer', shared_with_email, is_public = 1 } = req.body;
    const userId = req.user.id;

    if (!file_id) {
      return res.status(400).json({ error: 'file_id is required.' });
    }

    const file = db.prepare('SELECT id, name, user_id FROM files WHERE id = ?').get(file_id);
    if (!file) {
      return res.status(404).json({ error: 'File or folder not found.' });
    }

    if (file.user_id !== userId) {
      return res.status(403).json({ error: 'Only the owner can create shares.' });
    }

    // Check if a share token already exists
    let share = db.prepare('SELECT * FROM shares WHERE file_id = ? AND shared_by = ?').get(file_id, userId);

    if (share) {
      db.prepare('UPDATE shares SET permission = ?, shared_with_email = ?, is_public = ? WHERE id = ?')
        .run(permission, shared_with_email || null, is_public ? 1 : 0, share.id);
      share = db.prepare('SELECT * FROM shares WHERE id = ?').get(share.id);
    } else {
      const shareId = crypto.randomUUID();
      const token = crypto.randomBytes(16).toString('hex');
      db.prepare(`
        INSERT INTO shares (id, file_id, shared_by, shared_with_email, token, permission, is_public)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(shareId, file_id, userId, shared_with_email || null, token, permission, is_public ? 1 : 0);
      share = db.prepare('SELECT * FROM shares WHERE id = ?').get(shareId);
    }

    const shareUrl = `${req.protocol}://${req.get('host')}/shared/${share.token}`;
    return res.status(201).json({ share, shareUrl });
  } catch (error) {
    console.error('[Share create error]', error);
    return res.status(500).json({ error: 'Internal server error creating share.' });
  }
}

export function getSharesForFile(req, res) {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const shares = db.prepare(`
      SELECT s.*, u.name as shared_by_name, u.email as shared_by_email
      FROM shares s
      JOIN users u ON s.shared_by = u.id
      WHERE s.file_id = ? AND s.shared_by = ?
    `).all(fileId, userId);

    return res.json({ shares });
  } catch (error) {
    console.error('[Share getShares error]', error);
    return res.status(500).json({ error: 'Internal server error fetching shares.' });
  }
}

export function revokeShare(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const share = db.prepare('SELECT id, shared_by FROM shares WHERE id = ?').get(id);
    if (!share) {
      return res.status(404).json({ error: 'Share record not found.' });
    }

    if (share.shared_by !== userId) {
      return res.status(403).json({ error: 'Unauthorized to revoke this share.' });
    }

    db.prepare('DELETE FROM shares WHERE id = ?').run(id);
    return res.json({ message: 'Share link revoked successfully.' });
  } catch (error) {
    console.error('[Share revoke error]', error);
    return res.status(500).json({ error: 'Internal server error revoking share.' });
  }
}

export function getSharedItemByToken(req, res) {
  try {
    const { token } = req.params;

    const share = db.prepare(`
      SELECT s.*, u.name as owner_name, u.email as owner_email
      FROM shares s
      JOIN users u ON s.shared_by = u.id
      WHERE s.token = ?
    `).get(token);

    if (!share) {
      return res.status(404).json({ error: 'Share link is invalid or has expired.' });
    }

    const file = db.prepare('SELECT * FROM files WHERE id = ? AND is_trashed = 0').get(share.file_id);
    if (!file) {
      return res.status(404).json({ error: 'The shared file or folder is no longer available.' });
    }

    let subItems = [];
    if (file.is_folder) {
      subItems = db.prepare(`
        SELECT * FROM files
        WHERE parent_id = ? AND is_trashed = 0
        ORDER BY is_folder DESC, name ASC
      `).all(file.id).map(item => ({
        ...item,
        category: getFileCategory(item.mime_type, item.name)
      }));
    }

    return res.json({
      file: {
        ...file,
        category: getFileCategory(file.mime_type, file.name)
      },
      share: {
        permission: share.permission,
        token: share.token,
        owner_name: share.owner_name,
        owner_email: share.owner_email,
        created_at: share.created_at
      },
      subItems
    });
  } catch (error) {
    console.error('[Share getSharedItemByToken error]', error);
    return res.status(500).json({ error: 'Internal server error retrieving shared item.' });
  }
}

