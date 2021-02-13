import React, {useCallback, useEffect, useRef, useState} from 'react';
import './LocalVideo.scss'
import {noop} from "../util";

type LocalVideoProps = { onLoad?: (mediaStream: MediaStream) => void, muted?: boolean };

const LocalVideo = ({onLoad = noop, muted = false}: LocalVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStream = useRef<MediaStream>();
  const [loaded, setLoaded] = useState(false);

  const initVideo = useCallback(async (videoElement: HTMLVideoElement) => {
    mediaStream.current = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
    if (videoElement) videoElement.srcObject = mediaStream.current;
    await new Promise(resolve => videoElement.addEventListener('play', resolve, {once: true}));
    setLoaded(true)
    onLoad(mediaStream.current);
  }, [onLoad]);

  useEffect(() => {
    if (videoRef.current) initVideo(videoRef?.current)
  }, [initVideo])

  useEffect(() => () => {
    mediaStream?.current?.getTracks()?.forEach((track: MediaStreamTrack) => track.stop());
  }, [mediaStream])

  return (
    <div className={`local-video ${loaded ? '' : 'unloaded'}`}>
      <video autoPlay muted={muted} playsInline ref={videoRef} style={{transform: `rotateY(180deg)`}}/>
    </div>
  );
};

export default LocalVideo;