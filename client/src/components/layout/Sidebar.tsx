import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  FolderPlus,
  UploadCloud,
  FolderUp,
  HardDrive,
  Users,
  Clock,
  Star,
  Trash2,
  Cloud,
  X
} from 'lucide-react';
import { useDriveStore } from '../../store/useDriveStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUploadStore } from '../../store/useUploadStore';
import { formatBytes } from '../../utils/formatters';
import { ViewMode } from '../../types/drive';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { currentView, setCurrentView, openModal, currentFolder } = useDriveStore();
  const { user } = useAuthStore();
  const { addFilesToQueue } = useUploadStore();

  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setIsNewMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files, currentFolder?.id);
      setIsNewMenuOpen(false);
      e.target.value = '';
    }
  };

  const navItems: { view: ViewMode; label: string; icon: React.ReactNode }[] = [
    { view: 'my-drive', label: 'My Drive', icon: <HardDrive className="w-5 h-5" /> },
    { view: 'shared', label: 'Shared with me', icon: <Users className="w-5 h-5" /> },
    { view: 'recent', label: 'Recent', icon: <Clock className="w-5 h-5" /> },
    { view: 'starred', label: 'Starred', icon: <Star className="w-5 h-5" /> },
    { view: 'trash', label: 'Trash', icon: <Trash2 className="w-5 h-5" /> }
  ];

  const storageUsed = user?.storage_used || 0;
  const storageQuota = user?.storage_quota || 16106127360; // 15 GB
  const percentage = Math.min(100, Math.round((storageUsed / storageQuota) * 100));

  const content = (
    <div className="flex flex-col justify-between h-full p-3 select-none">
      {/* Top Section */}
      <div className="space-y-4">
        {/* Mobile Header with close button */}
        <div className="flex items-center justify-between md:hidden pb-2 border-b border-gray-200">
          <span className="font-semibold text-sm text-gray-800">Kunal Drive Navigation</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* + New Button */}
        <div className="relative" ref={newMenuRef}>
          <button
            onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
            className="flex items-center gap-3 px-5 py-3.5 bg-white hover:bg-gray-50 border border-gray-200/80 shadow-md hover:shadow-lg rounded-2xl transition-all duration-200 text-[#1f1f1f] font-medium text-sm w-fit"
          >
            <Plus className="w-6 h-6 text-[#1a73e8]" />
            <span>New</span>
          </button>

          {/* New Dropdown Menu */}
          {isNewMenuOpen && (
            <div className="absolute top-16 left-0 z-50 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200/80 py-2 animate-fade-in text-sm text-[#1f1f1f]">
              <button
                onClick={() => {
                  setIsNewMenuOpen(false);
                  openModal('create-folder');
                  onCloseMobile?.();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-[#f0f4f9] text-left transition-colors"
              >
                <FolderPlus className="w-5 h-5 text-gray-600" />
                <span>New folder</span>
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  onCloseMobile?.();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-[#f0f4f9] text-left transition-colors"
              >
                <UploadCloud className="w-5 h-5 text-gray-600" />
                <span>File upload</span>
              </button>

              <button
                onClick={() => {
                  folderInputRef.current?.click();
                  onCloseMobile?.();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-[#f0f4f9] text-left transition-colors"
              >
                <FolderUp className="w-5 h-5 text-gray-600" />
                <span>Folder upload</span>
              </button>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-ignore
            webkitdirectory=""
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Navigation list */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => {
                  setCurrentView(item.view);
                  onCloseMobile?.();
                }}
                className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#c2e7ff] text-[#001d35]'
                    : 'text-[#444746] hover:bg-[#eaedf1] hover:text-[#1f1f1f]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Storage Section */}
      <div className="p-3 bg-white rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5 text-[#1f1f1f] font-medium text-sm">
          <Cloud className="w-5 h-5 text-[#1a73e8]" />
          <span>Storage</span>
        </div>

        {/* Storage Bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentage > 90 ? 'bg-red-500' : 'bg-[#1a73e8]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-xs text-[#5f6368]">
          {formatBytes(storageUsed)} of {formatBytes(storageQuota)} used ({percentage}%)
        </p>

        <button
          onClick={() => {
            openModal('storage');
            onCloseMobile?.();
          }}
          className="w-full py-1.5 px-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-xs font-medium text-[#1a73e8] rounded-full transition-all text-center block"
        >
          Manage storage
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 shrink-0 bg-[#f8fafd] hidden md:flex flex-col h-[calc(100vh-64px)]">
        {content}
      </aside>

      {/* Mobile Drawer with Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-xs flex">
          <div className="w-72 bg-[#f8fafd] h-full shadow-2xl animate-fade-in">
            {content}
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};
