import React, { useState } from 'react';
import { Folder, MoreVertical, Star } from 'lucide-react';
import { FileItem } from '../../types/drive';
import { useDriveStore } from '../../store/useDriveStore';
import { ContextMenu } from '../common/ContextMenu';

interface FolderCardProps {
  folder: FileItem;
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder }) => {
  const {
    selectedIds,
    toggleSelect,
    setCurrentFolder,
    toggleStar
  } = useDriveStore();

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const isSelected = selectedIds.includes(folder.id);

  const handleDoubleClick = () => {
    setCurrentFolder(folder.id);
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
        onClick={(e) => toggleSelect(folder.id, e.ctrlKey || e.metaKey || e.shiftKey)}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
          isSelected
            ? 'bg-[#c2e7ff] border-[#0b57d0]/40 text-[#001d35] shadow-sm'
            : 'bg-[#f0f4f9] hover:bg-[#e9eef6] border-transparent text-[#1f1f1f]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <Folder className="w-5 h-5 text-[#5f6368] fill-[#5f6368]/20 shrink-0" />
          <span className="text-sm font-medium truncate" title={folder.name}>
            {folder.name}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStar(folder.id);
            }}
            className="p-1 rounded-full hover:bg-black/5 text-gray-500 hover:text-amber-500"
            title={folder.is_starred ? 'Starred' : 'Add to Starred'}
          >
            <Star
              className={`w-4 h-4 ${
                folder.is_starred ? 'text-amber-500 fill-amber-500 opacity-100' : ''
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

        {folder.is_starred && !isSelected && (
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 absolute top-2 right-2 group-hover:hidden" />
        )}
      </div>

      {contextMenuPos && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          item={folder}
          onClose={() => setContextMenuPos(null)}
        />
      )}
    </>
  );
};
