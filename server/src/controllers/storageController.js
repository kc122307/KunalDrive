import { db } from '../config/database.js';
import { getFileCategory } from '../utils/fileTypes.js';

export function getStorageSummary(req, res) {
  try {
    const userId = req.user.id;
    const user = db.prepare('SELECT storage_used, storage_quota FROM users WHERE id = ?').get(userId);

    const allFiles = db.prepare(`
      SELECT id, name, mime_type, size, is_folder, updated_at
      FROM files
      WHERE user_id = ? AND is_trashed = 0
    `).all(userId);

    const breakdown = {
      image: 0,
      video: 0,
      audio: 0,
      pdf: 0,
      document: 0,
      spreadsheet: 0,
      presentation: 0,
      archive: 0,
      code: 0,
      other: 0
    };

    let totalFileCount = 0;
    let totalFolderCount = 0;

    for (const item of allFiles) {
      if (item.is_folder) {
        totalFolderCount++;
      } else {
        totalFileCount++;
        const cat = getFileCategory(item.mime_type, item.name);
        if (breakdown[cat] !== undefined) {
          breakdown[cat] += item.size;
        } else {
          breakdown.other += item.size;
        }
      }
    }

    // Largest files
    const largestFiles = db.prepare(`
      SELECT id, name, mime_type, size, created_at, updated_at
      FROM files
      WHERE user_id = ? AND is_folder = 0 AND is_trashed = 0
      ORDER BY size DESC
      LIMIT 10
    `).all(userId).map(f => ({
      ...f,
      category: getFileCategory(f.mime_type, f.name)
    }));

    const used = user.storage_used || 0;
    const quota = user.storage_quota || 16106127360; // 15 GB
    const percentage = Math.min(100, (used / quota) * 100);

    return res.json({
      used,
      quota,
      percentage: Math.round(percentage * 10) / 10,
      breakdown,
      totalFileCount,
      totalFolderCount,
      largestFiles
    });
  } catch (error) {
    console.error('[Storage summary error]', error);
    return res.status(500).json({ error: 'Internal server error computing storage summary.' });
  }
}

