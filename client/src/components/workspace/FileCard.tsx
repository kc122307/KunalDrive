import React, { useState } from 'react';
import { MoreVertical, Star, Play } from 'lucide-react';
import { FileItem } from '../../types/drive';
import { useDriveStore } from '../../store/useDriveStore';
import { getFileCategoryIcon } from '../../utils/icons';
import { formatBytes } from '../../utils/formatters';
import { ContextMenu } from '../common/ContextMenu';

interface FileCardProps {
  file: FileItem;
}

export const FileCard: React.FC<FileCardProps> = ({ file }) => {
  const {
    selectedIds,
    toggleSelect,
    openModal,
    toggleStar
  } = useDriveStore();

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const isSelected = selectedIds.includes(file.id);
  const token = localStorage.getItem('token');
  const streamUrl = `/api/files/${file.id}/stream?token=${token}`;

  const handleDoubleClick = () => {
    openModal('preview', file);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPos({ x: rect.left, y: rect.bottom + 4 });
  };

  return (
    <>
      <div
        onClick={(e) => toggleSelect(file.id, e.ctrlKey || e.metaKey || e.shiftKey)}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className={`group relative flex flex-col rounded-2xl border transition-all duration-150 cursor-pointer overflow-hidden select-none ${
          isSelected
            ? 'bg-[#c2e7ff] border-[#0b57d0]/40 shadow-sm'
            : 'bg-[#f0f4f9] hover:bg-[#e9eef6] border-transparent'
        }`}
      >
        {/* Header: Name and Menu */}
        <div className="flex items-center justify-between p-3.5 pb-2">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {getFileCategoryIcon(file.category, 'w-5 h-5 shrink-0')}
            <span className="text-sm font-medium text-[#1f1f1f] truncate" title={file.name}>
              {file.name}
            </span>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleStar(file.id);
              }}
              className="p-1 rounded-full hover:bg-black/5 text-gray-500 hover:text-amber-500"
              title={file.is_starred ? 'Starred' : 'Add to Starred'}
            >
              <Star
                className={`w-4 h-4 ${
                  file.is_starred ? 'text-amber-500 fill-amber-500 opacity-100' : ''
                }`}
              />
            </button>
            <button
              onClick={handleMoreClick}
              className="p-1 rounded-full hover:bg-black/5 text-gray-500 hover:text-gray-800"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {file.is_starred && !isSelected && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 absolute top-3.5 right-3 group-hover:hidden" />
          )}
        </div>

        {/* Thumbnail preview container */}
        <div className="px-3 pb-3">
          <div className="w-full h-36 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 relative group-hover:shadow-inner">
            {file.category === 'image' ? (
              <img
                src={streamUrl}
                alt={file.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  // Fallback to icon
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : file.category === 'video' ? (
              <div className="relative w-full h-full bg-black/5 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center text-red-600">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <div className="p-3 bg-gray-50 rounded-2xl mb-2">
                  {getFileCategoryIcon(file.category, 'w-8 h-8')}
                </div>
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                  {file.category}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer info: File size */}
        <div className="px-3.5 pb-2.5 flex items-center justify-between text-[11px] text-[#5f6368]">
          <span>{formatBytes(file.size)}</span>
        </div>
      </div>

      {contextMenuPos && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          item={file}
          onClose={() => setContextMenuPos(null)}
        />
      )}
    </>
  );
};
