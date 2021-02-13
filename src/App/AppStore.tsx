import React, {createContext, Dispatch, ReactNode, SetStateAction, useState} from 'react';
import {noop} from "../util";
import useLocalStrage from "../shared/useLocalStrage";
import {v4 as uuidv4} from "uuid";

export interface AppContext {
  roomCode: string | null,
  connectionId: string | null,
  clientId: string,
  mode: string,
  setRoomCode: Dispatch<SetStateAction<string | null>>
  setConnectionId: Dispatch<SetStateAction<string | null>>
  setClientId: Dispatch<SetStateAction<string>>,
  setMode: Dispatch<SetStateAction<string>>,
}

export const appContext = createContext<AppContext>({
  roomCode: null,
  connectionId: null,
  clientId: '',
  mode: 'prod',
  setRoomCode: noop,
  setConnectionId: noop,
  setClientId: noop,
  setMode: noop,
});

const AppStore = ({children}: { children: ReactNode }) => {
  const [mode, setMode] = useState('prod');
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [clientId, setClientId] = useLocalStrage('clientId', uuidv4);

  return (
    <appContext.Provider value={{
      roomCode, setRoomCode,
      connectionId, setConnectionId,
      clientId, setClientId,
      mode, setMode
    }}>
      {children}
    </appContext.Provider>
  );
};

export default AppStore;