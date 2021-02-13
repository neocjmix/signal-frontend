import React, {Fragment, useCallback, useContext, useEffect, useState} from 'react';
import './Room.scss'
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

const getRemoteConnectionInfo = (room: RoomResponse, localClientId: string) => Object
  .entries(room.members)
  .map(([roomClientId, connectionId]) => ({roomClientId, connectionId}))
  .find(({roomClientId}) => roomClientId !== localClientId)

const Room = () => {
  const {roomCode, connectionId, clientId, mode} = useContext(appContext);
  const history = useHistory();


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
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if(mode === 'dev'){
      const temp = window.console.log;
      window.console.log = (...args:any[]) => {
        const date = new Date();
        setLogs(logs => logs.concat(date.toLocaleString() + `.${date.getMilliseconds()}\t` + args.join()))
        return temp(...args);
      }
    }
  }, [mode])



  // room preserving
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
      onDisconnect: () => setIsConnected(false),
      onConnect: () => setIsConnected(true),
      onError: handleGlobalError,
      iceServerUrls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
      onStateChange: (states, eventName) => {
        setStates(states);
        setEventName(eventName);
      }
    });
    setWebRTCConnection(webRTCConnectionInstance)
    return () => webRTCConnectionInstance.disconnect();
  }, [clientId, connectionId])

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
    {mode === 'dev' && (
      <div style={{fontFamily:'monospace', position:'fixed', top:'3em', left:'1em', zIndex: 999999999, color:'white', fontSize: '.3em'}}>
        roomCode: {''+ roomCode}<br/>
        clientId: {''+ clientId}<br/>
        remoteClientId: {''+ remoteClientId}<br/>
        connectionId: {''+ connectionId}<br/>
        remoteConnectionId: {''+ remoteConnectionId}<br/>
        eventName: {''+ eventName}<br/>
        passwordError: {''+ passwordError}<br/>
        isPrivateRoom: {''+ isPrivateRoom}<br/>
        isLocalVideoLoaded: {''+ isLocalVideoLoaded}<br/>
        isRemoteVideoLoaded: {''+ isRemoteVideoLoaded}<br/>
        isRoomFetching: {''+ isRoomFetching}<br/>
        isRoomOpener: {''+ isRoomOpener}<br/>
        isConnected: {''+ isConnected}<br/>
        localMediaStream: {''+ localMediaStream}<br/>
        isEntered: {''+ isEntered}<br/>
        {Object.entries(states).map(([key, value]) =>
          <Fragment key={key}>{key}: {''+value}<br/></Fragment>)}
          <hr/>
        {logs.slice(-20).map((s, i) => <Fragment key={i}>{s}<br/></Fragment>)}
      </div>
    )}
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
        <Advertisement/>
      </footer>
    </section>
  </>;
};

export default Room;