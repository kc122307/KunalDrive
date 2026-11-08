import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import archiver from 'archiver';
import { db } from '../config/database.js';
import { FOLDER_MIME_TYPE } from '../utils/fileTypes.js';
import { UPLOADS_DIR } from '../middleware/upload.js';

export function createFolder(req, res) {
  try {
    const { name, parent_id } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Folder name is required.' });
    }

    const folderName = name.trim();
    const parentId = parent_id || null;

    if (parentId) {
      const parent = db.prepare('SELECT id, is_folder, is_trashed FROM files WHERE id = ? AND user_id = ?').get(parentId, userId);
      if (!parent || !parent.is_folder || parent.is_trashed) {
        return res.status(404).json({ error: 'Parent folder does not exist or is trashed.' });
      }
    }

    // Check duplicate folder name in same parent
    const existing = db.prepare(`
      SELECT id FROM files
      WHERE user_id = ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))
        AND name = ? AND is_folder = 1 AND is_trashed = 0
    `).get(userId, parentId, parentId, folderName);

    if (existing) {
      return res.status(409).json({ error: 'A folder with this name already exists in this location.' });
    }

    const folderId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO files (id, user_id, parent_id, name, mime_type, size, is_folder, is_starred, is_trashed, created_at, updated_at, last_accessed_at)
      VALUES (?, ?, ?, ?, ?, 0, 1, 0, 0, ?, ?, ?)
    `).run(folderId, userId, parentId, folderName, FOLDER_MIME_TYPE, now, now, now);

    const folder = db.prepare('SELECT * FROM files WHERE id = ?').get(folderId);
    return res.status(201).json({ folder });
  } catch (error) {
    console.error('[Folder create error]', error);
    return res.status(500).json({ error: 'Internal server error creating folder.' });
  }
}

export function getBreadcrumbs(req, res) {
  try {
    const { folderId } = req.params;
    const userId = req.user.id;
    const crumbs = [];

    if (!folderId || folderId === 'root' || folderId === 'null') {
      return res.json({ breadcrumbs: [{ id: null, name: 'My Drive' }] });
    }

    let currentId = folderId;
    while (currentId) {
      const folder = db.prepare('SELECT id, name, parent_id FROM files WHERE id = ? AND user_id = ? AND is_folder = 1').get(currentId, userId);
      if (!folder) break;
      crumbs.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parent_id;
    }

    crumbs.unshift({ id: null, name: 'My Drive' });
    return res.json({ breadcrumbs: crumbs });
  } catch (error) {
    console.error('[Folder getBreadcrumbs error]', error);
    return res.status(500).json({ error: 'Internal server error getting breadcrumbs.' });
  }
}

export function getFolderTree(req, res) {
  try {
    const userId = req.user.id;
    const allFolders = db.prepare(`
      SELECT id, name, parent_id
      FROM files
      WHERE user_id = ? AND is_folder = 1 AND is_trashed = 0
      ORDER BY name ASC
    `).all(userId);

    function buildTree(parentId = null) {
      return allFolders
        .filter(f => f.parent_id === parentId)
        .map(f => ({
          ...f,
          children: buildTree(f.id)
        }));
    }

    return res.json({
      tree: {
        id: null,
        name: 'My Drive',
        children: buildTree(null)
      }
    });
  } catch (error) {
    console.error('[Folder getFolderTree error]', error);
    return res.status(500).json({ error: 'Internal server error building folder tree.' });
  }
}

export function renameFolder(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Folder name cannot be empty.' });
    }

    const folder = db.prepare('SELECT id, parent_id FROM files WHERE id = ? AND user_id = ? AND is_folder = 1 AND is_trashed = 0').get(id, userId);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found.' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE files SET name = ?, updated_at = ? WHERE id = ?').run(name.trim(), now, id);

    const updated = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    return res.json({ folder: updated });
  } catch (error) {
    console.error('[Folder rename error]', error);
    return res.status(500).json({ error: 'Internal server error renaming folder.' });
  }
}

export function moveFolder(req, res) {
  try {
    const { id } = req.params;
    const { target_parent_id } = req.body;
    const userId = req.user.id;
    const newParentId = target_parent_id || null;

    if (id === newParentId) {
      return res.status(400).json({ error: 'Cannot move folder into itself.' });
    }

    const folder = db.prepare('SELECT id, parent_id FROM files WHERE id = ? AND user_id = ? AND is_folder = 1 AND is_trashed = 0').get(id, userId);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found.' });
    }

    // Cycle detection: ensure newParentId is not a descendant of id
    if (newParentId) {
      let checkId = newParentId;
      while (checkId) {
        if (checkId === id) {
          return res.status(400).json({ error: 'Cannot move folder into its own subfolder.' });
        }
        const parentRecord = db.prepare('SELECT parent_id FROM files WHERE id = ? AND user_id = ?').get(checkId, userId);
        checkId = parentRecord?.parent_id;
      }
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE files SET parent_id = ?, updated_at = ? WHERE id = ?').run(newParentId, now, id);

    const updated = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    return res.json({ folder: updated });
  } catch (error) {
    console.error('[Folder move error]', error);
    return res.status(500).json({ error: 'Internal server error moving folder.' });
  }
}

export function downloadFolderZip(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const folder = db.prepare('SELECT id, name FROM files WHERE id = ? AND user_id = ? AND is_folder = 1 AND is_trashed = 0').get(id, userId);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found.' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(folder.name)}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('[Zip Archive Error]', err);
      if (!res.headersSent) {
        res.status(500).send({ error: 'Error generating zip archive.' });
      }
    });

    archive.pipe(res);

    function addFolderRecursively(currentFolderId, currentPath = '') {
      const items = db.prepare(`
        SELECT id, name, is_folder, storage_path
        FROM files
        WHERE user_id = ? AND parent_id = ? AND is_trashed = 0
      `).all(userId, currentFolderId);

      for (const item of items) {
        const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        if (item.is_folder) {
          addFolderRecursively(item.id, itemPath);
        } else if (item.storage_path) {
          const absolutePath = path.resolve(UPLOADS_DIR, path.basename(item.storage_path));
          if (fs.existsSync(absolutePath)) {
            archive.file(absolutePath, { name: itemPath });
          }
        }
      }
    }

    addFolderRecursively(folder.id, folder.name);
    archive.finalize();
  } catch (error) {
    console.error('[Folder downloadZip error]', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error generating folder zip.' });
    }
  }
}
