import React, { useState } from 'react';
import {
  MoreVertical,
  Star,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { FileItem } from '../../types/drive';
import { useDriveStore } from '../../store/useDriveStore';
import { getFileCategoryIcon } from '../../utils/icons';
import { formatBytes, formatDate } from '../../utils/formatters';
import { ContextMenu } from '../common/ContextMenu';

export const FileList: React.FC = () => {
  const {
    folders,
    files,
    selectedIds,
    toggleSelect,
    setCurrentFolder,
    openModal,
    toggleStar,
    sortBy,
    sortOrder,
    setSort
  } = useDriveStore();

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number; item: FileItem } | null>(null);

  const allItems = [...folders, ...files];

  const handleRowDoubleClick = (item: FileItem) => {
    if (item.is_folder) {
      setCurrentFolder(item.id);
    } else {
      openModal('preview', item);
    }
  };

  const handleRowContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY, item });
  };

  const handleMoreClick = (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPos({ x: rect.left, y: rect.bottom + 4, item });
  };

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm select-none border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs text-[#5f6368] font-medium">
              <th
                onClick={() => setSort('name')}
                className="py-3 px-4 font-medium cursor-pointer hover:bg-gray-100/60 rounded-l-lg transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Name</span>
                  {sortBy === 'name' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 font-medium hidden md:table-cell">Owner</th>
              <th
                onClick={() => setSort('modified')}
                className="py-3 px-4 font-medium cursor-pointer hover:bg-gray-100/60 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Last modified</span>
                  {sortBy === 'modified' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>
              </th>
              <th
                onClick={() => setSort('size')}
                className="py-3 px-4 font-medium cursor-pointer hover:bg-gray-100/60 transition-colors hidden sm:table-cell"
              >
                <div className="flex items-center gap-1.5">
                  <span>File size</span>
                  {sortBy === 'size' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 font-medium text-right rounded-r-lg w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <tr
                  key={item.id}
                  onClick={(e) => toggleSelect(item.id, e.ctrlKey || e.metaKey || e.shiftKey)}
                  onDoubleClick={() => handleRowDoubleClick(item)}
                  onContextMenu={(e) => handleRowContextMenu(e, item)}
                  className={`group transition-colors duration-75 cursor-pointer ${
                    isSelected
                      ? 'bg-[#c2e7ff] text-[#001d35]'
                      : 'hover:bg-[#f0f4f9] text-[#1f1f1f]'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {getFileCategoryIcon(item.category, 'w-5 h-5 shrink-0')}
                      <span className="font-medium truncate max-w-xs md:max-w-md" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#5f6368] hidden md:table-cell text-xs">
                    {item.owner_name || 'me'}
                  </td>
                  <td className="py-3 px-4 text-[#5f6368] text-xs">
                    {formatDate(item.updated_at)}
                  </td>
                  <td className="py-3 px-4 text-[#5f6368] text-xs hidden sm:table-cell">
                    {item.is_folder ? '—' : formatBytes(item.size)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(item.id);
                        }}
                        className="p-1 rounded-full hover:bg-black/5 text-gray-500 hover:text-amber-500"
                        title={item.is_starred ? 'Starred' : 'Add to Starred'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            item.is_starred ? 'text-amber-500 fill-amber-500 opacity-100' : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => handleMoreClick(e, item)}
                        className="p-1 rounded-full hover:bg-black/5 text-gray-500 hover:text-gray-800"
                        title="More actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {contextMenuPos && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          item={contextMenuPos.item}
          onClose={() => setContextMenuPos(null)}
        />
      )}
    </>
  );
};
