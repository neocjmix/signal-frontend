import React, {useContext} from 'react';
import './CreateResult.scss'
import {appContext} from "../../../App/AppStore";
import copy from "clipboard-copy";
import classNames from "classnames";

const getAppRootURL = () => `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ""}`;

const CreateResult = ({visible, onEnter}: { visible: boolean, onEnter: () => void }) => {
  const {roomCode} = useContext(appContext);
  const roomURL = `${getAppRootURL()}/${roomCode}`;
  const copyURL = async () => {
    await copy(roomURL);
    alert("클립보드로 복사되었습니다.")
  };
  const shareURL = () => navigator.share && navigator.share({title: document.title, url: roomURL});

  return (
    <div id="create-result" className={classNames("controls", {visible})}>
      <label htmlFor="room-url">영상통화가 만들어졌습니다.</label>
      <input id="room-url" type="url" readOnly className="input big control" value={roomURL}/>

      <div className="control-group">
        <div className="flex-col flex-3">
          <button className="button big control enter" onClick={copyURL}>
            복사
          </button>
        </div>
        <div className="flex-col flex-3">
          <button className="button big control enter" onClick={shareURL}>
            공유
          </button>
        </div>
        <div className="flex-col flex-5">
          <button className="button big control enter" onClick={onEnter}>
            <span className="icon">🚪</span>
            입장
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateResult;