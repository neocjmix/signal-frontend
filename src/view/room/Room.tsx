import './Room.scss'
import React, {CSSProperties, useCallback, useContext, useEffect, useState} from 'react';
import Advertisement from '../../component/Advertisement';
import {appContext} from "../../App/AppStore";
import {api, RoomResponse} from "../../infrastructure/api";
import CreateResult from "./createResult/CreateResult";
import Loading from "../../component/Loading";
import LocalVideo from "../../component/LocalVideo";
import JoinRoom from "./joinRoom/JoinRoom";
import RemoteVideo from "../../component/RemoteVideo";
import classNames from "classnames";
import {WebRTCConnection} from "../../infrastructure/WebRTCConnection";
import {handleGlobalError} from "../../infrastructure/ErrorHandler";
import {useHistory} from 'react-router-dom';
import {ERRORS} from '../../enum';
import {Log, loggerContext} from "../../component/Log";

const LOG_STYLE: CSSProperties = {
  fontFamily: 'monospace',
  position: 'fixed',
  top: '3em',
  left: '1em',
  zIndex: 999999999,
  color: 'white',
  fontSize: '.3em',
  whiteSpace: 'nowrap'
};

const getRemoteConnectionInfo = (room: RoomResponse, localClientId: string) => Object
  .entries(room.members)
  .map(([roomClientId, connectionId]) => ({roomClientId, connectionId}))
  .find(({roomClientId}) => roomClientId !== localClientId)

