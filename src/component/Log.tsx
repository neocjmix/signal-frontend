import React, {
  createContext,
  CSSProperties,
  Dispatch,
  Fragment,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import {noop} from "../util";

type OnLogCallback = (...args: any[]) => void;

export const GlobalLogger = ((listeners: OnLogCallback[] = []) => ({
  log: (...args: any[]) => {
    window.console.log(...args);
    listeners.forEach(listener => listener(...args))
  },
  onLog: (callback: OnLogCallback) => {
    listeners.push(callback);
    return () => listeners = listeners.filter(listener => listener !== callback)
  }
}))();

interface LoggerContext {
  logs: string[],
  showLog: boolean,
  setShowLog: Dispatch<SetStateAction<boolean>>,
  log: (...args: any[]) => void,
}

export const loggerContext = createContext<LoggerContext>({
  showLog: false,
  logs: [],
  setShowLog: noop,
  log: noop,
});

type LogProps = { state: object, maxLine?: number, style?: CSSProperties };

export const Log = ({state, maxLine = 18, style = {}}: LogProps) => {
  const {showLog, logs, log} = useContext(loggerContext);
  console.log(showLog);
  useEffect(() => {
    GlobalLogger.onLog(log)
  }, [log])

  return showLog ?
    <div style={style}>
      {Object.entries(state).map(([key, value]) =>
        <Fragment key={key}>{key}: {'' + value}<br/></Fragment>)}
      <hr/>
      {logs.slice(-maxLine).map((s, i) => <Fragment key={i}>{s}<br/></Fragment>)}
    </div> : null;
};

export const LogScope = ({children}: { children: ReactNode }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);

  const log = useCallback((...args: any[]) => {
    const date = new Date();
    window.console.log(...args);
    setLogs(logs => logs.concat(date.toLocaleString() + `.${date.getMilliseconds()}\t` + args.join()))
  }, [])

  return (
    <loggerContext.Provider value={{showLog, setShowLog, logs, log}}>
      {children}
    </loggerContext.Provider>
  );
};
