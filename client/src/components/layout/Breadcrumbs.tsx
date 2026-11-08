import React from 'react';
import {
  ChevronRight,
  LayoutGrid,
  List,
  Info,
  Trash2,
  Download,
  FolderInput,
  Star,
  X,
  RotateCcw
} from 'lucide-react';
import { useDriveStore } from '../../store/useDriveStore';

export const Breadcrumbs: React.FC = () => {
  const {
    breadcrumbs,
    currentView,
    layoutMode,
    setLayoutMode,
    isDetailsOpen,
    toggleDetails,
    setCurrentFolder,
    selectedIds,
    clearSelection,
    trashSelected,
    emptyTrash,
    openModal,
    selectedItem
  } = useDriveStore();

  const getViewTitle = () => {
    switch (currentView) {
      case 'shared':
        return 'Shared with me';
      case 'recent':
        return 'Recent';
      case 'starred':
        return 'Starred';
      case 'trash':
        return 'Trash';
      default:
        return null;
    }
  };

  const viewTitle = getViewTitle();
  const hasSelection = selectedIds.length > 0;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200/80 bg-white select-none min-h-[56px]">
      {hasSelection ? (
        /* Contextual selection action bar */
        <div className="flex items-center justify-between w-full animate-fade-in">
          <div className="flex items-center gap-4">
            <button
              onClick={clearSelection}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Clear selection"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-[#1f1f1f]">
              {selectedIds.length} selected
            </span>
          </div>

          <div className="flex items-center gap-1">
            {selectedIds.length === 1 && selectedItem && (
              <>
                <button
                  onClick={() => openModal('move', selectedItem)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Move to"
                >
                  <FolderInput className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openModal('share', selectedItem)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Share"
                >
                  <Star className="w-5 h-5" />
                </button>
              </>
            )}

            <button
              onClick={async () => {
                const token = localStorage.getItem('token');
                if (selectedIds.length === 1 && selectedItem) {
                  if (selectedItem.is_folder) {
                    window.open(`/api/folders/${selectedItem.id}/download-zip?token=${token}`, '_blank');
                  } else {
                    window.open(`/api/files/${selectedItem.id}/download?token=${token}`, '_blank');
                  }
                } else if (selectedIds.length > 1) {
                  try {
                    const response = await fetch('/api/files/download-batch', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ ids: selectedIds })
                    });
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Drive_Selected_${selectedIds.length}_Items.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  } catch (e) {
                    console.error('Batch download error', e);
                  }
                }
              }}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              title={selectedIds.length > 1 ? `Download ${selectedIds.length} items (ZIP)` : 'Download'}
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={trashSelected}
              className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* Normal Breadcrumbs / Navigation Path */
        <>
          <div className="flex items-center gap-1.5 overflow-x-auto text-lg font-normal text-[#1f1f1f]">
            {viewTitle ? (
              <div className="flex items-center gap-4">
                <span className="font-medium text-xl">{viewTitle}</span>
                {currentView === 'trash' && (
                  <button
                    onClick={emptyTrash}
                    className="px-4 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 text-xs font-medium text-red-600 transition-colors"
                  >
                    Empty trash
                  </button>
                )}
              </div>
            ) : (
              breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.id || 'root'}>
                    {index > 0 && (
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <button
                      onClick={() => !isLast && setCurrentFolder(crumb.id)}
                      className={`px-2 py-1 rounded-lg transition-colors truncate max-w-xs ${
                        isLast
                          ? 'font-medium text-xl text-[#1f1f1f] cursor-default'
                          : 'text-[#444746] hover:bg-gray-100 hover:text-[#1f1f1f]'
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Right layout toggles */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center border border-gray-200 rounded-full p-0.5 bg-gray-50">
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 rounded-full transition-colors ${
                  layoutMode === 'list'
                    ? 'bg-white text-[#0b57d0] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-full transition-colors ${
                  layoutMode === 'grid'
                    ? 'bg-white text-[#0b57d0] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={toggleDetails}
              className={`p-2 rounded-full transition-colors ml-1 ${
                isDetailsOpen
                  ? 'bg-[#c2e7ff] text-[#001d35]'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              title="View details"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

