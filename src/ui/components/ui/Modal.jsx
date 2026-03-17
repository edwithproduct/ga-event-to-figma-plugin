import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(0,26,64,0.5)]" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full mx-4 ${width} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBEEF3]">
          <h2 className="text-base font-semibold text-[#00112A]">{title}</h2>
          <button onClick={onClose} className="text-[#636E82] hover:text-[#00112A] text-xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}
