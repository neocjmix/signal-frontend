import React, {useEffect, useRef, useState} from 'react';
import './LocalVideo.scss'
import {noop} from "../util";


type RemoteVideoProps = { muted?: boolean, mediaStream: MediaStream | null, loading?: boolean, onLoad: () => void };

const RemoteVideo = ({mediaStream, loading = false, onLoad = noop, muted = false}: RemoteVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onLoadref = useRef(onLoad);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream
    }
    setLoaded(true);
    onLoadref.current();
  }, [mediaStream])

  return (
    <div className={`remote-video ${loaded ? '' : 'unloaded'}`}>
      <video autoPlay muted={muted} playsInline ref={videoRef}
             style={{transform: `rotateY(180deg)`, opacity: loading ? 0 : 1}}/>
      {loading && <div className="loading">
        상대방의 응답을 기다리는 중입니다.
      </div>}
    </div>
  );
};

export default RemoteVideo;