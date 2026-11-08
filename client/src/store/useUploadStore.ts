import { create } from 'zustand';
import { api } from '../api/client';
import { UploadItem } from '../types/drive';
import { useDriveStore } from './useDriveStore';
import { useAuthStore } from './useAuthStore';

interface UploadState {
  queue: UploadItem[];
  isOpen: boolean;
  isMinimized: boolean;
  addFilesToQueue: (files: FileList | File[], parentId?: string | null) => Promise<void>;
  cancelUpload: (id: string) => void;
  clearCompleted: () => void;
  toggleOpen: () => void;
  toggleMinimized: () => void;
  close: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  queue: [],
  isOpen: false,
  isMinimized: false,

  addFilesToQueue: async (fileList, parentId = null) => {
    const files = Array.from(fileList);
    if (!files.length) return;

    const newItems: UploadItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending'
    }));

    set({
      queue: [...get().queue, ...newItems],
      isOpen: true,
      isMinimized: false
    });

    // Upload items sequentially or parallel
    for (const item of newItems) {
      set({
        queue: get().queue.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q))
      });

      const formData = new FormData();
      formData.append('files', item.file);
      if (parentId) {
        formData.append('parent_id', parentId);
      }

      try {
        await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              set({
                queue: get().queue.map((q) =>
                  q.id === item.id ? { ...q, progress: percent } : q
                )
              });
            }
          }
        });

        set({
          queue: get().queue.map((q) =>
            q.id === item.id ? { ...q, progress: 100, status: 'completed' } : q
          )
        });

        // Refresh files in current view
        useDriveStore.getState().fetchItems();
        // Refresh auth storage
        useAuthStore.getState().checkAuth();
      } catch (err: any) {
        console.error('[Upload item error]', err);
        set({
          queue: get().queue.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'error',
                  error: err.response?.data?.error || 'Upload failed'
                }
              : q
          )
        });
      }
    }
  },

  cancelUpload: (id) => {
    set({
      queue: get().queue.filter((q) => q.id !== id)
    });
  },

  clearCompleted: () => {
    set({
      queue: get().queue.filter((q) => q.status !== 'completed')
    });
  },

  toggleOpen: () => set({ isOpen: !get().isOpen }),
  toggleMinimized: () => set({ isMinimized: !get().isMinimized }),
  close: () => set({ isOpen: false, queue: [] })
}));
