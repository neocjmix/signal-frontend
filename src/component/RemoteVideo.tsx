import React, {useCallback, useEffect, useRef, useState} from 'react';
import './LocalVideo.scss'

const RemoteVideo = ({onLoad = () => {}}: { onLoad?: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStream = useRef<MediaStream>();
  const onLoadref = useRef<() => void>(onLoad);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    onLoadref.current = onLoad
  }, [onLoad])

  const initVideo = useCallback(async (videoElement: HTMLVideoElement) => {
    mediaStream.current = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
    if (videoElement) videoElement.srcObject = mediaStream.current;
    await new Promise(resolve => videoElement.addEventListener('play', resolve, {once: true}));
    setLoaded(true)
    onLoadref.current();
  }, []);

  useEffect(() => {
    if (videoRef.current) initVideo(videoRef?.current)
  }, [initVideo])

  useEffect(() => () => {
    mediaStream?.current?.getTracks()?.forEach((track: MediaStreamTrack) => track.stop());
  }, [mediaStream])

  return (
    <div className={`remote-video ${loaded ? '' : 'unloaded'}`}>
      <video autoPlay muted playsInline ref={videoRef} style={{transform: `rotateY(180deg)`}}/>
    </div>
  );
};

export default RemoteVideo;