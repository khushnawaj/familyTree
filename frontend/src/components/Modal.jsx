import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-[1010] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <button
          className="absolute right-4 top-4 z-[1100] flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 transition hover:rotate-90 hover:border-rose-500 hover:bg-rose-500 hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-10">{children}</div>
      </div>
    </div>
  );
}
