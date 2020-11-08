import React, {useEffect, useRef, useState} from 'react';
import {useHistory} from "react-router-dom";
import './Join.scss'

const MAX_LENGTH = 6;

const Join = () => {
  const history = useHistory();
  const [code, setCode] = useState("");
  const [isFocused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (code.length >= 6) history.push(`/${code}`)
  }, [code, history])

  return (
    <section className="join">
      <main>
        <label className={`inputs ${isFocused ? 'focus' : ''}`}>
          <input ref={inputRef} type="number"
                 inputMode="numeric"
                 value={code}
                 style={{opacity: 0, zIndex: -1, position: "absolute"}}
                 onFocus={() => setFocused(true)}
                 onBlur={() => setFocused(false)}
                 onKeyDown={e => {
                   if (e.keyCode !== 8 && !(48 <= e.keyCode && e.keyCode <= 57)) {
                     e.preventDefault();
                   }
                 }}
                 onChange={e => {
                   setCode(`${e.target.value}`.slice(0, MAX_LENGTH));
                   if (e.target.value.length >= MAX_LENGTH) {
                     inputRef?.current?.blur()
                   }
                 }}/>
          {new Array(MAX_LENGTH).fill(null)
            .map((_, i) =>
              <span key={i} className={`individual-number ${code.length === i ? 'last' : ''}`}
                    onClick={() => inputRef?.current?.focus()}>{code[i] || ' '}</span>
            )}
        </label>
      </main>
    </section>
  );
};

export default Join;