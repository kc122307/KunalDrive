import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  File,
  Loader2
} from 'lucide-react';
import { useUploadStore } from '../../store/useUploadStore';
import { formatBytes } from '../../utils/formatters';

export const UploadManager: React.FC = () => {
  const {
    queue,
    isOpen,
    isMinimized,
    toggleMinimized,
    close,
    cancelUpload,
    clearCompleted
  } = useUploadStore();

  if (!isOpen || queue.length === 0) return null;

  const completedCount = queue.filter((q) => q.status === 'completed').length;
  const isAllCompleted = completedCount === queue.length;
  const inProgressCount = queue.filter((q) => q.status === 'uploading' || q.status === 'pending').length;

  return (
    <div className="fixed bottom-4 right-6 z-40 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-[#1f1f1f] animate-slide-up">
      {/* Header */}
      <div className="bg-[#1f1f1f] text-white px-4 py-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          {isAllCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          )}
          <span className="font-medium text-sm">
            {isAllCompleted
              ? `${queue.length} upload${queue.length > 1 ? 's' : ''} complete`
              : `Uploading ${inProgressCount} item${inProgressCount > 1 ? 's' : ''}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimized}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={close}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body List */}
      {!isMinimized && (
        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 p-2">
          {queue.map((item) => (
            <div key={item.id} className="py-2.5 px-2 flex flex-col gap-1.5 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <File className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-xs font-medium truncate max-w-[200px]" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-gray-400">
                    {formatBytes(item.size)}
                  </span>
                  {item.status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {item.status === 'error' && (
                    <span title={item.error || 'Error'}>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </span>
                  )}
                  {item.status !== 'completed' && item.status !== 'error' && (
                    <button
                      onClick={() => cancelUpload(item.id)}
                      className="p-0.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {item.status === 'uploading' && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#1a73e8] h-full transition-all duration-200 rounded-full"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}

          {completedCount > 0 && (
            <div className="pt-2 pb-1 text-center">
              <button
                onClick={clearCompleted}
                className="text-xs text-[#1a73e8] hover:underline font-medium"
              >
                Clear completed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
