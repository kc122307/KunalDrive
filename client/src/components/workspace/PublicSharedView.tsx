import React, { useState, useEffect } from 'react';
import { Download, Eye, ExternalLink, HardDrive, Folder } from 'lucide-react';
import { api } from '../../api/client';
import { FileItem } from '../../types/drive';
import { getFileCategoryIcon } from '../../utils/icons';
import { formatBytes, formatDate } from '../../utils/formatters';

interface PublicSharedViewProps {
  token: string;
  onExit: () => void;
}

export const PublicSharedView: React.FC<PublicSharedViewProps> = ({ token, onExit }) => {
  const [file, setFile] = useState<FileItem | null>(null);
  const [subItems, setSubItems] = useState<FileItem[]>([]);
  const [shareInfo, setShareInfo] = useState<{ permission: string; owner_name: string; created_at: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    api
      .get(`/shares/public/${token}`)
      .then((res) => {
        setFile(res.data.file);
        setSubItems(res.data.subItems || []);
        setShareInfo(res.data.share);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Shared link is invalid or has expired.');
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f8fafd]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-medium text-gray-600">Loading shared item...</span>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f8fafd] p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <HardDrive className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Item Unavailable</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">{error || 'This link may have expired or been revoked.'}</p>
        <button
          onClick={onExit}
          className="px-6 py-2.5 bg-[#0b57d0] text-white rounded-full text-sm font-medium shadow-sm hover:bg-[#0842a0]"
        >
          Go to Kunal Drive
        </button>
      </div>
    );
  }

  const downloadUrl = `/api/files/${file.id}/download?shareToken=${token}`;
  const streamUrl = `/api/files/${file.id}/stream?shareToken=${token}`;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f8fafd] overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 bg-white px-6 flex items-center justify-between border-b border-gray-200 select-none">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-7" viewBox="0 0 87.3 78" fill="none">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
          <span className="text-lg font-medium text-gray-800">Shared Kunal Drive Item</span>
        </div>

        <button
          onClick={onExit}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-800 rounded-full transition-colors"
        >
          Sign in to Kunal Drive
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                {getFileCategoryIcon(file.category, 'w-10 h-10')}
              </div>
              <div>
                <h1 className="text-xl font-medium text-gray-900">{file.name}</h1>
                <p className="text-xs text-gray-500">
                  Shared by <span className="font-semibold text-gray-700">{shareInfo?.owner_name}</span> • {formatBytes(file.size)} • {formatDate(file.updated_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!file.is_folder && (
                <a
                  href={streamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-full flex items-center gap-2 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </a>
              )}
              <a
                href={downloadUrl}
                download
                className="px-5 py-2.5 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium rounded-full shadow-sm flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{file.is_folder ? 'Download Folder (ZIP)' : 'Download'}</span>
              </a>
            </div>
          </div>

          {/* If it's a folder, list subitems */}
          {file.is_folder && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Contents in this folder</h3>
              <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden text-sm">
                {subItems.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-xs">This folder is empty.</div>
                ) : (
                  subItems.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {getFileCategoryIcon(item.category, 'w-5 h-5')}
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatBytes(item.size)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Inline Media Preview if Image */}
          {!file.is_folder && file.category === 'image' && (
            <div className="w-full h-80 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center">
              <img src={streamUrl} alt={file.name} className="max-h-full max-w-full object-contain" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