const Room = () => {
  const history = useHistory();
  const {roomCode, connectionId, clientId} = useContext(appContext);
  const {log, setShowLog} = useContext(loggerContext);

  const [states, setStates] = useState({});
  const [eventName, setEventName] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isPrivateRoom, setPrivateRoom] = useState(false);
  const [isLocalVideoLoaded, setLocalVideoLoaded] = useState(false);
  const [isRemoteVideoLoaded, setRemoteVideoLoaded] = useState(false);
  const [isRoomFetching, setRoomFetching] = useState(false);
  const [isRoomOpener, setIsRoomOpener] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteClientId, setRemoteClientId] = useState<string | null>(null);
  const [remoteConnectionId, setRemoteConnectionId] = useState<string | null>(null);
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);
  const [isEntered, setEntered] = useState(false);
  const [webRTCConnection, setWebRTCConnection] = useState<WebRTCConnection>();

  // keep room
  useEffect(() => {
    if (!roomCode || !connectionId) return
    const intervalId = setInterval(() => api.fetchRoom({roomCode, clientId, connectionId}), 60 * 1000);
    return () => clearInterval(intervalId)
  }, [roomCode, connectionId, isEntered, clientId])

  // create webRTCConnection
  useEffect(() => {
    if (!connectionId || !clientId) return;
    const webRTCConnectionInstance = new WebRTCConnection({
      localClientId: clientId,
      localConnectionId: connectionId,
      onConnect: () => {
        if (webRTCConnectionInstance.remoteMediaStream.getTracks().length === 0) {
          webRTCConnectionInstance.reconnect()
        }
        setIsConnected(true)
      },
      onDisconnect: () => {
        webRTCConnectionInstance.reconnect();
      },
      onFail: () => setIsConnected(false),
      onError: error => {
        log(error);
        webRTCConnectionInstance.reconnect()
      },
      iceServerUrls: process.env?.REACT_APP_STUN_SERVERS?.split(','),
      onStateChange: (states, eventName) => {
        setStates(states);
        setEventName(eventName);
      }
    });
    setWebRTCConnection(webRTCConnectionInstance)
    return () => webRTCConnectionInstance.disconnect();
  }, [clientId, connectionId, log])

  // connect to remote
  useEffect(() => {
    if (!webRTCConnection || !isEntered || !remoteConnectionId || !remoteClientId) return;
    webRTCConnection.connect(remoteConnectionId, remoteClientId)
  }, [isRoomOpener, isEntered, remoteConnectionId, webRTCConnection, remoteClientId])

  useEffect(() => {
    if (webRTCConnection && isEntered && localMediaStream) {
      webRTCConnection.addLocalMediaStream(localMediaStream)
    }
  }, [isEntered, localMediaStream, webRTCConnection])

  const fetchRoom = useCallback(async ({roomCode, clientId, connectionId, password = ''}: {
    roomCode: string,
    clientId: string,
    connectionId: string
    password?: string
  }) => {
    if (!webRTCConnection) return;
    setRoomFetching(true)
    try {
      const room = await api.fetchRoom({roomCode, clientId, connectionId, password});
      const {
        connectionId: remoteConnectionId,
        roomClientId: remoteClientId
      } = getRemoteConnectionInfo(room, clientId) || {};
      if (remoteConnectionId && remoteClientId) {
        setRemoteConnectionId(remoteConnectionId)
        setRemoteClientId(remoteClientId)
      } else {
        setIsRoomOpener(true)
      }
    } finally {
      setRoomFetching(false)
    }
  }, [webRTCConnection]);

  const handleError = useCallback((e: any) => {
    switch (e?.response?.status) {
      case 403:
        if (e?.response?.data === ERRORS.ROOM_IS_FULL) {
          setTimeout(() => {
            alert("이미 다른 사람이 접속한 방입니다.")
            history.push("/join")
          }, 400)
          return;
        } else {
          setPrivateRoom(true);
          return;
        }
      case 404:
        setTimeout(() => {
          alert("없는 방입니다.")
          history.push("/join")
        }, 400)
        return;
      default:
        return handleGlobalError(e)
    }
  }, [history]);

  useEffect(() => {
    if (roomCode == null) return;
    if (webRTCConnection == null) return;
    if (connectionId == null) return;

    fetchRoom({roomCode, clientId, connectionId}).catch(handleError);
  }, [clientId, connectionId, fetchRoom, handleError, history, roomCode, webRTCConnection])

  const onLocalVideoLoad = useCallback(mediaStream => {
    setLocalVideoLoaded(true);
    setLocalMediaStream(mediaStream)
  }, []);

  return <>
    {/*<Log style={LOG_STYLE}*/}
    {/*     state={{*/}
    {/*       roomCode,*/}
    {/*       clientId,*/}
    {/*       remoteClientId,*/}
    {/*       connectionId,*/}
    {/*       remoteConnectionId,*/}
    {/*       eventName,*/}
    {/*       passwordError,*/}
    {/*       localMediaStream,*/}
    {/*       ...states,*/}
    {/*     }}/>*/}
    <section className={classNames("room", {entered: isEntered})}>
      <Loading tag="main" isLoading={isRoomFetching}>
        <Loading isLoading={!isLocalVideoLoaded} className="local-video-container">
          <LocalVideo onLoad={onLocalVideoLoad} muted/>
        </Loading>
        {
          (isEntered && webRTCConnection && (
            <Loading isLoading={!isRemoteVideoLoaded} className="remote-video-container">
              <RemoteVideo loading={!isConnected} mediaStream={webRTCConnection.remoteMediaStream}
                           onLoad={() => setRemoteVideoLoaded(true)}/>
            </Loading>
          )) ||

          (!isRoomFetching && <>
            <CreateResult visible={isRoomOpener} onEnter={async () => {
              if (!isLocalVideoLoaded) {
                alert("비디오및 오디오 접근을 허용해주세요.");
                return;
              }
              setEntered(true);
            }}/>

            <JoinRoom visible={!isRoomOpener}
                      needPassword={isPrivateRoom} passwordError={passwordError}
                      onEnter={async password => {
                        setPasswordError(false);
                        if (roomCode != null && webRTCConnection != null && connectionId != null) {
                          try {
                            await fetchRoom({connectionId, clientId, roomCode, password})
                            setEntered(true);
                          } catch (e) {
                            setPasswordError(true);
                          }
                        }
                      }}/>
          </>)
        }
      </Loading>
      <footer>
        <div onCopy={() => setShowLog(prevState => !prevState)}>
          <Advertisement/>
        </div>
      </footer>
    </section>
  </>;
};

export default Room;