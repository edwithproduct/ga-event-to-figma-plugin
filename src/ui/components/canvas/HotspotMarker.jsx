import { useRef } from 'react';
import { STATUS_DOT_COLORS } from '../ui/StatusBadge.jsx';

export default function HotspotMarker({ hotspot, index, editMode, onSelect, onDragEnd, onDoubleClick, onContextMenu }) {
  const dragRef = useRef(null);
  const color = STATUS_DOT_COLORS[hotspot.webStatus] || '#B4B8C1';

  function handleMouseDown(e) {
    if (!editMode) return;
    e.stopPropagation(); e.preventDefault();
    const container = e.currentTarget.closest('[data-frame-body]');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, moved: false };

    function onMove(me) {
      if (Math.abs(me.clientX - dragRef.current.startX) > 3 || Math.abs(me.clientY - dragRef.current.startY) > 3)
        dragRef.current.moved = true;
      onDragEnd(
        Math.max(0, Math.min(100, ((me.clientX - rect.left) / rect.width) * 100)),
        Math.max(0, Math.min(100, ((me.clientY - rect.top) / rect.height) * 100)),
        false
      );
    }
    function onUp(me) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (dragRef.current.moved)
        onDragEnd(
          Math.max(0, Math.min(100, ((me.clientX - rect.left) / rect.width) * 100)),
          Math.max(0, Math.min(100, ((me.clientY - rect.top) / rect.height) * 100)),
          true
        );
      else onDoubleClick();
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return (
    <div
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, backgroundColor: color, cursor: editMode ? 'move' : 'pointer' }}
      className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md select-none z-10 hover:shadow-lg"
      onMouseDown={handleMouseDown}
      onClick={e => { e.stopPropagation(); if (!editMode) onSelect(); }}
      onDoubleClick={e => { if (editMode) { e.stopPropagation(); onDoubleClick(); } }}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); if (editMode) onContextMenu(e); }}
      title={hotspot.traceLabel}
    >
      {index + 1}
    </div>
  );
}
