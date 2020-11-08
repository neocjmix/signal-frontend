import React, {SyntheticEvent, useState} from 'react';
import './Create.scss'
import Loading from "../component/Loading";
import {api, CreateRoomFormData} from "../infrastructure/api";
import Advertisement from "../component/Advertisement";
import { useHistory } from 'react-router-dom';

const Create = () => {
  const history = useHistory();
  const [password, setPassword] = useState("");
  const [isCreatingRoom, setCreatingRoom] = useState(false);
  const formSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreatingRoom(true)
    try {
      const fromEntries = Object.fromEntries<FormDataEntryValue>(new FormData(e.currentTarget).entries());
      const {roomCode} = await api.createRoom(fromEntries as unknown as CreateRoomFormData);
      history.push(`/create/${roomCode}`);
    }finally {
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
              <input id="room-type-audio" className="control" type="radio" name="roomType" value="video"
                     defaultChecked/>
              <label htmlFor="room-type-audio">영상</label>
            </div>
            <div className="flex-1">
              <input id="room-type-video" className="control" type="radio" name="roomType" value="audio" disabled/>
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