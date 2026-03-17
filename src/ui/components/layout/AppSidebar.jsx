import { useAppContext } from '../../context/AppContext.jsx';
import { STATUS_DOT_COLORS } from '../ui/StatusBadge.jsx';

const TABS = [
  { v: 'all', l: '全部' }, { v: 'pending', l: '待實作' }, { v: 'implemented', l: '已實作' },
  { v: 'tested', l: '已測試' }, { v: 'live', l: '已上線' }, { v: 'deprecated', l: '已棄用' },
];

export default function AppSidebar({ frames }) {
  const { state, dispatch } = useAppContext();
  const { filterStatus, selectedHotspotId } = state;

  const allHotspots = frames.flatMap(f => (f.hotspots || []).map(h => ({ ...h, frameName: f.name })));
  const filtered = filterStatus === 'all' ? allHotspots : allHotspots.filter(h => h.webStatus === filterStatus || h.iosStatus === filterStatus || h.androidStatus === filterStatus);

  return (
    <aside className="w-[260px] flex-shrink-0 bg-white border-l border-[#EBEEF3] flex flex-col overflow-hidden">
      <div className="px-3 pt-3 pb-2 flex flex-wrap gap-1">
        {TABS.map(t => (
          <button key={t.v} onClick={() => dispatch({ type: 'SET_FILTER', payload: t.v })}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${filterStatus === t.v ? 'bg-[#00112A] text-white' : 'bg-[#EBEEF3] text-[#636E82] hover:bg-[#D3D7E0]'}`}>
            {t.l}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filtered.length === 0
          ? <div className="text-center py-8 text-[#B4B8C1] text-xs">無符合條件的事件</div>
          : filtered.map((h, idx) => {
            const globalIdx = allHotspots.findIndex(x => x.id === h.id);
            return (
              <div key={h.id} onClick={() => dispatch({ type: 'SET_SELECTED_HOTSPOT', payload: h.id === selectedHotspotId ? null : h.id })}
                className={`flex items-start gap-2 p-2 rounded-lg mb-0.5 cursor-pointer transition-colors ${selectedHotspotId === h.id ? 'bg-[#EBEEF3]' : 'hover:bg-[#F3F7FA]'}`}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                  style={{ backgroundColor: STATUS_DOT_COLORS[h.webStatus] || '#B4B8C1' }}>
                  {globalIdx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-[#00112A] truncate">{h.traceLabel || '(未命名)'}</div>
                  <div className="text-[10px] text-[#B4B8C1] truncate">{h.frameName}</div>
                </div>
              </div>
            );
          })
        }
      </div>
      <div className="px-3 py-2 border-t border-[#EBEEF3] text-[10px] text-[#B4B8C1]">
        {filtered.length} / {allHotspots.length} 個事件
      </div>
    </aside>
  );
}
