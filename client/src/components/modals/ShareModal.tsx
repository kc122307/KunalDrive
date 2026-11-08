import React, { useState, useEffect } from 'react';
import { X, Share2, Link, Copy, Check, Globe, Shield } from 'lucide-react';
import { useDriveStore } from '../../store/useDriveStore';
import { api } from '../../api/client';
import { ShareItem } from '../../types/drive';

export const ShareModal: React.FC = () => {
  const { activeModal, modalTargetItem, closeModal } = useDriveStore();
  const [share, setShare] = useState<ShareItem | null>(null);
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeModal === 'share' && modalTargetItem) {
      setIsLoading(true);
      api
        .get(`/shares/file/${modalTargetItem.id}`)
        .then((res) => {
          if (res.data.shares && res.data.shares.length > 0) {
            setShare(res.data.shares[0]);
            setPermission(res.data.shares[0].permission);
          } else {
            setShare(null);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [activeModal, modalTargetItem]);

  if (activeModal !== 'share' || !modalTargetItem) return null;

  const handleCreateOrUpdateShare = async (newPerm = permission) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/shares', {
        file_id: modalTargetItem.id,
        permission: newPerm,
        is_public: 1
      });
      setShare(res.data.share);
      setPermission(newPerm);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update share settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const getShareUrl = () => {
    if (!share) return '';
    return `${window.location.origin}?sharedToken=${share.token}`;
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 animate-slide-up space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-[#1a73e8]" />
            <h3 className="text-lg font-medium text-[#1f1f1f]">
              Share "{modalTargetItem.name}"
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* General Access Card */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#1f1f1f]">General access</h4>
                <p className="text-xs text-[#5f6368]">
                  {share ? 'Anyone with the link' : 'Restricted (Only you have access)'}
                </p>
              </div>
            </div>

            {share && (
              <select
                value={permission}
                onChange={(e) => handleCreateOrUpdateShare(e.target.value as 'viewer' | 'editor')}
                className="text-xs font-medium bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            )}
          </div>

          {!share ? (
            <button
              onClick={() => handleCreateOrUpdateShare('viewer')}
              disabled={isLoading}
              className="w-full py-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl text-xs font-medium text-[#0b57d0] transition-colors"
            >
              Enable link sharing
            </button>
          ) : (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-600 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 bg-[#0b57d0] hover:bg-[#0842a0] text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 shadow-sm transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy link'}</span>
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {share ? (
            <button
              onClick={async () => {
                await api.delete(`/shares/${share.id}`);
                setShare(null);
              }}
              className="text-xs text-red-600 hover:underline font-medium"
            >
              Revoke link
            </button>
          ) : <span />}

          <button
            onClick={closeModal}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-800 rounded-full transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

