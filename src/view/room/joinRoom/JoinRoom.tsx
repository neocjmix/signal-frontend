import React, {useRef, useState} from 'react';
import './JoinRoom.scss'
import preventDefault from "prevent-default";
import classNames from "classnames";

type JoinRoomProps = { visible: boolean, needPassword: boolean, passwordError: boolean, onEnter: (password:string) => void };

const JoinRoom = ({visible, needPassword, passwordError, onEnter}: JoinRoomProps) => {
  const [password, setPassword] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);

  return visible ? (
    <form id="join-room"
          className={classNames({
            'controls': true,
            'visible': visible,
            'is-private-room': needPassword,
          })}
          onSubmit={preventDefault(() => onEnter(password))}>
      {needPassword ? <>
          <label htmlFor="room-password" className={passwordError ? 'error' : ''}>
            {passwordError ? '올바른 비밀번호를 입력해주세요' : '비밀번호'}
          </label>
          <div className="control-group">
            <input id="room-password" required type="password" className="input big control password"
                   ref={passwordInputRef} value={password}
                   onChange={e => setPassword(e.target.value)}/>
            <button type="submit" className="button big control enter">
              <span className="icon">🚪</span> 입장
            </button>
          </div>
        </> :
        <button type="submit" className="button big control enter">
          <span className="icon">🚪</span> 입장
        </button>}
    </form>
  ) : null;
};

export default JoinRoom;