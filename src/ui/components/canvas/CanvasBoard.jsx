import { useRef, useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import FrameCard from './FrameCard.jsx';
import { getDisplayWidth } from '../../utils/displayWidth.js';

const PAD = 120;

export default function CanvasBoard({ frames, onAddHotspot, onUpdateHotspot, onDeleteHotspot, onMoveFrame, onRefreshFrame }) {
  const { state, dispatch } = useAppContext();
  const { editMode, selectedHotspotId } = state;
  const scrollRef = useRef();

  const [activeHotspotId, setActiveHotspotId] = useState(null);
  const [zoom, setZoom] = useState(1.0);

  // Ctrl/Cmd + Wheel zoom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function handleWheel(e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(z => {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        return Math.min(2, Math.max(0.25, +(z + delta).toFixed(1)));
      });
    }
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Sidebar → scroll to frame + open popover
  useEffect(() => {
    if (!selectedHotspotId || editMode) { setActiveHotspotId(null); return; }
    setActiveHotspotId(selectedHotspotId);
    // Find the frame containing this hotspot and scroll to it
    const frame = frames.find(f => f.hotspots.some(h => h.id === selectedHotspotId));
    if (frame && scrollRef.current) {
      const hotspot = frame.hotspots.find(h => h.id === selectedHotspotId);
      const dw = getDisplayWidth(frame.width);
      const targetX = (frame.x + (hotspot.x / 100) * dw) * zoom - scrollRef.current.clientWidth / 2;
      const targetY = (frame.y + (hotspot.y / 100) * ((frame.height / frame.width) * dw)) * zoom - scrollRef.current.clientHeight / 2;
      scrollRef.current.scrollTo({ left: Math.max(0, targetX), top: Math.max(0, targetY), behavior: 'smooth' });
    }
  }, [selectedHotspotId, frames, editMode, zoom]);

  function handleActivate(hotspotId) {
    setActiveHotspotId(hotspotId);
    dispatch({ type: 'SET_SELECTED_HOTSPOT', payload: hotspotId });
  }

  const canvasW = Math.max(1400, ...frames.map(f => f.x + getDisplayWidth(f.width) + PAD), PAD * 2);
  const canvasH = Math.max(900, ...frames.map(f => f.y + (f.height / f.width) * getDisplayWidth(f.width) + PAD), PAD * 2);

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto bg-[#E8ECF2] relative">
      {/* Spacer div to maintain scroll range matching the scaled canvas */}
      <div style={{ width: canvasW * zoom, height: canvasH * zoom, position: 'relative' }}>
        {/* Inner canvas with CSS transform scale */}
        <div
          style={{ position: 'absolute', top: 0, left: 0, width: canvasW, height: canvasH, transform: `scale(${zoom})`, transformOrigin: '0 0' }}
          onClick={() => { if (activeHotspotId) handleActivate(null); }}
        >
          {frames.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#B4B8C1] gap-3">
              <div className="text-4xl">🖼️</div>
              <div className="text-sm">目前頁面沒有 Frame</div>
              <div className="text-xs">請在 Figma 畫布上建立 Frame 後重新整理</div>
            </div>
          )}
          {frames.map(frame => {
            const frameHotspots = frame.hotspots || [];
            const isActive = frameHotspots.some(h => h.id === activeHotspotId);
            return (
              <FrameCard
                key={frame.id}
                frame={frame}
                editMode={editMode}
                zoom={zoom}
                activeHotspotId={isActive ? activeHotspotId : null}
                onHotspotActivate={handleActivate}
                onAddHotspot={(data) => onAddHotspot(frame.id, data)}
                onUpdateHotspot={(hotspotId, data) => onUpdateHotspot(frame.id, hotspotId, data)}
                onDeleteHotspot={(hotspotId) => onDeleteHotspot(frame.id, hotspotId)}
                onMove={(x, y) => onMoveFrame(frame.id, x, y)}
                onRefresh={() => onRefreshFrame(frame.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Zoom controls (sticky bottom-right) */}
      <div className="sticky bottom-4 float-right mr-4 flex items-center gap-1 bg-white rounded-lg shadow border border-[#EBEEF3] px-2 py-1.5 z-50 select-none">
        <button
          onClick={() => setZoom(z => Math.max(0.25, +(z - 0.1).toFixed(1)))}
          className="w-6 h-6 flex items-center justify-center text-[#636E82] hover:text-[#00112A] hover:bg-[#F3F5F8] rounded text-base font-medium"
        >−</button>
        <button
          onClick={() => setZoom(1)}
          className="w-12 text-center text-xs text-[#636E82] hover:text-[#00112A] hover:bg-[#F3F5F8] rounded py-0.5"
        >{Math.round(zoom * 100)}%</button>
        <button
          onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))}
          className="w-6 h-6 flex items-center justify-center text-[#636E82] hover:text-[#00112A] hover:bg-[#F3F5F8] rounded text-base font-medium"
        >+</button>
      </div>
    </div>
  );
}
