import React, { useState, useEffect } from 'react';
import { X, HardDrive, Download, Eye } from 'lucide-react';
import { useDriveStore } from '../../store/useDriveStore';
import { api } from '../../api/client';
import { StorageSummary } from '../../types/drive';
import { formatBytes, formatDate } from '../../utils/formatters';
import { getFileCategoryIcon } from '../../utils/icons';

export const StorageModal: React.FC = () => {
  const { activeModal, closeModal, openModal } = useDriveStore();
  const [summary, setSummary] = useState<StorageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeModal === 'storage') {
      setIsLoading(true);
      api
        .get('/storage/summary')
        .then((res) => {
          setSummary(res.data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [activeModal]);

  if (activeModal !== 'storage') return null;

  const categories = [
    { key: 'image', label: 'Images', color: 'bg-red-500' },
    { key: 'video', label: 'Videos', color: 'bg-rose-500' },
    { key: 'pdf', label: 'PDFs', color: 'bg-orange-500' },
    { key: 'document', label: 'Documents', color: 'bg-blue-500' },
    { key: 'spreadsheet', label: 'Spreadsheets', color: 'bg-emerald-500' },
    { key: 'code', label: 'Code & Text', color: 'bg-indigo-500' },
    { key: 'archive', label: 'Archives (ZIP)', color: 'bg-gray-500' },
    { key: 'other', label: 'Other', color: 'bg-purple-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 animate-slide-up space-y-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-[#1f1f1f]">Storage management</h3>
              <p className="text-xs text-[#5f6368]">
                Review used storage, quota limits, and large files
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading || !summary ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading storage details...</div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            {/* Main Gauge */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-[#1f1f1f]">
                    {formatBytes(summary.used)}
                  </span>
                  <span className="text-sm text-gray-500 ml-1.5">
                    of {formatBytes(summary.quota)} used ({summary.percentage}%)
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Free 15 GB Plan
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex">
                {categories.map((cat) => {
                  const bytes = summary.breakdown[cat.key] || 0;
                  if (bytes === 0) return null;
                  const pct = Math.max(1, (bytes / summary.quota) * 100);
                  return (
                    <div
                      key={cat.key}
                      className={`${cat.color} h-full transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${cat.label}: ${formatBytes(bytes)}`}
                    />
                  );
                })}
              </div>

              {/* Category Breakdown Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {categories.map((cat) => (
                  <div key={cat.key} className="flex items-center gap-2 text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.color} shrink-0`} />
                    <span className="text-gray-600 truncate">{cat.label}:</span>
                    <span className="font-medium text-gray-900 ml-auto">
                      {formatBytes(summary.breakdown[cat.key] || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Largest Files Table */}
            <div>
              <h4 className="text-sm font-semibold text-[#1f1f1f] mb-3">
                Largest files in Kunal Drive
              </h4>
              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100 text-xs">
                {summary.largestFiles.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">No files uploaded yet.</div>
                ) : (
                  summary.largestFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-3">
                        {getFileCategoryIcon(file.category, 'w-4 h-4 shrink-0')}
                        <span className="font-medium text-gray-800 truncate" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-medium text-gray-600">
                          {formatBytes(file.size)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              closeModal();
                              openModal('preview', file);
                            }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const token = localStorage.getItem('token');
                              window.open(`/api/files/${file.id}/download?token=${token}`, '_blank');
                            }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 flex justify-end">
          <button
            onClick={closeModal}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-800 rounded-full transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

