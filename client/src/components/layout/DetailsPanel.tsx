import React from 'react';
import { X, HardDrive } from 'lucide-react';
import { useDriveStore } from '../../store/useDriveStore';
import { getFileCategoryIcon } from '../../utils/icons';
import { formatBytes, formatDate } from '../../utils/formatters';

export const DetailsPanel: React.FC = () => {
  const { isDetailsOpen, toggleDetails, selectedItem, currentFolder } = useDriveStore();

  if (!isDetailsOpen) return null;

  const item = selectedItem || currentFolder;
  const token = localStorage.getItem('token');

  return (
    <aside className="w-80 shrink-0 border-l border-gray-200/80 bg-white flex flex-col h-full overflow-hidden select-none animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-medium text-base text-[#1f1f1f] truncate pr-2">
          {item ? item.name : 'My Drive'}
        </h3>
        <button
          onClick={toggleDetails}
          className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {item ? (
          <>
            {/* Preview Box */}
            <div className="w-full h-44 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden">
              {item.category === 'image' ? (
                <img
                  src={`/api/files/${item.id}/stream?token=${token}`}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  {getFileCategoryIcon(item.category, 'w-14 h-14')}
                  <span className="text-xs text-gray-400 uppercase font-medium">
                    {item.category}
                  </span>
                </div>
              )}
            </div>

            {/* General Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                File details
              </h4>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-[#5f6368] block">Type</span>
                  <span className="font-medium text-[#1f1f1f] capitalize">
                    {item.is_folder ? 'Folder' : item.mime_type || item.category}
                  </span>
                </div>

                {!item.is_folder && (
                  <div>
                    <span className="text-xs text-[#5f6368] block">Size</span>
                    <span className="font-medium text-[#1f1f1f]">
                      {formatBytes(item.size)}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-xs text-[#5f6368] block">Storage used</span>
                  <span className="font-medium text-[#1f1f1f]">
                    {item.is_folder ? '—' : formatBytes(item.size)}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-[#5f6368] block">Owner</span>
                  <span className="font-medium text-[#1f1f1f]">
                    {item.owner_name || 'me'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-[#5f6368] block">Modified</span>
                  <span className="font-medium text-[#1f1f1f]">
                    {formatDate(item.updated_at)}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-[#5f6368] block">Created</span>
                  <span className="font-medium text-[#1f1f1f]">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <HardDrive className="w-12 h-12 mb-3 stroke-1 text-gray-300" />
            <p className="text-sm">Select an item to view its details</p>
          </div>
        )}
      </div>
    </aside>
  );
};

