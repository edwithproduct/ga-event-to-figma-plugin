import { useAppContext } from '../../context/AppContext.jsx';
import { sendToPlugin } from '../../utils/figma.js';

export default function AppHeader({ onRefresh, loading, pages, activePage, switchPage }) {
  const { state, dispatch } = useAppContext();
  return (
    <header className="flex flex-col bg-white border-b border-[#EBEEF3] flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-2.5 h-12">
        <span className="text-sm font-semibold text-[#00112A]">GA Event Map</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1 rounded-lg text-xs text-[#636E82] hover:bg-[#EBEEF3] disabled:opacity-40"
          >
            {loading ? '載入中...' : '↻ 同步 Frames'}
          </button>
          <div className="flex items-center gap-1 bg-[#F3F7FA] rounded-lg p-1">
            {['View', 'Edit'].map(m => (
              <button
                key={m}
                onClick={() => dispatch({ type: 'SET_EDIT_MODE', payload: m === 'Edit' })}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  (m === 'Edit') === state.editMode ? 'bg-white text-[#00112A] shadow-sm' : 'text-[#636E82]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <button onClick={() => sendToPlugin({ type: 'CLOSE' })} className="text-[#B4B8C1] hover:text-[#636E82] text-lg leading-none px-1">×</button>
        </div>
      </div>
      {pages && pages.length > 1 && (
        <div className="flex items-center gap-1 px-4 py-1.5 bg-[#2C3659]">
          {pages.map(p => (
            <button
              key={p.id}
              onClick={() => switchPage(p.id)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                activePage?.id === p.id
                  ? 'bg-white text-[#2C3659] font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
