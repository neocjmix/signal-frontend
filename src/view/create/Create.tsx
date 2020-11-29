import React, {SyntheticEvent, useContext, useState} from 'react';
import './Create.scss'
import Loading from "../../component/Loading";
import {api} from "../../infrastructure/api";
import Advertisement from "../../component/Advertisement";
import {useHistory} from 'react-router-dom';
import {appContext} from "../../App/AppStore";
import {ROOM_TYPE} from "../../enum";

const Create = () => {
  const {connectionId, clientId} = useContext(appContext);
  const history = useHistory();
  const [password, setPassword] = useState("");
  const [isCreatingRoom, setCreatingRoom] = useState(false);
  const formSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setCreatingRoom(true)
    try {
      const {roomPassword, roomType} = Object.fromEntries<FormDataEntryValue>(
        new FormData(e.target as HTMLFormElement).entries()
      );
      if(connectionId == null){
        throw new Error("no connection id.");
      }
      const {roomCode} = await api.createRoom({
        clientId,
        connectionId,
        roomPassword: roomPassword.toString(),
        roomType : roomType as ROOM_TYPE,
      });
      history.push(`/${roomCode}`);
    } finally {
      setCreatingRoom(false);
    }
  };

  return <>
    <section className="create">
      <Loading tag="main" isLoading={isCreatingRoom}>
        <form className="controls" onSubmit={formSubmit}>
          <label>
            통화 타입
          </label>
          <div className="control-group">
            <div className="flex-1">
              <input id="room-type-audio" className="control" type="radio" name="roomType" value={ROOM_TYPE.VIDEO}
                     defaultChecked/>
              <label htmlFor="room-type-audio">영상</label>
            </div>
            <div className="flex-1">
              <input id="room-type-video" className="control" type="radio" name="roomType" value={ROOM_TYPE.AUDIO}
                     disabled/>
              <label htmlFor="room-type-video">음성</label>
            </div>
          </div>
          <label htmlFor="room-password">입장 비밀번호</label>
          <input id="room-password" type="password" name="roomPassword" className="input big control password"
                 placeholder="없음"
                 value={password} onChange={e => setPassword(e.target.value)}/>
          <button type="submit" className="button big control enter">
            <span className="icon">✨</span>만들기
          </button>
        </form>
      </Loading>
      <footer>
        <Advertisement/>
      </footer>
    </section>
  </>;
};

export default Create;