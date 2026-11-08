export type ViewMode = 'my-drive' | 'shared' | 'recent' | 'starred' | 'trash';
export type LayoutMode = 'grid' | 'list';
export type SortField = 'name' | 'modified' | 'size';
export type SortOrder = 'asc' | 'desc';

export type FileCategory =
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  storage_used: number;
  storage_quota: number;
  avatar_url?: string;
  created_at?: string;
}

export interface FileItem {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  mime_type: string;
  size: number;
  is_folder: number;
  is_starred: number;
  is_trashed: number;
  trashed_at?: string | null;
  storage_path?: string | null;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  category: FileCategory;
  owner_name?: string;
  owner_email?: string;
  share_permission?: 'viewer' | 'editor';
  share_token?: string;
}

export interface FolderNode {
  id: string | null;
  name: string;
  children?: FolderNode[];
}

export interface Breadcrumb {
  id: string | null;
  name: string;
}

export interface ShareItem {
  id: string;
  file_id: string;
  shared_by: string;
  shared_with_email?: string | null;
  token: string;
  permission: 'viewer' | 'editor';
  is_public: number;
  created_at: string;
  expires_at?: string | null;
}

export interface StorageSummary {
  used: number;
  quota: number;
  percentage: number;
  breakdown: Record<string, number>;
  totalFileCount: number;
  totalFolderCount: number;
  largestFiles: FileItem[];
}

export interface UploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}
