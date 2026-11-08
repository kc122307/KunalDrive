import React from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-[#1f1f1f] text-white rounded-2xl shadow-2xl border border-white/10 text-sm max-w-md animate-slide-up"
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}

          <span className="flex-1">{toast.message}</span>

          {toast.actionLabel && toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                removeToast(toast.id);
              }}
              className="px-2 py-0.5 text-xs font-semibold text-[#8ab4f8] hover:text-[#aecbfa] hover:bg-white/10 rounded transition-colors"
            >
              {toast.actionLabel}
            </button>
          )}

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
