import { useRef, useState } from 'react';
import HotspotMarker from './HotspotMarker.jsx';
import HotspotPopover from './HotspotPopover.jsx';
import HotspotEditModal from '../editor/HotspotEditModal.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { getDisplayWidth } from '../../utils/displayWidth.js';

export default function FrameCard({
  frame, editMode, zoom = 1,
  activeHotspotId, onHotspotActivate,
  onAddHotspot, onUpdateHotspot, onDeleteHotspot,
  onMove, onRefresh,
}) {
  const bodyRef = useRef();
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [optimistic, setOptimistic] = useState({});
  // View mode: click marker → show popover + sync sidebar
  function handleMarkerSelect(hotspot) {
    if (editMode) return;
    const isOff = activeHotspotId === hotspot.id;
    onHotspotActivate(isOff ? null : hotspot.id);
  }

  // Edit mode: click body → add hotspot
  function handleBodyClick(e) {
    if (!editMode || e.target !== e.currentTarget) return;
    const rect = bodyRef.current.getBoundingClientRect();
    setEditModal({ mode: 'add', x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }

  // Drag card (header)
  function handleHandleMouseDown(e) {
    if (!editMode) return;
    e.stopPropagation(); e.preventDefault();
    const startClientX = e.clientX, startClientY = e.clientY;
    const startFX = frame.x, startFY = frame.y;
    function mv(me) { onMove(startFX + (me.clientX - startClientX) / zoom, startFY + (me.clientY - startClientY) / zoom); }
    function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); }
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup', up);
  }

  function handleDragUpdate(hotspot, x, y, persist) {
    setOptimistic(p => ({ ...p, [hotspot.id]: { x, y } }));
    if (persist) {
      onUpdateHotspot(hotspot.id, { x, y });
      setOptimistic(p => { const n = { ...p }; delete n[hotspot.id]; return n; });
    }
  }

  async function handleEditSave(formData) {
    if (editModal?.mode === 'add') onAddHotspot({ ...formData, x: editModal.x, y: editModal.y });
    else onUpdateHotspot(editModal.hotspot.id, formData);
  }

  const activeHotspot = frame.hotspots.find(h => h.id === activeHotspotId);
  const popoverPos = (() => {
    if (!activeHotspot || !bodyRef.current) return null;
    const rect = bodyRef.current.getBoundingClientRect();
    return { x: (activeHotspot.x / 100) * rect.width / zoom, y: (activeHotspot.y / 100) * rect.height / zoom };
  })();

  return (
    <div style={{ left: frame.x, top: frame.y, position: 'absolute' }}>
      {/* Header / drag handle */}
      <div
        onMouseDown={handleHandleMouseDown}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-t-xl bg-[#00112A] select-none min-w-[160px] ${editMode ? 'cursor-move' : 'cursor-default'}`}
      >
        {editMode && <span className="text-[#636E82] text-sm select-none">⠿</span>}
        <span className="flex-1 text-xs text-white/80 truncate" title={frame.name}>{frame.name}</span>
        {editMode && (
          <button
            onClick={e => { e.stopPropagation(); onRefresh(); }}
            className="text-[10px] text-white/50 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10"
            title="從 Figma 重新匯出"
          >
            ↻ 同步
          </button>
        )}
      </div>

      {/* Frame body */}
      <div
        ref={bodyRef}
        data-frame-body
        onClick={e => { e.stopPropagation(); handleBodyClick(e); }}
        className={`relative bg-white shadow-md rounded-b-xl ${editMode ? 'cursor-crosshair' : 'cursor-default'}`}
        style={{ width: getDisplayWidth(frame.width) }}
      >
        {/* Image wrapper: overflow-hidden clips image to rounded corners, pointer-events-none lets clicks pass through to body */}
        <div className="overflow-hidden rounded-b-xl pointer-events-none">
          {frame.imageUrl
            ? <img src={frame.imageUrl} alt={frame.name} className="block w-full h-auto" draggable={false} />
            : <div className="flex items-center justify-center text-[#B4B8C1] text-xs" style={{ height: 200 }}>匯出中...</div>
          }
        </div>

        {/* Hotspot markers */}
        {frame.hotspots.map((hotspot, idx) => {
          const pos = optimistic[hotspot.id];
          const h = pos ? { ...hotspot, ...pos } : hotspot;
          return (
            <HotspotMarker
              key={hotspot.id}
              hotspot={h}
              index={idx}
              editMode={editMode}
              onSelect={() => handleMarkerSelect(hotspot)}
              onDragEnd={(x, y, persist) => handleDragUpdate(hotspot, x, y, persist)}
              onDoubleClick={() => setEditModal({ mode: 'edit', hotspot })}
              onContextMenu={() => setDeleteTarget(hotspot)}
            />
          );
        })}

        {/* Popover */}
        {activeHotspot && popoverPos && (
          <HotspotPopover
            hotspot={activeHotspot}
            index={frame.hotspots.findIndex(h => h.id === activeHotspot.id)}
            position={{ x: popoverPos.x, y: popoverPos.y }}
            containerRef={bodyRef}
            zoom={zoom}
            onClose={() => onHotspotActivate(null)}
          />
        )}
      </div>

      <HotspotEditModal isOpen={!!editModal} onClose={() => setEditModal(null)} onSave={handleEditSave} initialData={editModal?.hotspot} mode={editModal?.mode} />
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { onDeleteHotspot(deleteTarget.id); setDeleteTarget(null); }} title="確認刪除熱點" message={`確定要刪除「${deleteTarget?.traceLabel || '此熱點'}」嗎？`} />
    </div>
  );
}
