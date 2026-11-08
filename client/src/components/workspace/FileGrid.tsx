import React from 'react';
import { useDriveStore } from '../../store/useDriveStore';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { EmptyState } from './EmptyState';

export const FileGrid: React.FC = () => {
  const { folders, files, isLoading } = useDriveStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-44 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (folders.length === 0 && files.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-8">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[#444746] mb-3 select-none">
            Folders
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {folders.map((folder) => (
              <FolderCard key={folder.id} folder={folder} />
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[#444746] mb-3 select-none">
            Files
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {files.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

