import React from 'react';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  File as FileGeneric,
  Presentation
} from 'lucide-react';
import { FileCategory } from '../types/drive';

export function getFileCategoryIcon(category: FileCategory, className = 'w-5 h-5') {
  switch (category) {
    case 'folder':
      return <Folder className={`${className} text-[#5f6368] fill-[#5f6368]/20`} />;
    case 'image':
      return <ImageIcon className={`${className} text-[#ea4335]`} />;
    case 'video':
      return <Video className={`${className} text-[#ea4335]`} />;
    case 'audio':
      return <Music className={`${className} text-[#f29900]`} />;
    case 'pdf':
      return <FileText className={`${className} text-[#ea4335]`} />;
    case 'document':
      return <FileText className={`${className} text-[#4285f4]`} />;
    case 'spreadsheet':
      return <FileSpreadsheet className={`${className} text-[#0f9d58]`} />;
    case 'presentation':
      return <Presentation className={`${className} text-[#f4b400]`} />;
    case 'code':
      return <FileCode className={`${className} text-[#0b57d0]`} />;
    case 'archive':
      return <FileArchive className={`${className} text-[#757575]`} />;
    default:
      return <FileGeneric className={`${className} text-[#5f6368]`} />;
  }
}
