import {GlobalLogger} from "../component/Log";

const {REACT_APP_WEB_SOCKET_ID, REACT_APP_REGION, REACT_APP_STAGE} = process.env;
const WEB_SOCKET_API_URL = `wss://${REACT_APP_WEB_SOCKET_ID}.execute-api.${REACT_APP_REGION}.amazonaws.com/${REACT_APP_STAGE}`;
const RECONNECT_INTERVAL = 1000;
const NOOP = () => {};

type ConnectHandler = (connectionId: string) => void;
type MessageHandler = ({message, from}: {message: any, from: string}) => void;
type OnMessageCallback = (payload: any, from: string) => void;

let socket:WebSocket;
let waitForConnected:Promise<Event>;
let handleMessage:MessageHandler = NOOP;
let handleConnect:ConnectHandler = NOOP;

(async function connect() {
  socket = new WebSocket(WEB_SOCKET_API_URL);
  socket.addEventListener('message', ({data}) => handleMessage(JSON.parse(data)));
  socket.addEventListener('close',() => {
    GlobalLogger.log(`Socket is closed. Reconnect will be attempted in ${RECONNECT_INTERVAL}ms.`);

    setTimeout(() => {
      GlobalLogger.log('reconnecting...');
      connect();
    }, RECONNECT_INTERVAL);
  })

  waitForConnected = new Promise<Event>(resolve => socket.addEventListener('open', e => {
    GlobalLogger.log('ws connected');
    resolve(e);
  }))

  await waitForConnected;

  socket.send(''); //아무 메시지나 보내서 응답에 있는 connectionId를 promise로 넘겨준다.
  socket.addEventListener('message', e => handleConnect(JSON.parse(e.data).connectionId), {once: true});
})();

export const sendMessage = async (connectionId: string, type: string, payload: any) => {
  await waitForConnected;
  socket.send(JSON.stringify({
    connectionId,
    message: {
      type,
      payload
    }
  }));
};

export const onMessage = (type: string | number, callback: OnMessageCallback) => {
  const prevMessageHandler = handleMessage;
  handleMessage = ({message, from}) => {
    prevMessageHandler({message, from});
    if (message?.type === type) callback(message?.payload, from);
  }
  return () => callback = NOOP
};

export const onConnect = (callback: ConnectHandler) => {
  const prevConnectHandler = handleConnect;
  handleConnect = (connectionId:string) => {
    prevConnectHandler(connectionId);
    callback(connectionId);
  }
  return () => callback = NOOP
};