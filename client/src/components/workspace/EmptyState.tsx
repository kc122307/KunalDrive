import React from 'react';
import {
  FolderPlus,
  Star,
  Trash2,
  Users,
  Search,
  UploadCloud
} from 'lucide-react';
import { useDriveStore } from '../../store/useDriveStore';
import { useUploadStore } from '../../store/useUploadStore';

export const EmptyState: React.FC = () => {
  const { currentView, isSearching, openModal, currentFolder } = useDriveStore();
  const { addFilesToQueue } = useUploadStore();

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        addFilesToQueue(files, currentFolder?.id);
      }
    };
    input.click();
  };

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-[#f0f4f9] flex items-center justify-center text-[#5f6368] mb-4">
          <Search className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-medium text-[#1f1f1f] mb-1">No matching results</h3>
        <p className="text-sm text-[#5f6368] max-w-sm">
          Try adjusting your search terms or clearing your filters to find what you're looking for.
        </p>
      </div>
    );
  }

  if (currentView === 'starred') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-4">
          <Star className="w-10 h-10 fill-amber-500/20" />
        </div>
        <h3 className="text-lg font-medium text-[#1f1f1f] mb-1">No starred files</h3>
        <p className="text-sm text-[#5f6368] max-w-sm">
          Add stars to things that you want to easily find later.
        </p>
      </div>
    );
  }

  if (currentView === 'trash') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-[#5f6368] mb-4">
          <Trash2 className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-medium text-[#1f1f1f] mb-1">Trash is empty</h3>
        <p className="text-sm text-[#5f6368] max-w-sm">
          Items in trash are deleted forever after 30 days or when you empty the trash.
        </p>
      </div>
    );
  }

  if (currentView === 'shared') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-[#1a73e8] mb-4">
          <Users className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-medium text-[#1f1f1f] mb-1">Shared with me is empty</h3>
        <p className="text-sm text-[#5f6368] max-w-sm">
          Files and folders others share with you will appear here.
        </p>
      </div>
    );
  }

  // Default: My Drive / folder empty
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-24 h-24 rounded-full bg-[#f0f4f9] flex items-center justify-center text-[#1a73e8] mb-5">
        <UploadCloud className="w-12 h-12" />
      </div>
      <h3 className="text-lg font-medium text-[#1f1f1f] mb-1">A place for all your files</h3>
      <p className="text-sm text-[#5f6368] max-w-md mb-6">
        Drag and drop your files here or use the "New" button to upload documents, spreadsheets, images, and folders.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleUploadClick}
          className="px-5 py-2.5 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-sm font-medium rounded-full shadow-sm hover:shadow transition-all flex items-center gap-2"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload files</span>
        </button>
        <button
          onClick={() => openModal('create-folder')}
          className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-sm font-medium text-[#1f1f1f] rounded-full transition-all flex items-center gap-2"
        >
          <FolderPlus className="w-4 h-4 text-gray-600" />
          <span>New folder</span>
        </button>
      </div>
    </div>
  );
};

