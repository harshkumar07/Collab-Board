import React from 'react';
import { X } from 'lucide-react';

interface DialogBoxProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DialogBox: React.FC<DialogBoxProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you absolutely sure?",
  message = "This action cannot be undone. This will permanently clear the board for everyone." 
}) => {
  if (!isOpen) return null;

  return (
    // Fixed inset-0 ensures it stays in the viewport center even if the page is long
    <div className="fixed top-80 inset-0 flex items-center justify-center p-4 sm:p-0">
      
      {/* 1. Backdrop Overlay: Must be 'fixed inset-0' to cover the whole screen */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* 2. Dialog Content: Perfectly Centered Card */}
      <div className="relative z-[1000] w-full max-w-[440px] shadow-2xl rounded-xl border border-slate-800 bg-slate-950 p-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center justify-between">
             <h3 className="text-lg font-semibold text-slate-50 tracking-tight leading-none">
               {title}
             </h3>
             <div 
               onClick={onClose}
               className="relative left-3 bottom-4 rounded-md p-1 text-slate-400 opacity-70 transition-all hover:opacity-100 hover:bg-slate-800 bg-none"
             >
               <X size={18} />
             </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer: Right-aligned buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-3">
          <button
            onClick={onClose}
            className="mt-3 sm:mt-0 inline-flex items-center justify-center rounded-md border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-50 transition-colors hover:bg-slate-800 focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 shadow-lg focus:outline-none"
          >
            Yes, clear board
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogBox;