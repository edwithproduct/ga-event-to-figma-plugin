import { AppProvider } from './context/AppContext.jsx';
import { useFrames } from './hooks/useFrames.js';
import AppHeader from './components/layout/AppHeader.jsx';
import AppSidebar from './components/layout/AppSidebar.jsx';
import CanvasBoard from './components/canvas/CanvasBoard.jsx';

function AppInner() {
  const { frames, hiddenFrames, loading, pages, activePage, switchPage, moveFrame, addHotspot, updateHotspot, deleteHotspot, refreshFrames, refreshFrame, hideFrame, showFrame } = useFrames();

  return (
    <div className="h-screen flex flex-col bg-[#E8ECF2] overflow-hidden">
      <AppHeader onRefresh={refreshFrames} loading={loading} pages={pages} activePage={activePage} switchPage={switchPage} />
      <div className="flex flex-1 overflow-hidden">
        <CanvasBoard
          frames={frames}
          onAddHotspot={addHotspot}
          onUpdateHotspot={updateHotspot}
          onDeleteHotspot={deleteHotspot}
          onMoveFrame={moveFrame}
          onRefreshFrame={refreshFrame}
          onHideFrame={hideFrame}
        />
        <AppSidebar frames={frames} hiddenFrames={hiddenFrames} onShowFrame={showFrame} />
      </div>
    </div>
  );
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>;
}
