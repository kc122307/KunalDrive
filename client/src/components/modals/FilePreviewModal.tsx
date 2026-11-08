import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Star,
  ExternalLink
} from 'lucide-react';
import { useDriveStore } from '../../store/useDriveStore';
import { getFileCategoryIcon } from '../../utils/icons';
import { formatBytes } from '../../utils/formatters';

export const FilePreviewModal: React.FC = () => {
  const { activeModal, modalTargetItem, closeModal, files, toggleStar } = useDriveStore();

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<string[][] | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // File navigation in current folder
  const currentItem = modalTargetItem;
  const currentFileIndex = files.findIndex((f) => f.id === currentItem?.id);
  const hasPrev = currentFileIndex > 0;
  const hasNext = currentFileIndex !== -1 && currentFileIndex < files.length - 1;

  const token = localStorage.getItem('token');
  const streamUrl = currentItem ? `/api/files/${currentItem.id}/stream?token=${token}` : '';
  const downloadUrl = currentItem ? `/api/files/${currentItem.id}/download?token=${token}` : '';

  useEffect(() => {
    // Reset transforms on file switch
    setZoom(1);
    setRotation(0);
    setTextContent(null);
    setCsvRows(null);

    if (currentItem && (currentItem.category === 'code' || currentItem.category === 'document' || currentItem.category === 'spreadsheet')) {
      // Check if it's a text-based format or csv
      const isCsv = currentItem.name.endsWith('.csv') || currentItem.mime_type === 'text/csv';
      const isText = currentItem.category === 'code' || currentItem.mime_type?.startsWith('text/') || currentItem.name.endsWith('.txt') || currentItem.name.endsWith('.md') || currentItem.name.endsWith('.json');

      if (isCsv || isText) {
        setIsLoadingContent(true);
        fetch(streamUrl)
          .then((r) => r.text())
          .then((text) => {
            if (isCsv) {
              const rows = text
                .split('\n')
                .filter((line) => line.trim())
                .map((row) => row.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
              setCsvRows(rows);
            } else {
              setTextContent(text);
            }
          })
          .catch((err) => console.error(err))
          .finally(() => setIsLoadingContent(false));
      }
    }
  }, [currentItem?.id]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (activeModal !== 'preview') return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft' && hasPrev) handlePrev();
      if (e.key === 'ArrowRight' && hasNext) handleNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, hasPrev, hasNext, currentFileIndex]);

  if (activeModal !== 'preview' || !currentItem) return null;

  const handlePrev = () => {
    if (hasPrev) {
      useDriveStore.getState().openModal('preview', files[currentFileIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      useDriveStore.getState().openModal('preview', files[currentFileIndex + 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0e0e0e]/95 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in text-white">
      {/* Top Header Bar */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <button
            onClick={closeModal}
            className="p-2 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
            title="Close"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {getFileCategoryIcon(currentItem.category, 'w-5 h-5 shrink-0')}

          <div className="min-w-0">
            <h3 className="font-medium text-sm truncate max-w-sm sm:max-w-md md:max-w-xl text-white">
              {currentItem.name}
            </h3>
            <span className="text-[11px] text-gray-400">
              {formatBytes(currentItem.size)}
            </span>
          </div>

          <button
            onClick={() => toggleStar(currentItem.id)}
            className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-amber-400 ml-1 transition-colors"
            title={currentItem.is_starred ? 'Starred' : 'Star'}
          >
            <Star
              className={`w-4 h-4 ${
                currentItem.is_starred ? 'text-amber-400 fill-amber-400' : ''
              }`}
            />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {currentItem.category === 'image' && (
            <div className="flex items-center bg-white/10 rounded-full p-0.5 mr-2">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 hover:bg-white/15 rounded-full text-gray-300 hover:text-white"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="px-2 text-xs font-mono text-gray-300 hover:text-white"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-1.5 hover:bg-white/15 rounded-full text-gray-300 hover:text-white"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 hover:bg-white/15 rounded-full text-gray-300 hover:text-white border-l border-white/10 ml-1 pl-2"
                title="Rotate clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}

          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="p-2 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>

          <a
            href={streamUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </a>

          <button
            onClick={closeModal}
            className="p-2 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Workspace */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        {/* Previous File Arrow */}
        {hasPrev && (
          <button
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white shadow-xl transition-all"
            title="Previous file"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next File Arrow */}
        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white shadow-xl transition-all"
            title="Next file"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Content Renderers */}
        <div className="w-full h-full flex items-center justify-center overflow-auto max-w-6xl">
          {currentItem.category === 'image' && (
            <div className="transition-transform duration-150 flex items-center justify-center">
              <img
                src={streamUrl}
                alt={currentItem.name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  maxHeight: 'calc(100vh - 160px)',
                  maxWidth: 'calc(100vw - 120px)'
                }}
                className="object-contain rounded-lg shadow-2xl transition-transform"
              />
            </div>
          )}

          {currentItem.category === 'video' && (
            <video
              src={streamUrl}
              controls
              autoPlay
              className="max-h-[calc(100vh-160px)] max-w-full rounded-2xl shadow-2xl bg-black"
            >
              Your browser does not support HTML5 video preview.
            </video>
          )}

          {currentItem.category === 'audio' && (
            <div className="bg-[#1f1f1f] p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-6 max-w-md w-full">
              <div className="w-24 h-24 rounded-full bg-[#f29900]/20 flex items-center justify-center text-[#f29900]">
                {getFileCategoryIcon('audio', 'w-12 h-12')}
              </div>
              <div className="text-center">
                <h4 className="font-medium text-lg text-white mb-1">{currentItem.name}</h4>
                <p className="text-xs text-gray-400">{formatBytes(currentItem.size)}</p>
              </div>
              <audio src={streamUrl} controls autoPlay className="w-full" />
            </div>
          )}

          {currentItem.category === 'pdf' && (
            <iframe
              src={streamUrl}
              title={currentItem.name}
              className="w-full h-[calc(100vh-140px)] rounded-xl border border-white/10 shadow-2xl bg-white"
            />
          )}

          {csvRows && (
            <div className="w-full h-[calc(100vh-160px)] bg-white text-gray-900 rounded-2xl overflow-auto shadow-2xl border border-white/10 p-4">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {csvRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx === 0 ? 'bg-gray-100 font-semibold' : 'border-b border-gray-100 hover:bg-gray-50'}
                    >
                      <td className="p-2 border-r border-gray-200 text-gray-400 select-none w-10 text-center font-mono">
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border-r border-gray-100">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {textContent !== null && (
            <div className="w-full h-[calc(100vh-160px)] bg-[#1e1e1e] text-gray-200 rounded-2xl p-6 font-mono text-xs overflow-auto border border-white/10 shadow-2xl">
              <pre className="whitespace-pre-wrap leading-relaxed">{textContent}</pre>
            </div>
          )}

          {isLoadingContent && (
            <div className="text-gray-400 text-sm animate-pulse">Loading preview...</div>
          )}

          {/* Fallback for other formats */}
          {currentItem.category !== 'image' &&
            currentItem.category !== 'video' &&
            currentItem.category !== 'audio' &&
            currentItem.category !== 'pdf' &&
            !csvRows &&
            textContent === null &&
            !isLoadingContent && (
              <div className="bg-[#1f1f1f] p-10 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center text-center max-w-sm">
                <div className="p-5 bg-white/5 rounded-3xl mb-4">
                  {getFileCategoryIcon(currentItem.category, 'w-16 h-16')}
                </div>
                <h4 className="font-medium text-base text-white mb-2">{currentItem.name}</h4>
                <p className="text-xs text-gray-400 mb-6">
                  No preview available for this file type ({formatBytes(currentItem.size)}).
                </p>
                <a
                  href={downloadUrl}
                  download
                  className="px-6 py-2.5 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-sm font-medium rounded-full shadow transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download file</span>
                </a>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
