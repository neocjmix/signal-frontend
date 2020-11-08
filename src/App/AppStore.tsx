import React, {createContext, ReactNode, useState} from 'react';

export interface AppContext {
  currentRoom: number | null,
  setCurrentRoom: (currentRoom: number | null) => void
}

export const appContext = createContext<AppContext>({
  currentRoom: null,
  setCurrentRoom: () => {
  }
});

const AppStore = ({children}: { children: ReactNode }) => {
  const [currentRoom, setCurrentRoom] = useState<number | null>(null)
  return (
    <appContext.Provider value={{currentRoom, setCurrentRoom}}>
      {children}
    </appContext.Provider>
  );
};

export default AppStore;