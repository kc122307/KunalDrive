import React, { useState, useEffect } from 'react';
import { X, FolderInput, Folder, ChevronRight, ChevronDown, HardDrive } from 'lucide-react';
import { useDriveStore } from '../../store/useDriveStore';
import { api } from '../../api/client';
import { FolderNode } from '../../types/drive';

export const MoveModal: React.FC = () => {
  const { activeModal, modalTargetItem, closeModal, fetchItems } = useDriveStore();
  const [tree, setTree] = useState<FolderNode | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeModal === 'move') {
      setIsLoading(true);
      api
        .get('/folders/tree')
        .then((res) => {
          setTree(res.data.tree);
          setSelectedFolderId(null);
        })
        .catch((err) => {
          setError('Failed to load folder tree.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [activeModal]);

  if (activeModal !== 'move' || !modalTargetItem) return null;

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleMove = async () => {
    setIsMoving(true);
    setError(null);

    try {
      const endpoint = modalTargetItem.is_folder
        ? `/folders/${modalTargetItem.id}/move`
        : `/files/${modalTargetItem.id}/move`;

      await api.patch(endpoint, { target_parent_id: selectedFolderId });
      fetchItems();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to move item.');
    } finally {
      setIsMoving(false);
    }
  };

  const renderNode = (node: FolderNode) => {
    // Cannot move a folder into itself
    if (modalTargetItem.is_folder && node.id === modalTargetItem.id) {
      return null;
    }

    const isSelected = selectedFolderId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = node.id ? expandedIds.includes(node.id) : true;

    return (
      <div key={node.id || 'root'} className="pl-3">
        <div
          onClick={() => setSelectedFolderId(node.id)}
          className={`flex items-center gap-2 py-1.5 px-2.5 rounded-xl cursor-pointer text-sm transition-colors ${
            isSelected
              ? 'bg-[#c2e7ff] text-[#001d35] font-medium'
              : 'hover:bg-gray-100 text-[#1f1f1f]'
          }`}
        >
          {hasChildren ? (
            <button
              onClick={(e) => node.id && toggleExpand(node.id, e)}
              className="p-0.5 hover:bg-black/5 rounded text-gray-400"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {node.id === null ? (
            <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
          )}

          <span className="truncate">{node.name}</span>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-gray-200/80 ml-2">
            {node.children!.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 animate-slide-up flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <FolderInput className="w-5 h-5 text-[#1a73e8]" />
            <h3 className="text-lg font-medium text-[#1f1f1f]">
              Move "{modalTargetItem.name}"
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tree container */}
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-2xl p-3 min-h-[220px] max-h-72">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading folders...</div>
          ) : tree ? (
            renderNode(tree)
          ) : (
            <div className="p-8 text-center text-sm text-gray-400">No folders available.</div>
          )}
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-full hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={isMoving}
            className="px-5 py-2 bg-[#0b57d0] hover:bg-[#0842a0] disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-full shadow-sm transition-colors"
          >
            {isMoving ? 'Moving...' : 'Move here'}
          </button>
        </div>
      </div>
    </div>
  );
};
