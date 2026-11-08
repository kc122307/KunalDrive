import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useDriveStore } from '../../store/useDriveStore';
import { api } from '../../api/client';

export const CreateFolderModal: React.FC = () => {
  const { activeModal, closeModal, currentFolder, fetchItems } = useDriveStore();
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (activeModal !== 'create-folder') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.post('/folders', {
        name: folderName.trim(),
        parent_id: currentFolder?.id || null
      });
      fetchItems();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create folder.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-5 h-5 text-[#1a73e8]" />
            <h3 className="text-lg font-medium text-[#1f1f1f]">New folder</h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            autoFocus
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Untitled folder"
            className="w-full px-4 py-2.5 rounded-xl border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm mb-4"
          />

          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-full hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !folderName.trim()}
              className="px-5 py-2 bg-[#0b57d0] hover:bg-[#0842a0] disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-full shadow-sm transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
