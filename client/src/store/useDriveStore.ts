import { create } from 'zustand';
import { api } from '../api/client';
import {
  FileItem,
  Breadcrumb,
  ViewMode,
  LayoutMode,
  SortField,
  SortOrder
} from '../types/drive';

interface DriveState {
  folders: FileItem[];
  files: FileItem[];
  currentFolder: FileItem | null;
  breadcrumbs: Breadcrumb[];
  currentView: ViewMode;
  layoutMode: LayoutMode;
  sortBy: SortField;
  sortOrder: SortOrder;
  selectedIds: string[];
  selectedItem: FileItem | null;
  isDetailsOpen: boolean;
  isLoading: boolean;

  // Search & Filter state
  searchQuery: string;
  searchType: string;
  searchModified: string;
  isSearching: boolean;

  // Modals
  activeModal: 'create-folder' | 'rename' | 'move' | 'share' | 'preview' | 'storage' | null;
  modalTargetItem: FileItem | null;

  // Actions
  fetchItems: () => Promise<void>;
  fetchBreadcrumbs: (folderId: string | null) => Promise<void>;
  setCurrentFolder: (folderId: string | null) => void;
  setCurrentView: (view: ViewMode) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setSort: (field: SortField, order?: SortOrder) => void;
  toggleSelect: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleStar: (id: string) => Promise<void>;
  trashSelected: () => Promise<void>;
  trashSingle: (id: string) => Promise<void>;
  restoreItem: (id: string) => Promise<void>;
  deletePermanent: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  setSearch: (query: string, type?: string, modified?: string) => void;
  clearSearch: () => void;
  toggleDetails: () => void;
  openModal: (modal: DriveState['activeModal'], targetItem?: FileItem | null) => void;
  closeModal: () => void;
}

