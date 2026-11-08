# Google Drive Clone — Full-Stack Cloud Storage Platform

A clean-room, full-stack reconstruction of **Google Drive** informed by the Reverse Engineering Approach (REA). Built with **React 18, TypeScript, Vite, Tailwind CSS, Zustand, Node.js (v22), Express, and persistent SQLite storage**, supporting chunked file uploads, multi-format inline previews, link sharing, nested folder management, favorites, soft-delete trash recovery, and storage quota accounting.

---

## 1. REA (Reverse Engineering Approach) Research Findings

Through reverse engineering analysis of Google Drive (https://drive.google.com/), the core architecture decomposes into three primary planes:

### A. Virtual File System & Unified Entity Model
- **Unified Entity Model:** Folders and files exist within a single metadata resource space. Folders are designated by `mimeType = 'application/vnd.google-apps.folder'` with `size = 0`.
- **DAG Parent Pointers:** Items link to their container via `parent_id` (or `parents[]`), with `NULL` denoting the root drive ("My Drive").
- **Soft Deletions:** Moving to trash updates `is_trashed = 1` and `trashed_at = TIMESTAMP`, preserving hierarchy so restoring items returns them to their original location.

### B. Ingestion & Streaming Protocols
- **Multipart Uploads:** Transfers metadata and binary payload in a single HTTP request for standard transfers.
- **Resumable Chunk Protocol:** Uses session initialization (`uploadType=resumable`) returning an upload session ID, followed by `PUT` requests with `Content-Range: bytes START-END/TOTAL`. The server responds with `HTTP 308 Resume Incomplete` until all bytes are acknowledged, enabling transfer recovery after connection drops.
- **HTTP Range Streaming:** Implements `HTTP 206 Partial Content` with `Content-Range: bytes START-END/SIZE`, allowing client-side `<video>`, `<audio>`, and PDF viewports to seek smoothly without buffering entire files into RAM.

### C. Permissions Matrix & Sharing
- **Role Hierarchy:** Supports `owner`, `editor` (read/write), and `viewer` (read/stream/download).
- **Public Share Links:** Cryptographically random tokens (`token`) grant direct access without forcing unauthenticated viewers to create accounts.

---

## 2. Project Folder Structure

```
googledrive clone/
├── client/                               # Frontend React + TypeScript application
│   ├── public/                           # Static assets & Google Drive favicon
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts                 # Axios instance with JWT interceptors
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── AuthModal.tsx         # Sign in, Sign up, and 1-Click Demo Login
│   │   │   ├── common/
│   │   │   │   ├── ContextMenu.tsx       # Desktop right-click / action context menu
│   │   │   │   └── DropzoneOverlay.tsx   # Global drag-and-drop overlay
│   │   │   ├── layout/
│   │   │   │   ├── Breadcrumbs.tsx       # Breadcrumb path, view switchers, selection toolbar
│   │   │   │   ├── DetailsPanel.tsx      # File inspection & metadata sidebar
│   │   │   │   ├── Header.tsx            # Omnibox search with type/date filter chips
│   │   │   │   └── Sidebar.tsx           # "+ New" menu, nav views, storage gauge
│   │   │   ├── modals/
│   │   │   │   ├── CreateFolderModal.tsx # New folder dialog
│   │   │   │   ├── FilePreviewModal.tsx  # Multi-format full-screen previewer
│   │   │   │   ├── MoveModal.tsx         # Interactive folder tree picker
│   │   │   │   ├── RenameModal.tsx       # File/folder rename dialog
│   │   │   │   ├── ShareModal.tsx        # Link generator & permission manager
│   │   │   │   └── StorageModal.tsx      # Quota usage & largest files table
│   │   │   ├── upload/
│   │   │   │   └── UploadManager.tsx     # Floating bottom-right progress drawer
│   │   │   └── workspace/
│   │   │       ├── EmptyState.tsx        # Context-aware empty state illustrations
│   │   │       ├── FileCard.tsx          # Grid item with dynamic thumbnail & menu
│   │   │       ├── FileGrid.tsx          # Folders and files categorized grid
│   │   │       ├── FileList.tsx          # Tabular sortable list view
│   │   │       └── FolderCard.tsx        # Folder card with double-click navigation
│   │   ├── store/
│   │   │   ├── useAuthStore.ts           # Authentication & user profile state
│   │   │   ├── useDriveStore.ts          # Files, selection, views, and search state
│   │   │   └── useUploadStore.ts         # Multi-file upload queue & progress state
│   │   ├── types/
│   │   │   └── drive.ts                  # TypeScript models and interfaces
│   │   ├── utils/
│   │   │   ├── formatters.ts             # Human-readable bytes & date formatters
│   │   │   └── icons.tsx                 # Category-colored Lucide icons
│   │   ├── App.tsx                       # Main application shell
│   │   ├── index.css                     # Tailwind styles & scrollbars
│   │   └── main.tsx                      # React root entry point
│   ├── index.html                        # HTML shell
│   ├── package.json                      # Frontend dependencies
│   ├── postcss.config.js                 # PostCSS setup
│   ├── tailwind.config.js                # Google Drive Material You theme tokens
│   ├── tsconfig.json                     # TypeScript compiler configuration
│   └── vite.config.ts                    # Vite dev server & backend proxy
├── server/                               # Backend Express API & Persistent Storage
│   ├── data/
│   │   └── drive.db                      # Persistent SQLite database (WAL mode)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js               # SQLite connection, DDL schemas, indexes
│   │   ├── controllers/
│   │   │   ├── authController.js         # JWT auth, bcrypt hashing, profile
│   │   │   ├── fileController.js         # Uploads, streaming, CRUD, search, trash
│   │   │   ├── folderController.js       # Hierarchy, tree, breadcrumbs, zip download
│   │   │   ├── shareController.js        # Link generation & access control
│   │   │   └── storageController.js      # Storage usage & category breakdown
│   │   ├── middleware/
│   │   │   ├── auth.js                   # JWT verification & optional auth
│   │   │   └── upload.js                 # Multer disk storage engine
│   │   ├── routes/
│   │   │   ├── authRoutes.js             # /api/auth routes
│   │   │   ├── fileRoutes.js             # /api/files routes
│   │   │   ├── folderRoutes.js           # /api/folders routes
│   │   │   ├── shareRoutes.js            # /api/shares routes
│   │   │   └── storageRoutes.js          # /api/storage routes
│   │   ├── utils/
│   │   │   └── fileTypes.js              # MIME type & category classifiers
│   │   └── index.js                      # Express server entry point & seed data
│   ├── storage/
│   │   └── uploads/                      # Persistent disk storage for uploaded files
│   ├── test/
│   │   └── e2e_test.js                   # 23-step automated E2E test suite
│   ├── .env                              # Environment configuration
│   ├── .env.example                      # Template environment variables
│   └── package.json                      # Backend dependencies
├── README.md                             # Documentation & Setup Guide
└── package.json                          # Root monorepo scripts
```

---

## 3. Database Schema

The database runs on SQLite via Node 22's native `node:sqlite` engine with Write-Ahead Logging (`WAL`) enabled for concurrent reads and writes:

### `users`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (UUID) | Primary Key |
| `name` | TEXT | User full name |
| `email` | TEXT | Unique email address |
| `password` | TEXT | bcrypt hashed password |
| `storage_used` | INTEGER | Bytes used (default 0) |
| `storage_quota` | INTEGER | Byte limit (16106127360 = 15 GB default) |
| `avatar_url` | TEXT | Profile picture URL |
| `created_at` | DATETIME | Timestamp |

### `files`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (UUID) | Primary Key |
| `user_id` | TEXT (FK) | References `users(id)` |
| `parent_id` | TEXT (FK) | References `files(id)`, NULL for root |
| `name` | TEXT | Filename or folder name |
| `mime_type` | TEXT | MIME type (e.g. `application/vnd.google-apps.folder`) |
| `size` | INTEGER | Size in bytes (0 for folders) |
| `is_folder` | INTEGER | 1 = Folder, 0 = File |
| `is_starred` | INTEGER | 1 = Starred, 0 = Normal |
| `is_trashed` | INTEGER | 1 = In Trash (soft deleted), 0 = Active |
| `trashed_at` | DATETIME | Timestamp of trashing |
| `storage_path` | TEXT | Relative path inside `server/storage/uploads/` |
| `created_at` | DATETIME | Creation timestamp |
| `updated_at` | DATETIME | Modification timestamp |
| `last_accessed_at` | DATETIME | Last opened/downloaded timestamp |

### `shares`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (UUID) | Primary Key |
| `file_id` | TEXT (FK) | References `files(id)` |
| `shared_by` | TEXT (FK) | References `users(id)` |
| `shared_with_email` | TEXT | Optional recipient email |
| `token` | TEXT | Unique 32-character URL token |
| `permission` | TEXT | `'viewer'` or `'editor'` |
| `is_public` | INTEGER | 1 = Public link access |
| `created_at` | DATETIME | Creation timestamp |

### `upload_sessions`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (UUID) | Primary Key (Session UUID) |
| `user_id` | TEXT (FK) | References `users(id)` |
| `parent_id` | TEXT | Target folder ID |
| `filename` | TEXT | File name |
| `mime_type` | TEXT | MIME type |
| `total_size` | INTEGER | Target byte size |
| `uploaded_bytes` | INTEGER | Bytes received so far |
| `temp_path` | TEXT | Path to assembling temp binary |
| `created_at` | DATETIME | Initiation timestamp |

---

## 4. Environment Variables

Create `server/.env` with the following keys:

```env
PORT=5000
JWT_SECRET=super-secret-google-drive-clone-jwt-key-2026
JWT_EXPIRES_IN=7d
STORAGE_DIR=storage/uploads
MAX_FILE_SIZE=5368709120
DEFAULT_QUOTA_BYTES=16106127360
CORS_ORIGIN=http://localhost:5173
```

---

## 5. Installation & Setup Commands

### Prerequisites
- Node.js v20+ or v22 LTS
- npm v10+

### Step-by-Step Setup

1. **Clone or navigate to the repository:**
   ```bash
   cd "googledrive clone"
   ```

2. **Install all dependencies (Root, Server, and Client):**
   ```bash
   npm run install:all
   ```

3. **Start the Backend API Server:**
   ```bash
   npm run server
   ```
   *The server initializes `server/data/drive.db` and auto-seeds a ready-to-use demo account:*
   - **Email:** `demo@google.com`
   - **Password:** `password123`

4. **Start the React + Vite Client:**
   ```bash
   npm run client
   ```
   *Open [http://localhost:5173](http://localhost:5173) in your browser.*

---

## 6. Testing Report

The codebase includes an end-to-end automated test suite verifying all 13 core features. Run tests with:

```bash
npm test
```

### Test Suite Execution Output
```
====================================================
🧪 Starting Full E2E Test Suite for Google Drive Clone
====================================================

✅ [PASS] Backend health check returns status: healthy
✅ [PASS] Demo user authentication successful with JWT
✅ [PASS] User registration succeeds and generates profile
✅ [PASS] Folder creation in My Drive succeeds
✅ [PASS] Nested subfolder creation succeeds
✅ [PASS] Hierarchical breadcrumb path resolution succeeds
✅ [PASS] Multipart multi-file upload succeeds
✅ [PASS] HTTP Range streaming returns 206 Partial Content
✅ [PASS] Partial content matches exact byte range requested
✅ [PASS] File download verifies exact binary content match
✅ [PASS] File starring toggle succeeds
✅ [PASS] Starred item appears in Starred view
✅ [PASS] File rename succeeds
✅ [PASS] Make a copy duplicates file record & binary
✅ [PASS] Keyword & category search returns matching items
✅ [PASS] Shareable link generated with access token
✅ [PASS] Public link access succeeds without login
✅ [PASS] Storage usage tracking and 15GB quota calculations verify correctly
✅ [PASS] Recursive folder download as streaming ZIP archive succeeds
✅ [PASS] File moved to Trash
✅ [PASS] Trashed item appears in Trash view
✅ [PASS] Item successfully restored from Trash
✅ [PASS] Permanent file deletion purges record and frees disk storage

====================================================
🎉 TEST SUMMARY: 23 passed, 0 failed
====================================================
```

---

## 7. Key Features & Workflows

### 1. Multi-Format File Previewer
- **Images (PNG, JPG, SVG, WebP, GIF):** Includes dynamic zoom in/out (50% to 300%), 90-degree rotation, and pan reset.
- **Videos (MP4, WebM):** Custom HTML5 player supporting seek bar, play/pause, volume, and fullscreen with HTTP Range 206 streaming.
- **Audio (MP3, WAV, FLAC, OGG):** Audio player with progress bar.
- **PDFs:** Native embedded PDF document viewer.
- **Code & Markdown (JS, TS, Python, JSON, CSS, MD, HTML):** Syntax-formatted dark viewer with line numbering.
- **Spreadsheets (CSV, TSV):** Parsed interactive spreadsheet grid with row indices and column headers.
- **Navigation:** Previous/Next arrows and Left/Right keyboard shortcuts to cycle across all files in the current folder without closing the modal.

### 2. File Organization & Management
- **Folder Navigation:** Double-click folders to navigate in; breadcrumb bar provides full path navigation back to any parent.
- **Move To Modal:** Explores the folder tree interactively, with automated cycle prevention (cannot move a folder into itself or any of its subfolders).
- **Make a Copy:** Duplicates both metadata record and disk binary, debiting user quota accordingly.
- **Folder Download (ZIP):** Recursively packages all files and subfolders into a compressed `.zip` archive on the fly using `archiver`.

### 3. File Sharing & Access Control
- Generates unique 32-character tokens.
- Share link allows external or unauthenticated users to preview and download shared files.
- Owners can toggle between `Viewer` and `Editor` permissions or revoke the link at any time.

### 4. Storage Quota & Breakdown
- 15 GB default quota per user matching Google Drive.
- Real-time gauge tracking usage across categories: Images, Videos, PDFs, Documents, Spreadsheets, Code, Archives, and Other.
- Table of largest files with direct preview and download buttons.

---

## 8. Production Deployment Instructions

### Deploying Frontend to Vercel / Netlify
1. Build the production client bundle:
   ```bash
   npm run build:client
   ```
2. The compiled static output is located in `client/dist`.
3. Configure `VITE_API_URL` to point to your deployed backend domain.

### Deploying Backend to Render / Railway / Fly.io / VPS
1. Set environment variables on the hosting platform:
   - `PORT=5000`
   - `JWT_SECRET=<your-production-secret>`
   - `STORAGE_DIR=storage/uploads`
   - `CORS_ORIGIN=https://your-frontend-domain.com`
2. Ensure the `server/storage/uploads` and `server/data` volumes are configured as persistent disk mounts so files and database survive container restarts.
3. Start command: `node src/index.js`.
