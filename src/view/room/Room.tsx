import React, {useCallback, useContext, useEffect, useState} from 'react';
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
import {WebRTCUtil} from "../../infrastructure/WebRTCUtil";
import {handleError} from "../../infrastructure/ErrorHandler";
import {useHistory} from 'react-router-dom';
import {ERRORS} from '../../enum';

const getRemoteConnectionId = (room: RoomResponse, localClientId: string) => Object
  .entries(room.members)
  .filter(([roomClientId]) => roomClientId !== localClientId)
  .map(([, connectionId]) => connectionId)[0];

const Room = () => {
  const {roomCode, connectionId, clientId} = useContext(appContext);
  const history = useHistory();

  const [passwordError, setPasswordError] = useState(false);
  const [isPrivateRoom, setPrivateRoom] = useState(false);
  const [isLocalVideoLoaded, setLocalVideoLoaded] = useState(false);
  const [isRemoteVideoLoaded, setRemoteVideoLoaded] = useState(false);
  const [isRoomFetching, setRoomFetching] = useState(false);
  const [isRoomOpener, setIsRoomOpener] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteConnectionId, setRemoteConnectionId] = useState<string | null>(null);
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);
  const [isEntered, setEntered] = useState(false);
  const [webRTCUtil, setWebRTCUtil] = useState<WebRTCUtil>();

  useEffect(() => {
    const webRTCUtilInstance = new WebRTCUtil({
      iceServerUrls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
      onDisconnect: () => setIsConnected(false),
      onConnect: () => setIsConnected(true),
      onError: handleError,
    });
    setWebRTCUtil(webRTCUtilInstance)
    return () => webRTCUtilInstance.destroy();
  }, [])

  useEffect(() => {
    if (!roomCode || !connectionId) return
    const intervalId = setInterval(() => api.fetchRoom({roomCode, clientId, connectionId}), 60 * 1000);
    return () => clearInterval(intervalId)
  }, [roomCode, connectionId, isEntered, clientId])

  useEffect(() => {
    if (webRTCUtil && isEntered && localMediaStream) {
      webRTCUtil.addLocalMediaStream(localMediaStream)
    }
  }, [isEntered, localMediaStream, webRTCUtil])

  useEffect(() => {
    if (webRTCUtil && isEntered && remoteConnectionId) {
      webRTCUtil?.connect(remoteConnectionId)
    }
  }, [isRoomOpener, isEntered, remoteConnectionId, webRTCUtil])

  const fetchRoom = useCallback(async ({roomCode, clientId, connectionId, password = ''}: {
    roomCode: string,
    clientId: string,
    connectionId: string
    password?: string
  }) => {
    if (!webRTCUtil) return;
    setRoomFetching(true)
    try {
      const room = await api.fetchRoom({roomCode, clientId, connectionId, password});
      const remoteConnectionId = getRemoteConnectionId(room, clientId);
      if (remoteConnectionId) {
        setRemoteConnectionId(remoteConnectionId)
      } else {
        setIsRoomOpener(true)
      }
    } finally {
      setRoomFetching(false)
    }
  }, [webRTCUtil]);

  useEffect(() => {
    if (roomCode != null && webRTCUtil != null && connectionId != null) {
      fetchRoom({roomCode, clientId, connectionId}).catch(e => {
        console.log(e?.response?.data, ERRORS.ROOM_IS_FULL);
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
            return handleError(e)
        }
      });
    }
  }, [clientId, connectionId, fetchRoom, history, roomCode, webRTCUtil])

  return <>
    <section className={classNames("room", {entered: isEntered})}>
      <Loading tag="main" isLoading={isRoomFetching}>
        <Loading isLoading={!isLocalVideoLoaded} className="local-video-container">
          <LocalVideo onLoad={mediaStream => {
            setLocalVideoLoaded(true);
            setLocalMediaStream(mediaStream)
          }} muted/>
        </Loading>
        {
          (isEntered && webRTCUtil && (
            <Loading isLoading={!isRemoteVideoLoaded} className="remote-video-container">
              <RemoteVideo loading={!isConnected} mediaStream={webRTCUtil.remoteMediaStream}
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
                        if (roomCode != null && webRTCUtil != null && connectionId != null) {
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