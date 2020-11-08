import React, {useContext} from 'react';
import './CreateResult.scss'
import Loading from "../component/Loading";
import Advertisement from "../component/Advertisement";
import {BASENAME} from "../App";
import {AppContext, appContext} from "../App/AppStore";
import copy from "clipboard-copy";

const CreateResult = () => {
  const {currentRoom} = useContext<AppContext>(appContext);
  const roomURL = `${window.location.protocol}//${window.location.hostname}${BASENAME}${currentRoom}`;
  const copyURL = async () => {
    await copy(roomURL);
    alert("클립보드로 복사되었습니다.")
  };
  const shareURL = () => navigator.share({title: document.title, url: roomURL});

  return <>
    <section className="create-result">
      <Loading tag="main" isLoading={false}>
        <form className="controls" onSubmit={e => e.preventDefault()}>
          <label htmlFor="room-url">영상통화가 만들어졌습니다.</label>
          <input id="room-url" type="url" readOnly className="input big control" value={roomURL}/>

          <div className="control-group">
            <div className="flex-col flex-3">
              <button type="submit" className="button big control enter" onClick={copyURL}>
                복사
              </button>
            </div>
            <div className="flex-col flex-3">
              <button type="submit" className="button big control enter" onClick={shareURL}>
                공유
              </button>
            </div>
            <div className="flex-col flex-5">
              <a href={`/${currentRoom}`} className="button big control enter">
                <span className="icon">🚪</span>입장
              </a>
            </div>
          </div>
        </form>
      </Loading>
      <footer>
        <Advertisement/>
      </footer>
    </section>
  </>;
};

export default CreateResult;