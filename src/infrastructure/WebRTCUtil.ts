import {onMessage, sendMessage} from "./message";
import {noop, throwError} from "../util";

type WebRTCUtilOptions = {
  remoteConnectionId: string | null,
  iceServerUrls: string[],
  onConnect: () => void,
  onDisconnect: () => void,
  onFail: () => void,
  onError: (error: Error) => void,
};

type WebRTCUtilOptionsOptional = {
  remoteConnectionId?: string | null,
  iceServerUrls?: string[],
  onConnect?: () => void,
  onDisconnect?: () => void,
  onFail?: () => void,
  onError?: (error: Error) => void,
};

export class WebRTCUtil {
  private readonly listeningCancelers: (() => void)[] = []
  private readonly options: WebRTCUtilOptions
  private rtcPeerConnection: RTCPeerConnection;
  private localMediaStream: MediaStream | undefined;
  remoteMediaStream: MediaStream;

  constructor({
                remoteConnectionId = null,
                iceServerUrls = [],
                onConnect = noop,
                onDisconnect = noop,
                onFail = noop,
                onError = throwError,
              }: WebRTCUtilOptionsOptional) {
    this.options = {
      remoteConnectionId,
      iceServerUrls,
      onConnect,
      onDisconnect,
      onFail,
      onError,
    }

    this.remoteMediaStream = new MediaStream();
    this.rtcPeerConnection = new RTCPeerConnection({iceServers: [{urls: iceServerUrls}]})

    this.rtcPeerConnection.addEventListener(
      'signalingstatechange',
      () => {
        console.log(Date.now(), 'signalingstatechange', this.rtcPeerConnection.signalingState);
      },
    )

    this.rtcPeerConnection.addEventListener('negotiationneeded', () => {
      console.log(Date.now(), 'negotiationneeded');
      return this.sendOffer();
    })

    this.rtcPeerConnection.addEventListener('track', async ({track}) => {
      console.log(Date.now(), 'track');
      await this.waitStable()
      console.log(Date.now(), 'addTrack');
      this.remoteMediaStream.addTrack(track)
    })

    this.rtcPeerConnection.addEventListener('icecandidate', ({candidate}) => {
      console.log(Date.now(), 'icecandidate');
      if (candidate != null) return this.sendIceCandidate(candidate)
    });

    this.rtcPeerConnection.addEventListener('connectionstatechange', () => {
      console.log(Date.now(), 'connectionstatechange', this.rtcPeerConnection.connectionState);
      switch (this.rtcPeerConnection.connectionState) {
        case "connected":
          onConnect()
          break;
        case "disconnected":
          onDisconnect()
          break;
        case "failed":
          onFail()
          break;
      }
    })

    this.listeningCancelers.push(onMessage('ICE', async candidateInit => {
      console.log(Date.now(), 'ICE');
      if (!candidateInit) return;
      await this.waitStable();
      await this.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidateInit));
    }));

    this.listeningCancelers.push(onMessage('SDP', async (descriptionInit, from) => {
      console.log(Date.now(), 'SDP', descriptionInit?.type, from);
      this.options.remoteConnectionId = from;
      const rtcSessionDescription = new RTCSessionDescription(descriptionInit);
      try {
        await this.rtcPeerConnection.setRemoteDescription(rtcSessionDescription);
        if (descriptionInit.type === 'offer') {
          await this.sendAnswer();
        }
      } catch (e) {
        this.options.onError(e);
      }
    }))
  }

  private waitStable() {
    return new Promise<void>(resolve => {
      if (this.rtcPeerConnection.signalingState === "stable") {
        return resolve();
      }
      this.rtcPeerConnection.addEventListener(
        'signalingstatechange',
        () => resolve(this.waitStable()),
        {once: true}
      )
    })
  }

  private async sendIceCandidate(candidate: RTCIceCandidate) {
    try {
      await sendMessage(this.options.remoteConnectionId, 'ICE', candidate);
    } catch (e) {
      this.options.onError(e)
    }
  }

  private async sendAnswer() {
    try {
      const rtcSessionDescriptionInit = await this.rtcPeerConnection.createAnswer();
      await this.rtcPeerConnection.setLocalDescription(rtcSessionDescriptionInit);
      console.log(Date.now(), 'sendAnswer');
      await sendMessage(this.options.remoteConnectionId, 'SDP', rtcSessionDescriptionInit);
    } catch (e) {
      this.options.onError(e)
    }
  }

  private async sendOffer() {
    if (!this.options.remoteConnectionId) return;

    try {
      const rtcSessionDescriptionInit = await this.rtcPeerConnection.createOffer({iceRestart: true});
      await this.rtcPeerConnection.setLocalDescription(rtcSessionDescriptionInit);
      console.log(Date.now(), 'sendOffer');
      await sendMessage(this.options.remoteConnectionId, 'SDP', rtcSessionDescriptionInit)
    } catch (e) {
      this.options.onError(e)
    }
  }

  connect(remoteConnectionId: string) {
    this.options.remoteConnectionId = remoteConnectionId
  }

  addLocalMediaStream(mediaStream: MediaStream) {
    this.localMediaStream = mediaStream;
    if (this.rtcPeerConnection.signalingState === "closed") return;
    console.log(Date.now(), 'addLocalMediaStream');
    mediaStream.getTracks()
      .sort((a, b) => a.kind > b.kind ? 1 : -1)
      .forEach(track => this.rtcPeerConnection.addTrack(track));
  }

  destroy() {
    while (this.listeningCancelers.length > 0) {
      const canceler = this.listeningCancelers.pop();
      if (canceler) canceler();
    }
    this.rtcPeerConnection.close();
  }
}