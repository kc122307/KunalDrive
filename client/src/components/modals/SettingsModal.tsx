import React, { useState } from 'react';
import { X, Settings, Keyboard, HardDrive, Check } from 'lucide-react';
import { useDriveStore } from '../../store/useDriveStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatBytes } from '../../utils/formatters';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { layoutMode, setLayoutMode, openModal } = useDriveStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'general' | 'shortcuts'>('general');

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Del / Backspace', desc: 'Move selected items to trash' },
    { key: 'Ctrl + A / ⌘ + A', desc: 'Select all files and folders' },
    { key: 'Enter', desc: 'Open preview or navigate into folder' },
    { key: 'Escape', desc: 'Clear selection or close dialogs' },
    { key: '← / →', desc: 'Previous / next file in previewer' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 animate-slide-up space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-medium text-[#1f1f1f]">Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#f0f4f9] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
              activeTab === 'general'
                ? 'bg-white text-[#0b57d0] shadow-sm font-semibold'
                : 'text-[#444746] hover:text-[#1f1f1f]'
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
              activeTab === 'shortcuts'
                ? 'bg-white text-[#0b57d0] shadow-sm font-semibold'
                : 'text-[#444746] hover:text-[#1f1f1f]'
            }`}
          >
            Keyboard Shortcuts
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'general' ? (
          <div className="space-y-4 text-sm text-[#1f1f1f]">
            {/* Storage Quota */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-gray-500 uppercase tracking-wider">
                  Storage Plan
                </span>
                <button
                  onClick={() => {
                    onClose();
                    openModal('storage');
                  }}
                  className="text-xs font-semibold text-[#0b57d0] hover:underline"
                >
                  View Details
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>{formatBytes(user?.storage_used || 0)} used of {formatBytes(user?.storage_quota || 16106127360)}</span>
                <span className="font-medium text-emerald-600">Active</span>
              </div>
            </div>

            {/* Default View Mode */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <h4 className="font-medium text-sm">Default layout</h4>
                <p className="text-xs text-gray-500">Choose between grid cards or dense tabular list</p>
              </div>
              <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    layoutMode === 'grid' ? 'bg-white shadow text-[#0b57d0] font-medium' : 'text-gray-600'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    layoutMode === 'list' ? 'bg-white shadow text-[#0b57d0] font-medium' : 'text-gray-600'
                  }`}
                >
                  List
                </button>
              </div>
            </div>

            {/* Offline sync note */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="font-medium text-sm">Offline access</h4>
                <p className="text-xs text-gray-500">Persistent database and storage keep files available across browser sessions</p>
              </div>
              <div className="w-8 h-4 bg-emerald-500 rounded-full flex items-center justify-end px-1">
                <div className="w-3 h-3 bg-white rounded-full shadow" />
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 text-xs">
            {shortcuts.map((sc, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <span className="text-gray-600">{sc.desc}</span>
                <kbd className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-md font-mono text-[11px] font-semibold text-gray-800 shadow-xs">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-800 rounded-full transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
