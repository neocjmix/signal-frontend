import React, {useContext, useEffect, useRef, useState} from 'react';
import './Room.scss'
import {api} from "../infrastructure/api";
import Loading from '../component/Loading';
import Advertisement from '../component/Advertisement';
import LocalVideo from '../component/LocalVideo';
import RemoteVideo from "../component/RemoteVideo";
import {appContext, AppContext} from "../App/AppStore";

const Room = () => {
  const {currentRoom} = useContext<AppContext>(appContext);
  const [isRoomPrivate, setRoomPrivate] = useState<boolean>(false);
  const [isLocalVideoLoaded, setLocalVideoLoaded] = useState<boolean>(false);
  const [isRemoteVideoLoaded, setRemoteVideoLoaded] = useState<boolean>(false);
  const [isRoomFetched, setRoomFetched] = useState(false);
  const [isFetchingRoomKey, setFetchingRoomKey] = useState(false);
  const [isWrongPassword, setWrongPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [roomKey, setRoomKey] = useState<string>();
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const fetchRoom = async (roomCode: number): Promise<void> => {
    try {
      const {isPrivate} = await api.getRoom(roomCode);
      setRoomPrivate(isPrivate);
    } catch (e) {
      api.handleError(e)
    } finally {
      setRoomFetched(true)
    }
  };

  const enterRoom = async () => {
    try {
      setFetchingRoomKey(true);
      setRoomKey(await api.fetchRoomKey({password}));
      setWrongPassword(false)
    } catch (e) {
      setRoomKey(undefined);
      setWrongPassword(true);
      passwordInputRef?.current?.focus();
    } finally {
      setFetchingRoomKey(false);
    }
  }

  useEffect(() => {
    if (currentRoom !== null) {
      fetchRoom(currentRoom);
    }
  }, [currentRoom])

  return <>
    <section className={`room ${roomKey ? 'entered' : ''}`}>
      <Loading tag="main" isLoading={!isRoomFetched || isFetchingRoomKey}>
        {roomKey && (
          <Loading className="remote-video-container" isLoading={!isRemoteVideoLoaded}>
            <RemoteVideo onLoad={() => setRemoteVideoLoaded(true)}/>
          </Loading>
        )}
        <Loading className="local-video-container" isLoading={!isLocalVideoLoaded}>
          <LocalVideo onLoad={() => setLocalVideoLoaded(true)}/>
        </Loading>
        <form
          className={`controls ${isRoomPrivate ? 'is-room-private' : ''} ${!isRoomFetched || roomKey ? 'hidden' : ''}`}
          onSubmit={e => {
            e.preventDefault();
            enterRoom();
          }}>
          {isRoomPrivate ? <>
              <label htmlFor="room-password" className={isWrongPassword ? 'error' : ''}>
                {isWrongPassword ? '올바른 비밀번호를 입력해주세요' : '비밀번호'}
              </label>
              <div className="control-group">
                <input id="room-password" required type="password" className="input big control password"
                       ref={passwordInputRef} value={password} onChange={e => setPassword(e.target.value)}/>
                <button type="submit" className="button big control enter">
                  <span className="icon">🚪</span> 입장
                </button>
              </div>
            </> :
            <button type="submit" className="button big control enter">
              <span className="icon">🚪</span> 입장
            </button>}
        </form>
      </Loading>
      <footer>
        <Advertisement/>
      </footer>
    </section>
  </>;
};

export default Room;