import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);
const init = { editMode: false, selectedHotspotId: null, filterStatus: 'all', activePlatform: 'web' };

function reducer(state, action) {
  switch (action.type) {
    case 'SET_EDIT_MODE':        return { ...state, editMode: action.payload, selectedHotspotId: null };
    case 'SET_SELECTED_HOTSPOT': return { ...state, selectedHotspotId: action.payload };
    case 'SET_FILTER':           return { ...state, filterStatus: action.payload };
    case 'SET_PLATFORM':         return { ...state, activePlatform: action.payload };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be inside AppProvider');
  return ctx;
}
