figma.showUI(__html__, { width: 1200, height: 750, title: 'GA Event Map' });

// ── helpers ──────────────────────────────────────────────
function isExportable(node: SceneNode): node is FrameNode | ComponentNode {
  return node.type === 'FRAME' || node.type === 'COMPONENT';
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
      const frames = page.children.filter(isExportable);
      const data = await Promise.all(frames.map(exportFrame));
      const posKey = `ga-canvas-positions-${msg.pageId}`;
      const posRaw = figma.root.getPluginData(posKey);
      figma.ui.postMessage({
        type: 'FRAMES_DATA',
        frames: data,
        positions: posRaw ? JSON.parse(posRaw) : {},
      });
      break;
    }

    case 'REFRESH_FRAME': {
      const node = figma.getNodeById(msg.frameId);
      if (node && isExportable(node)) {
        const data = await exportFrame(node);
        figma.ui.postMessage({ type: 'FRAME_REFRESHED', frame: data });
      }
      break;
    }

    case 'SAVE_HOTSPOTS': {
      const node = figma.getNodeById(msg.frameId);
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

    case 'CLOSE':
      figma.closePlugin();
      break;
  }
};
