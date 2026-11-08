import React, { useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Breadcrumbs } from './components/layout/Breadcrumbs';
import { DetailsPanel } from './components/layout/DetailsPanel';
import { FileGrid } from './components/workspace/FileGrid';
import { FileList } from './components/workspace/FileList';
import { DropzoneOverlay } from './components/common/DropzoneOverlay';
import { UploadManager } from './components/upload/UploadManager';
import { ToastContainer } from './components/common/Toast';
import { CreateFolderModal } from './components/modals/CreateFolderModal';
import { RenameModal } from './components/modals/RenameModal';
import { MoveModal } from './components/modals/MoveModal';
import { ShareModal } from './components/modals/ShareModal';
import { StorageModal } from './components/modals/StorageModal';
import { FilePreviewModal } from './components/modals/FilePreviewModal';
import { AuthModal } from './components/auth/AuthModal';
import { PublicSharedView } from './components/workspace/PublicSharedView';

import { useAuthStore } from './store/useAuthStore';
import { useDriveStore } from './store/useDriveStore';
import { useUploadStore } from './store/useUploadStore';
import { useToastStore } from './store/useToastStore';

export const App: React.FC = () => {
  const { checkAuth, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const {
    fetchItems,
    layoutMode,
    clearSelection,
    currentFolder,
    selectedIds,
    selectedItem,
    selectAll,
    trashSelected,
    openModal,
    setCurrentFolder
  } = useDriveStore();
  const { addFilesToQueue } = useUploadStore();
  const { showToast } = useToastStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sharedToken, setSharedToken] = useState<string | null>(null);

  // Check URL params for shared link access (e.g. ?sharedToken=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('sharedToken') || urlParams.get('token');
    if (token) {
      setSharedToken(token);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchItems();
    }
  }, [isAuthenticated]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      // Select All (Ctrl+A / Cmd+A)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
        showToast('All items selected', 'info');
      }

      // Delete / Backspace (Trash selected)
      if (e.key === 'Delete' || (e.key === 'Backspace' && (e.metaKey || e.ctrlKey))) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          const count = selectedIds.length;
          trashSelected();
          showToast(`${count} item(s) moved to trash`, 'info');
        }
      }

      // Escape (Clear selection)
      if (e.key === 'Escape') {
        clearSelection();
      }

      // Enter (Open item if single item selected)
      if (e.key === 'Enter') {
        if (selectedIds.length === 1 && selectedItem) {
          if (selectedItem.is_folder) {
            setCurrentFolder(selectedItem.id);
          } else {
            openModal('preview', selectedItem);
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, selectedItem]);

  // Global Drag and Drop listeners
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files, currentFolder?.id);
      showToast(`Uploading ${e.dataTransfer.files.length} file(s)...`, 'info');
    }
  };

  // If viewing a public shared link, render the dedicated public share portal
  if (sharedToken) {
    return (
      <PublicSharedView
        token={sharedToken}
        onExit={() => {
          setSharedToken(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      />
    );
  }

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f8fafd] select-none">
        <svg className="w-16 h-14 animate-pulse mb-4" viewBox="0 0 87.3 78" fill="none">
          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
        </svg>
        <span className="text-sm font-medium text-[#444746]">Loading Kunal Drive...</span>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="h-screen w-screen flex flex-col bg-[#f8fafd] overflow-hidden select-none font-sans"
    >
      <Header onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          mobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Workspace Frame (Google Drive rounded container) */}
        <main
          onClick={clearSelection}
          className="flex-1 mr-0 md:mr-4 mb-0 md:mb-4 bg-white rounded-none md:rounded-3xl border-0 md:border border-gray-200/80 shadow-xs flex flex-col overflow-hidden relative"
        >
          <Breadcrumbs />

          <div className="flex-1 overflow-y-auto p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            {layoutMode === 'grid' ? <FileGrid /> : <FileList />}
          </div>
        </main>

        <DetailsPanel />
      </div>

      {/* Floating Drag & Drop Overlay */}
      <DropzoneOverlay isDragging={isDragging} />

      {/* Floating Upload Progress Drawer */}
      <UploadManager />

      {/* Floating Toast Notification Container */}
      <ToastContainer />

      {/* Modals */}
      <CreateFolderModal />
      <RenameModal />
      <MoveModal />
      <ShareModal />
      <StorageModal />
      <FilePreviewModal />
      <AuthModal />
    </div>
  );
};

export default App;
