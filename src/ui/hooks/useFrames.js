import { useState, useEffect, useRef, useCallback } from 'react';
import { sendToPlugin, onPluginMessage, bytesToDataUrl, generateId } from '../utils/figma.js';

const COL_SPACING = 460;
const ROW_SPACING = 900;

export function useFrames() {
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const saveTimer = useRef(null);
  const activePageRef = useRef(null);

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  const [hiddenFrames, setHiddenFrames] = useState([]);
  const streamIndexRef = useRef(0);
  const streamPositionsRef = useRef({});

  useEffect(() => {
    const cleanup = onPluginMessage((msg) => {
      switch (msg.type) {
        case 'PAGES_LIST': {
          setPages(msg.pages);
          const current = msg.pages.find(p => p.id === msg.currentPageId) || msg.pages[0];
          setActivePage(current);
          activePageRef.current = current;
          if (current) {
            sendToPlugin({ type: 'GET_FRAMES_FOR_PAGE', pageId: current.id });
          }
          break;
        }
        case 'FRAMES_START': {
          streamIndexRef.current = 0;
          streamPositionsRef.current = msg.positions || {};
          setFrames([]);
          setHiddenFrames(msg.hiddenFrames || []);
          break;
        }
        case 'FRAME_STREAM': {
          const idx = streamIndexRef.current++;
          const posMap = streamPositionsRef.current;
          const f = msg.frame;
          setFrames(prev => [...prev, {
            ...f,
            imageUrl: bytesToDataUrl(f.imageBytes),
            hotspots: f.hotspots || [],
            x: posMap[f.id]?.x ?? (40 + (idx % 3) * COL_SPACING),
            y: posMap[f.id]?.y ?? (40 + Math.floor(idx / 3) * ROW_SPACING),
          }]);
          break;
        }
        case 'FRAMES_DONE': {
          setLoading(false);
          break;
        }
        case 'EXPORT_DATA': {
          const json = JSON.stringify({ version: 1, frames: msg.data }, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ga-events-${msg.pageName}.json`;
          a.click();
          URL.revokeObjectURL(url);
          break;
        }
        case 'IMPORT_DONE': {
          alert(`成功匯入 ${msg.imported} 個 Frame 的標注資料，正在重新載入...`);
          const pageId = activePageRef.current?.id;
          if (pageId) sendToPlugin({ type: 'GET_FRAMES_FOR_PAGE', pageId });
          break;
        }
        case 'FRAME_SHOWN': {
          console.log('[FRAME_SHOWN] received, frameId:', msg.frame?.id, 'name:', msg.frame?.name);
          const posMap = streamPositionsRef.current;
          const f = msg.frame;
          const idx = streamIndexRef.current++;
          setHiddenFrames(prev => prev.filter(h => h.id !== f.id));
          setFrames(prev => [...prev, {
            ...f,
            imageUrl: bytesToDataUrl(f.imageBytes),
            hotspots: f.hotspots || [],
            x: posMap[f.id]?.x ?? (40 + (idx % 3) * COL_SPACING),
            y: posMap[f.id]?.y ?? (40 + Math.floor(idx / 3) * ROW_SPACING),
          }]);
          break;
        }
        case 'FRAME_REFRESHED': {
          setFrames(prev => prev.map(f =>
            f.id === msg.frame.id
              ? { ...f, imageUrl: bytesToDataUrl(msg.frame.imageBytes) }
              : f
          ));
          break;
        }
      }
    });
    sendToPlugin({ type: 'GET_PAGES' });
    return cleanup;
  }, []);

  // ── position ─────────────────────────────────────────────
  const moveFrame = useCallback((frameId, x, y) => {
    setFrames(prev => {
      const updated = prev.map(f => f.id === frameId ? { ...f, x, y } : f);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const positions = {};
        updated.forEach(f => { positions[f.id] = { x: f.x, y: f.y }; });
        sendToPlugin({ type: 'SAVE_POSITIONS', positions, pageId: activePageRef.current?.id });
      }, 400);
      return updated;
    });
  }, []);

  // ── hotspot CRUD (local + Figma) ──────────────────────────
  function mutateHotspots(frameId, mutateFn) {
    setFrames(prev => {
      return prev.map(f => {
        if (f.id !== frameId) return f;
        const hotspots = mutateFn(f.hotspots || []);
        sendToPlugin({ type: 'SAVE_HOTSPOTS', frameId, hotspots });
        return { ...f, hotspots };
      });
    });
  }

  const addHotspot = useCallback((frameId, data) => {
    mutateHotspots(frameId, (hs) => [...hs, { id: generateId(), x: 50, y: 50, traceLabel: '', traceCategory: '', traceInfo: '', webStatus: 'pending', iosStatus: 'pending', androidStatus: 'pending', notes: '', ...data }]);
  }, []);

  const updateHotspot = useCallback((frameId, hotspotId, data) => {
    mutateHotspots(frameId, (hs) => hs.map(h => h.id === hotspotId ? { ...h, ...data } : h));
  }, []);

  const deleteHotspot = useCallback((frameId, hotspotId) => {
    mutateHotspots(frameId, (hs) => hs.filter(h => h.id !== hotspotId));
  }, []);

  const refreshFrames = () => {
    setLoading(true);
    setFrames([]);
    const pageId = activePageRef.current?.id;
    if (pageId) {
      sendToPlugin({ type: 'GET_FRAMES_FOR_PAGE', pageId });
    } else {
      sendToPlugin({ type: 'GET_PAGES' });
    }
  };

  const refreshFrame = (frameId) => sendToPlugin({ type: 'REFRESH_FRAME', frameId });

  const exportHotspots = useCallback(() => {
    const pageId = activePageRef.current?.id;
    sendToPlugin({ type: 'EXPORT_HOTSPOTS', pageId });
  }, []);

  const importHotspots = useCallback((file) => {
    const pageId = activePageRef.current?.id;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        sendToPlugin({ type: 'IMPORT_HOTSPOTS', data: parsed.frames, pageId });
      } catch {
        alert('JSON 格式錯誤，請確認匯入的檔案是否正確。');
      }
    };
    reader.readAsText(file);
  }, []);

  const hideFrame = useCallback((frameId) => {
    const pageId = activePageRef.current?.id;
    setFrames(prev => {
      const frame = prev.find(f => f.id === frameId);
      if (frame) setHiddenFrames(h => [...h, { id: frame.id, name: frame.name }]);
      return prev.filter(f => f.id !== frameId);
    });
    sendToPlugin({ type: 'HIDE_FRAME', frameId, pageId });
  }, []);

  const showFrame = useCallback((frameId) => {
    const pageId = activePageRef.current?.id;
    console.log('[showFrame] sending SHOW_FRAME, frameId:', frameId, 'pageId:', pageId);
    sendToPlugin({ type: 'SHOW_FRAME', frameId, pageId });
  }, []);

  const switchPage = useCallback((pageId) => {
    setPages(prevPages => {
      const page = prevPages.find(p => p.id === pageId);
      if (!page) return prevPages;
      setActivePage(page);
      activePageRef.current = page;
      setFrames([]);
      setLoading(true);
      sendToPlugin({ type: 'GET_FRAMES_FOR_PAGE', pageId });
      return prevPages;
    });
  }, []);

  return { frames, hiddenFrames, loading, pages, activePage, switchPage, moveFrame, addHotspot, updateHotspot, deleteHotspot, refreshFrames, refreshFrame, hideFrame, showFrame, exportHotspots, importHotspots };
}
