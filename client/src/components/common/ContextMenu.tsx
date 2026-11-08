import React, { useEffect, useRef } from 'react';
import {
  Eye,
  Download,
  Edit2,
  Copy,
  FolderInput,
  Star,
  Share2,
  Trash2,
  RotateCcw,
  Info
} from 'lucide-react';
import { FileItem } from '../../types/drive';
import { useDriveStore } from '../../store/useDriveStore';
import { api } from '../../api/client';

interface ContextMenuProps {
  x: number;
  y: number;
  item: FileItem;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, item, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    currentView,
    toggleStar,
    trashSingle,
    restoreItem,
    deletePermanent,
    openModal,
    toggleDetails
  } = useDriveStore();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust coordinates if menu would overflow screen
  const menuWidth = 220;
  const menuHeight = 320;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    if (item.is_folder) {
      window.open(`/api/folders/${item.id}/download-zip?token=${token}`, '_blank');
    } else {
      window.open(`/api/files/${item.id}/download?token=${token}`, '_blank');
    }
    onClose();
  };

  const isTrash = currentView === 'trash' || item.is_trashed === 1;

  return (
    <div
      ref={menuRef}
      style={{ left: adjustedX, top: adjustedY }}
      className="fixed z-50 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 text-sm text-[#1f1f1f] animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      {isTrash ? (
        <>
          <button
            onClick={() => {
              restoreItem(item.id);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-left"
          >
            <RotateCcw className="w-4 h-4 text-blue-600" />
            <span>Restore</span>
          </button>
          <button
            onClick={() => {
              deletePermanent(item.id);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 text-left"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Delete forever</span>
          </button>
        </>
      ) : (
        <>
          {!item.is_folder && (
            <button
              onClick={() => {
                openModal('preview', item);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-left"
            >
              <Eye className="w-4 h-4 text-gray-600" />
              <span>Preview</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-left"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span>{item.is_folder ? 'Download (ZIP)' : 'Download'}</span>
          </button>

          <button
            onClick={() => {
              openModal('rename', item);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-left"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
            <span>Rename</span>
          </button>

          {!item.is_folder && (
            <button
              onClick={async () => {
                try {
                  await api.post(`/files/${item.id}/copy`);
                  useDriveStore.getState().fetchItems();
                } catch (e) {
                  console.error(e);
                }
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-left"
            >
              <Copy className="w-4 h-4 text-gray-600" />
              <span>Make a copy</span>
            </button>
          )}

          <button
            onClick={() => {
              openModal('move', item);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-left"
          >
            <FolderInput className="w-4 h-4 text-gray-600" />
            <span>Organize / Move</span>
          </button>

          <button
            onClick={() => {
              toggleStar(item.id);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-left"
          >
            <Star
              className={`w-4 h-4 ${
                item.is_starred ? 'text-amber-500 fill-amber-500' : 'text-gray-600'
              }`}
            />
            <span>{item.is_starred ? 'Remove from Starred' : 'Add to Starred'}</span>
          </button>

          <button
            onClick={() => {
              openModal('share', item);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-left"
          >
            <Share2 className="w-4 h-4 text-gray-600" />
            <span>Share</span>
          </button>

          <div className="my-1 border-t border-gray-100" />

          <button
            onClick={() => {
              toggleDetails();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#f0f4f9] text-left"
          >
            <Info className="w-4 h-4 text-gray-600" />
            <span>File information</span>
          </button>

          <button
            onClick={() => {
              trashSingle(item.id);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 text-left"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Move to trash</span>
          </button>
        </>
      )}
    </div>
  );
};
