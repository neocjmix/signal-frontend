const API_ID = `j2wt0t4ra7`;
const REGION = `ap-northeast-2`;
const STAGE = `production`;

const WEB_SOCKET_API_URL = `wss://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}/`;
const socket = new WebSocket(WEB_SOCKET_API_URL);

export class NoConnectionIdError implements Error {
  message: string = 'connection id not set.';
  name: string = 'NoConnectionIdError';
}

export const waitForConnected = new Promise(resolve => socket.addEventListener('open', resolve));

export const sendMessage = async (connectionId: string | null, type: string, payload: any) => {
  if (connectionId === null) throw new NoConnectionIdError();
  await waitForConnected;
  const data = JSON.stringify({
    connectionId,
    message: {
      type,
      payload
    }
  });
  socket.send(data);
};

type OnMessageCallback = (payload: any, from: string) => void;

export const onMessage = (type: string, callback: OnMessageCallback) => {
  const listener = ({data}: { data: string }) => {
    const {message, from} = JSON.parse(data);
    if (message == null) return;
    if (message.type === type) callback(message.payload, from); // 메시지, 상대방의 connectionId를 callback으로 넘겨준다.
  };
  socket.addEventListener('message', listener);
  return () => socket.removeEventListener('message', listener);
};

export const getConnectionId = async (): Promise<string> => {
  await waitForConnected;

  //아무 메시지나 보내서 응답에 있는 connectionId를 promise로 넘겨준다.
  socket.send('');
  return new Promise(resolve => {
    socket.addEventListener('message', e => resolve(JSON.parse(e.data).connectionId), {once: true});
  });
};