export const useDriveStore = create<DriveState>((set, get) => ({
  folders: [],
  files: [],
  currentFolder: null,
  breadcrumbs: [{ id: null, name: 'My Drive' }],
  currentView: 'my-drive',
  layoutMode: (localStorage.getItem('layoutMode') as LayoutMode) || 'grid',
  sortBy: 'name',
  sortOrder: 'asc',
  selectedIds: [],
  selectedItem: null,
  isDetailsOpen: false,
  isLoading: false,

  searchQuery: '',
  searchType: 'all',
  searchModified: 'all',
  isSearching: false,

  activeModal: null,
  modalTargetItem: null,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const {
        currentView,
        currentFolder,
        sortBy,
        sortOrder,
        searchQuery,
        searchType,
        searchModified,
        isSearching
      } = get();

      let res;
      if (isSearching && (searchQuery.trim() || searchType !== 'all' || searchModified !== 'all')) {
        res = await api.get('/files/search', {
          params: {
            q: searchQuery,
            type: searchType,
            modified: searchModified,
            sortBy,
            sortOrder
          }
        });
      } else {
        res = await api.get('/files', {
          params: {
            view: currentView,
            folderId: currentFolder?.id || 'root',
            sortBy,
            sortOrder,
            type: searchType !== 'all' ? searchType : undefined
          }
        });
      }

      set({
        folders: res.data.folders || [],
        files: res.data.files || [],
        isLoading: false
      });
    } catch (err) {
      console.error('[DriveStore fetch error]', err);
      set({ isLoading: false });
    }
  },

  fetchBreadcrumbs: async (folderId) => {
    try {
      const res = await api.get(`/folders/breadcrumbs/${folderId || 'root'}`);
      set({ breadcrumbs: res.data.breadcrumbs || [{ id: null, name: 'My Drive' }] });
    } catch (err) {
      set({ breadcrumbs: [{ id: null, name: 'My Drive' }] });
    }
  },

  setCurrentFolder: (folderId) => {
    if (!folderId) {
      set({ currentFolder: null, selectedIds: [], selectedItem: null });
      get().fetchBreadcrumbs(null);
      get().fetchItems();
    } else {
      // Find from existing folders or set temporary placeholder
      const found = get().folders.find(f => f.id === folderId) || { id: folderId, name: 'Folder' } as FileItem;
      set({ currentFolder: found, selectedIds: [], selectedItem: null });
      get().fetchBreadcrumbs(folderId);
      get().fetchItems();
    }
  },

  setCurrentView: (view) => {
    set({
      currentView: view,
      currentFolder: null,
      selectedIds: [],
      selectedItem: null,
      isSearching: false,
      searchQuery: ''
    });
    get().fetchBreadcrumbs(null);
    get().fetchItems();
  },

  setLayoutMode: (mode) => {
    localStorage.setItem('layoutMode', mode);
    set({ layoutMode: mode });
  },

  setSort: (field, order) => {
    const currentSortBy = get().sortBy;
    const currentSortOrder = get().sortOrder;
    const newOrder = order || (currentSortBy === field ? (currentSortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
    set({ sortBy: field, sortOrder: newOrder });
    get().fetchItems();
  },

  toggleSelect: (id, multi = false) => {
    const { selectedIds, files, folders } = get();
    const all = [...folders, ...files];
    if (!multi) {
      const isAlreadySingle = selectedIds.length === 1 && selectedIds[0] === id;
      const newSelected = isAlreadySingle ? [] : [id];
      const item = newSelected.length > 0 ? all.find(i => i.id === id) || null : null;
      set({ selectedIds: newSelected, selectedItem: item });
    } else {
      const exists = selectedIds.includes(id);
      const newSelected = exists ? selectedIds.filter(i => i !== id) : [...selectedIds, id];
      const item = newSelected.length > 0 ? all.find(i => i.id === newSelected[newSelected.length - 1]) || null : null;
      set({ selectedIds: newSelected, selectedItem: item });
    }
  },

  selectAll: () => {
    const { folders, files } = get();
    const all = [...folders, ...files];
    set({
      selectedIds: all.map(i => i.id),
      selectedItem: all[0] || null
    });
  },

  clearSelection: () => {
    set({ selectedIds: [], selectedItem: null });
  },

  toggleStar: async (id) => {
    try {
      const res = await api.post(`/files/${id}/star`);
      const { is_starred } = res.data;

      set({
        folders: get().folders.map(f => f.id === id ? { ...f, is_starred } : f),
        files: get().files.map(f => f.id === id ? { ...f, is_starred } : f),
      });

      if (get().currentView === 'starred' && is_starred === 0) {
        // If unstarred in Starred view, remove it
        set({
          folders: get().folders.filter(f => f.id !== id),
          files: get().files.filter(f => f.id !== id),
        });
      }
    } catch (err) {
      console.error('[Drive toggleStar error]', err);
    }
  },

  trashSingle: async (id) => {
    try {
      await api.post(`/files/${id}/trash`);
      set({
        folders: get().folders.filter(f => f.id !== id),
        files: get().files.filter(f => f.id !== id),
        selectedIds: get().selectedIds.filter(i => i !== id),
        selectedItem: get().selectedItem?.id === id ? null : get().selectedItem
      });
    } catch (err) {
      console.error('[Drive trash error]', err);
    }
  },

  trashSelected: async () => {
    const { selectedIds } = get();
    if (!selectedIds.length) return;
    try {
      for (const id of selectedIds) {
        await api.post(`/files/${id}/trash`);
      }
      set({
        folders: get().folders.filter(f => !selectedIds.includes(f.id)),
        files: get().files.filter(f => !selectedIds.includes(f.id)),
        selectedIds: [],
        selectedItem: null
      });
    } catch (err) {
      console.error('[Drive trashSelected error]', err);
    }
  },

  restoreItem: async (id) => {
    try {
      await api.post(`/files/${id}/restore`);
      set({
        folders: get().folders.filter(f => f.id !== id),
        files: get().files.filter(f => f.id !== id),
        selectedIds: get().selectedIds.filter(i => i !== id),
        selectedItem: null
      });
    } catch (err) {
      console.error('[Drive restore error]', err);
    }
  },

  deletePermanent: async (id) => {
    try {
      await api.delete(`/files/${id}/permanent`);
      set({
        folders: get().folders.filter(f => f.id !== id),
        files: get().files.filter(f => f.id !== id),
        selectedIds: get().selectedIds.filter(i => i !== id),
        selectedItem: null
      });
    } catch (err) {
      console.error('[Drive deletePermanent error]', err);
    }
  },

  emptyTrash: async () => {
    try {
      await api.post('/files/trash/empty');
      set({ folders: [], files: [], selectedIds: [], selectedItem: null });
    } catch (err) {
      console.error('[Drive emptyTrash error]', err);
    }
  },

  setSearch: (query, type = 'all', modified = 'all') => {
    set({
      searchQuery: query,
      searchType: type,
      searchModified: modified,
      isSearching: !!(query.trim() || type !== 'all' || modified !== 'all')
    });
    get().fetchItems();
  },

  clearSearch: () => {
    set({
      searchQuery: '',
      searchType: 'all',
      searchModified: 'all',
      isSearching: false
    });
    get().fetchItems();
  },

  toggleDetails: () => {
    set({ isDetailsOpen: !get().isDetailsOpen });
  },

  openModal: (modal, targetItem = null) => {
    set({ activeModal: modal, modalTargetItem: targetItem });
  },

  closeModal: () => {
    set({ activeModal: null, modalTargetItem: null });
  }
}));

