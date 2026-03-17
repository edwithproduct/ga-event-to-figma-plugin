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
        case 'FRAMES_DATA': {
          const posMap = msg.positions || {};
          setFrames(msg.frames.map((f, idx) => ({
            ...f,
            imageUrl: bytesToDataUrl(f.imageBytes),
            hotspots: f.hotspots || [],
            x: posMap[f.id]?.x ?? (40 + (idx % 3) * COL_SPACING),
            y: posMap[f.id]?.y ?? (40 + Math.floor(idx / 3) * ROW_SPACING),
          })));
          setLoading(false);
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

  return { frames, loading, pages, activePage, switchPage, moveFrame, addHotspot, updateHotspot, deleteHotspot, refreshFrames, refreshFrame };
}
