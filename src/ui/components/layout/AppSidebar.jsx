import { useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import StatusBadge, { STATUS_DOT_COLORS } from '../ui/StatusBadge.jsx';


const STATUS_FILTERS = [
  { v: 'all', l: '全部' }, { v: 'pending', l: '待實作' }, { v: 'implemented', l: '已實作' },
  { v: 'tested', l: '已測試' }, { v: 'live', l: '已上線' }, { v: 'deprecated', l: '已棄用' },
];

const PLATFORMS = [
  { v: 'web',     l: 'Web',     statusKey: 'webStatus' },
  { v: 'ios',     l: 'iOS',     statusKey: 'iosStatus' },
  { v: 'android', l: 'Android', statusKey: 'androidStatus' },
];

export default function AppSidebar({ frames, hiddenFrames = [], onShowFrame }) {
  const { state, dispatch } = useAppContext();
  const { filterStatus, selectedHotspotId, activePlatform } = state;
  const [activeTab, setActiveTab] = useState('visible');

  const platform = PLATFORMS.find(p => p.v === activePlatform);
  const allHotspots = frames.flatMap(f => (f.hotspots || []).map((h, frameIdx) => ({ ...h, frameName: f.name, frameIndex: frameIdx })));
  const filtered = allHotspots.filter(h => {
    if (filterStatus === 'all') return true;
    return h[platform.statusKey] === filterStatus;
  });

  return (
    <aside className="w-[260px] flex-shrink-0 bg-white border-l border-[#EBEEF3] flex flex-col overflow-hidden">
      {/* 主 Tab */}
      <div className="flex border-b border-[#EBEEF3]">
        <button
          onClick={() => setActiveTab('visible')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'visible' ? 'text-[#00112A] border-b-2 border-[#00112A]' : 'text-[#B4B8C1] hover:text-[#636E82]'}`}
        >
          顯示中
        </button>
        <button
          onClick={() => setActiveTab('hidden')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'hidden' ? 'text-[#00112A] border-b-2 border-[#00112A]' : 'text-[#B4B8C1] hover:text-[#636E82]'}`}
        >
          已隱藏 {hiddenFrames.length > 0 && `(${hiddenFrames.length})`}
        </button>
      </div>

      {activeTab === 'visible' ? (
        <>
          {/* 平台 sub-tab */}
          <div className="flex border-b border-[#EBEEF3]">
            {PLATFORMS.map(p => (
              <button
                key={p.v}
                onClick={() => dispatch({ type: 'SET_PLATFORM', payload: p.v })}
                className={`flex-1 py-1.5 text-xs transition-colors ${activePlatform === p.v ? 'text-[#2770E7] border-b-2 border-[#2770E7] font-medium' : 'text-[#B4B8C1] hover:text-[#636E82]'}`}
              >
                {p.l}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="px-3 pt-2 pb-2 flex flex-wrap gap-1">
            {STATUS_FILTERS.map(t => (
              <button key={t.v} onClick={() => dispatch({ type: 'SET_FILTER', payload: t.v })}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${filterStatus === t.v ? 'bg-[#00112A] text-white' : 'bg-[#EBEEF3] text-[#636E82] hover:bg-[#D3D7E0]'}`}>
                {t.l}
              </button>
            ))}
          </div>

          {/* Hotspot list */}
          <div className="flex-1 overflow-y-auto px-2 py-1">
            {filtered.length === 0
              ? <div className="text-center py-8 text-[#B4B8C1] text-xs">無符合條件的事件</div>
              : filtered.map(h => {
                return (
                  <div key={h.id}
                    onClick={() => dispatch({ type: 'SET_SELECTED_HOTSPOT', payload: h.id === selectedHotspotId ? null : h.id })}
                    className={`flex items-start gap-2 p-2 rounded-lg mb-0.5 cursor-pointer transition-colors ${selectedHotspotId === h.id ? 'bg-[#EBEEF3]' : 'hover:bg-[#F3F7FA]'}`}>
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                      style={{ backgroundColor: STATUS_DOT_COLORS[h[platform.statusKey]] || '#B4B8C1' }}>
                      {h.frameIndex + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-[#00112A] truncate">{h.eventName || h.traceLabel || '(未命名)'}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#B4B8C1] truncate">{h.frameName}</span>
                        <StatusBadge status={h[platform.statusKey] || 'pending'} />
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>

          <div className="px-3 py-2 border-t border-[#EBEEF3] text-[10px] text-[#B4B8C1]">
            {filtered.length} / {allHotspots.length} 個事件
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {hiddenFrames.length === 0
            ? <div className="text-center py-8 text-[#B4B8C1] text-xs">沒有已隱藏的 Frame</div>
            : hiddenFrames.map(f => (
              <div key={f.id} className="flex items-center gap-2 px-2 py-2 rounded-lg mb-0.5 hover:bg-[#F3F7FA]">
                <span className="flex-1 text-xs text-[#636E82] truncate" title={f.name}>{f.name}</span>
                <button
                  onClick={() => onShowFrame(f.id)}
                  className="flex-shrink-0 text-[10px] text-[#636E82] hover:text-[#00112A] px-2 py-1 rounded hover:bg-[#EBEEF3] whitespace-nowrap"
                >
                  顯示
                </button>
              </div>
            ))
          }
        </div>
      )}
    </aside>
  );
}
