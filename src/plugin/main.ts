figma.showUI(__html__, { width: 1200, height: 750, title: 'GA Event Map' });

// ── helpers ──────────────────────────────────────────────
function isExportable(node: SceneNode): node is FrameNode | ComponentNode | InstanceNode {
  return node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE';
}

function collectExportable(nodes: readonly SceneNode[]): (FrameNode | ComponentNode | InstanceNode)[] {
  const result: (FrameNode | ComponentNode | InstanceNode)[] = [];
  for (const node of nodes) {
    if (isExportable(node)) {
      result.push(node);
    } else if (node.type === 'SECTION') {
      result.push(...collectExportable(node.children));
    }
  }
  return result;
}

async function exportFrame(node: FrameNode | ComponentNode) {
  const imageBytes = await node.exportAsync({
    format: 'JPG',
    constraint: { type: 'WIDTH', value: 800 },
  });
  const raw = node.getPluginData('ga-hotspots');
  return {
    id: node.id,
    name: node.name,
    width: node.width,
    height: node.height,
    imageBytes: Array.from(imageBytes),
    hotspots: raw ? JSON.parse(raw) : [],
  };
}

// ── message handler ───────────────────────────────────────
figma.ui.onmessage = async (msg: { type: string; [key: string]: any }) => {
  switch (msg.type) {

    case 'GET_PAGES': {
      const pages = figma.root.children.map(p => ({ id: p.id, name: p.name }));
      figma.ui.postMessage({ type: 'PAGES_LIST', pages, currentPageId: figma.currentPage.id });
      break;
    }

    case 'GET_FRAMES_FOR_PAGE': {
      const page = figma.root.children.find(p => p.id === msg.pageId) as PageNode;
      if (!page) break;
      await page.loadAsync();
      const allFrames = collectExportable(page.children);
      const hiddenKey = `ga-hidden-frames-${msg.pageId}`;
      const hiddenRaw = figma.root.getPluginData(hiddenKey);
      const hiddenIds: Set<string> = new Set(hiddenRaw ? JSON.parse(hiddenRaw) : []);
      const visibleFrames = allFrames.filter(f => !hiddenIds.has(f.id));
      const hiddenFrames = allFrames.filter(f => hiddenIds.has(f.id)).map(f => ({ id: f.id, name: f.name }));
      const posKey = `ga-canvas-positions-${msg.pageId}`;
      const posRaw = figma.root.getPluginData(posKey);
      figma.ui.postMessage({
        type: 'FRAMES_START',
        total: visibleFrames.length,
        positions: posRaw ? JSON.parse(posRaw) : {},
        hiddenFrames,
      });
      for (const frame of visibleFrames) {
        const data = await exportFrame(frame);
        figma.ui.postMessage({ type: 'FRAME_STREAM', frame: data });
      }
      figma.ui.postMessage({ type: 'FRAMES_DONE' });
      break;
    }

    case 'HIDE_FRAME': {
      const hiddenKey = `ga-hidden-frames-${msg.pageId}`;
      const hiddenRaw = figma.root.getPluginData(hiddenKey);
      const hiddenIds: string[] = hiddenRaw ? JSON.parse(hiddenRaw) : [];
      if (!hiddenIds.includes(msg.frameId)) {
        hiddenIds.push(msg.frameId);
        figma.root.setPluginData(hiddenKey, JSON.stringify(hiddenIds));
      }
      break;
    }

    case 'SHOW_FRAME': {
      console.log('[SHOW_FRAME] triggered, frameId:', msg.frameId, 'pageId:', msg.pageId);
      const hiddenKey = `ga-hidden-frames-${msg.pageId}`;
      const hiddenRaw = figma.root.getPluginData(hiddenKey);
      const hiddenIds: string[] = hiddenRaw ? JSON.parse(hiddenRaw) : [];
      figma.root.setPluginData(hiddenKey, JSON.stringify(hiddenIds.filter(id => id !== msg.frameId)));
      const page = figma.root.children.find(p => p.id === msg.pageId) as PageNode;
      console.log('[SHOW_FRAME] page found:', !!page);
      if (page) await page.loadAsync();
      const node = await figma.getNodeByIdAsync(msg.frameId);
      console.log('[SHOW_FRAME] node found:', !!node, 'type:', (node as any)?.type);
      if (node && isExportable(node)) {
        const data = await exportFrame(node);
        console.log('[SHOW_FRAME] exportFrame done, posting FRAME_SHOWN');
        figma.ui.postMessage({ type: 'FRAME_SHOWN', frame: data });
      } else {
        console.log('[SHOW_FRAME] node not exportable or not found, nothing sent to UI');
      }
      break;
    }

    case 'REFRESH_FRAME': {
      const node = await figma.getNodeByIdAsync(msg.frameId);
      if (node && isExportable(node)) {
        const data = await exportFrame(node);
        figma.ui.postMessage({ type: 'FRAME_REFRESHED', frame: data });
      }
      break;
    }

    case 'SAVE_HOTSPOTS': {
      const node = await figma.getNodeByIdAsync(msg.frameId);
      if (node && isExportable(node)) {
        node.setPluginData('ga-hotspots', JSON.stringify(msg.hotspots));
      }
      break;
    }

    case 'SAVE_POSITIONS': {
      const posKey = msg.pageId ? `ga-canvas-positions-${msg.pageId}` : 'ga-canvas-positions';
      figma.root.setPluginData(posKey, JSON.stringify(msg.positions));
      break;
    }

    case 'EXPORT_HOTSPOTS': {
      const page = figma.root.children.find(p => p.id === msg.pageId) as PageNode;
      if (!page) break;
      await page.loadAsync();
      const allFrames = collectExportable(page.children);
      const exportData = allFrames
        .map(f => {
          const raw = f.getPluginData('ga-hotspots');
          return { frameName: f.name, hotspots: raw ? JSON.parse(raw) : [] };
        })
        .filter(f => f.hotspots.length > 0);
      figma.ui.postMessage({ type: 'EXPORT_DATA', data: exportData, pageName: page.name });
      break;
    }

    case 'IMPORT_HOTSPOTS': {
      const page = figma.root.children.find(p => p.id === msg.pageId) as PageNode;
      if (!page) break;
      await page.loadAsync();
      const allFrames = collectExportable(page.children);
      let imported = 0;
      for (const item of msg.data as { frameName: string; hotspots: any[] }[]) {
        const frame = allFrames.find(f => f.name === item.frameName);
        if (frame && item.hotspots?.length > 0) {
          frame.setPluginData('ga-hotspots', JSON.stringify(item.hotspots));
          imported++;
        }
      }
      figma.ui.postMessage({ type: 'IMPORT_DONE', imported });
      break;
    }

    case 'RESIZE':
      figma.ui.resize(msg.width, msg.height);
      break;

    case 'CLOSE':
      figma.closePlugin();
      break;
  }
};
