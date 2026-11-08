import React from 'react';
import { UploadCloud } from 'lucide-react';
import { useDriveStore } from '../../store/useDriveStore';

interface DropzoneOverlayProps {
  isDragging: boolean;
}

export const DropzoneOverlay: React.FC<DropzoneOverlayProps> = ({ isDragging }) => {
  const currentFolder = useDriveStore((state) => state.currentFolder);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0b57d0]/10 backdrop-blur-sm pointer-events-none flex items-center justify-center p-8 transition-all animate-fade-in">
      <div className="w-full max-w-xl bg-white border-2 border-dashed border-[#1a73e8] rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-2xl scale-100 transition-transform">
        <div className="w-20 h-20 rounded-full bg-[#e8f0fe] flex items-center justify-center mb-5 text-[#1a73e8] animate-bounce">
          <UploadCloud className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-medium text-[#1f1f1f] mb-1">
          Drop files to upload
        </h3>
        <p className="text-sm text-[#5f6368]">
          Upload instantly to{' '}
          <span className="font-semibold text-[#1a73e8]">
            {currentFolder ? currentFolder.name : 'My Drive'}
          </span>
        </p>
      </div>
    </div>
  );
};

