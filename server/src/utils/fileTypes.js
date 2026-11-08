import path from 'node:path';
import mime from 'mime-types';

export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export function getFileCategory(mimeType, filename = '') {
  if (mimeType === FOLDER_MIME_TYPE) return 'folder';

  const ext = path.extname(filename).toLowerCase().replace('.', '');

  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    return 'image';
  }
  if (mimeType?.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'].includes(ext)) {
    return 'video';
  }
  if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
    return 'audio';
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (
    ['xls', 'xlsx', 'csv', 'tsv', 'ods'].includes(ext) ||
    mimeType?.includes('spreadsheet') ||
    mimeType?.includes('excel') ||
    mimeType === 'text/csv'
  ) {
    return 'spreadsheet';
  }
  if (
    ['ppt', 'pptx', 'odp'].includes(ext) ||
    mimeType?.includes('presentation') ||
    mimeType?.includes('powerpoint')
  ) {
    return 'presentation';
  }
  if (
    ['doc', 'docx', 'odt', 'rtf'].includes(ext) ||
    mimeType?.includes('wordprocessing') ||
    mimeType?.includes('msword')
  ) {
    return 'document';
  }
  if (
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) ||
    mimeType?.includes('zip') ||
    mimeType?.includes('compressed') ||
    mimeType?.includes('archive')
  ) {
    return 'archive';
  }
  if (
    [
      'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java',
      'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'sh', 'sql', 'md', 'txt', 'yml', 'yaml'
    ].includes(ext) ||
    mimeType?.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/javascript'
  ) {
    return 'code';
  }

  return 'other';
}

export function detectMimeType(filename, defaultMime = 'application/octet-stream') {
  return mime.lookup(filename) || defaultMime;
}

