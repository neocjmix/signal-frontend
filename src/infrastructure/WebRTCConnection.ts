import {onMessage, sendMessage} from "./message";
import {noop, throwError} from "../util";

type WebRTCConnectionStates = {
  remoteMediaStream: MediaStreamTrack[] | undefined,
  localMediaStream: MediaStreamTrack[] | undefined,
  iceConnectionState: RTCIceConnectionState,
  signalingState: RTCSignalingState,
  connectionState: RTCPeerConnectionState,
  iceGatheringState: RTCIceGatheringState,
}

type WebRTCConnectionOptions = {
  localConnectionId: string,
  localClientId: string,
  iceServerUrls?: string[],
  onStateChange?: (states: WebRTCConnectionStates, eventName: string) => void,
  onConnect?: () => void,
  onDisconnect?: () => void,
  onFail?: () => void,
  onError?: (error: Error) => void,
};

class IlligalStateError extends Error {
}

export class WebRTCConnection {
  private rtcPeerConnection: RTCPeerConnection;
  private localMediaStream: MediaStream | undefined;
  private remoteConnectionId: string | null = null;
  private remoteClientId: string | null = null;
  private negotiationneeded: boolean = false;
  private readonly listeningCancelers: (() => void)[] = []
  private readonly localConnectionId: string;
  private readonly localClientId: string;
  private readonly onStateChange: (states: WebRTCConnectionStates, eventName: string) => void;
  private readonly onConnect: () => void;
  private readonly onDisconnect: () => void;
  private readonly onFail: () => void;
  private readonly onError: (error: Error) => void;
  remoteMediaStream: MediaStream;

  constructor({
                localConnectionId,
                localClientId,
                iceServerUrls = [],
                onStateChange = noop,
                onConnect = noop,
                onDisconnect = noop,
                onFail = noop,
                onError = throwError,
              }: WebRTCConnectionOptions) {

    this.localClientId = localClientId;
    this.localConnectionId = localConnectionId;
    this.onStateChange = onStateChange;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onFail = onFail;
    this.onError = onError;
    this.remoteMediaStream = new MediaStream();
    this.rtcPeerConnection = new RTCPeerConnection({iceServers: [{urls: iceServerUrls}]});

    this.rtcPeerConnection.addEventListener('icecandidate', async ({candidate}) => {
      if (candidate == null) return;
      await this.sendIceCandidate(candidate);
    });

    this.rtcPeerConnection.addEventListener('negotiationneeded', async () => {
      console.log('negotiationneeded');
      this.negotiationneeded = true;
      await this.connect(this.remoteConnectionId, this.remoteClientId);
    });

    this.rtcPeerConnection.addEventListener('track', async ({track}) => {
      console.log('remote track');
      this.remoteMediaStream.addTrack(track)
    });

    this.rtcPeerConnection.addEventListener('connectionstatechange', () => {
      console.log(`connectionState : ${this.rtcPeerConnection.connectionState}`);
      switch (this.rtcPeerConnection.connectionState) {
        case "connected":
          return this.onConnect()
        case "disconnected":
          return this.onDisconnect()
        case "failed":
          return this.onFail()
      }
    });

    ['connectionstatechange', 'iceconnectionstatechange', 'icegatheringstatechange', 'signalingstatechange']
      .forEach((eventName: string) => {
        this.rtcPeerConnection.addEventListener(eventName, () => (
          this.onStateChange({
            connectionState: this.rtcPeerConnection.connectionState,
            iceConnectionState: this.rtcPeerConnection.iceConnectionState,
            iceGatheringState: this.rtcPeerConnection.iceGatheringState,
            signalingState: this.rtcPeerConnection.signalingState,
            remoteMediaStream: this.remoteMediaStream?.getTracks(),
            localMediaStream: this.localMediaStream?.getTracks(),
          }, eventName)
        ), false);
      });

    this.listeningCancelers.push(onMessage('ICE', candidateInit => {
      if (!candidateInit) return;
      return this.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidateInit));
    }));

    this.listeningCancelers.push(onMessage('CONNECTION_ID', async message => {
      const {connectionId, clientId} = JSON.parse(message) || {};
      await this.connect(connectionId, clientId)
    }));

    this.listeningCancelers.push(onMessage('SDP', async (descriptionInit, from) => {
      this.remoteConnectionId = from;
      const rtcSessionDescription = new RTCSessionDescription(descriptionInit);
      try {
        await this.rtcPeerConnection.setRemoteDescription(rtcSessionDescription);
        if (descriptionInit.type === 'offer') {
          await this.sendAnswer();
        }
      } catch (e) {
        this.onError(e);
      }
    }))
  }

  private exchangeSDP = async () => {
    if (this.remoteConnectionId == null || this.remoteClientId == null) return;
    if (!this.negotiationneeded) return;
    const isCaller = this.remoteClientId > this.localClientId;
    console.log(`isCaller : ${isCaller}`);
    try {
      if (isCaller){
        console.log('offer');
        const rtcSessionDescriptionInit = await this.rtcPeerConnection.createOffer({iceRestart: true});
        await this.rtcPeerConnection.setLocalDescription(rtcSessionDescriptionInit);
        await sendMessage(this.remoteConnectionId, 'SDP', rtcSessionDescriptionInit)
      }else{
        await sendMessage(this.remoteConnectionId, 'CONNECTION_ID', JSON.stringify({
          connectionId: this.localConnectionId,
          clientId: this.localClientId
        }));
      }
    } catch (e) {
      this.onError(e)
    }
  }

  private sendAnswer = async () => {
    if (this.remoteConnectionId == null) return;
    try {
      console.log('answer');
      const rtcSessionDescriptionInit = await this.rtcPeerConnection.createAnswer();
      await this.rtcPeerConnection.setLocalDescription(rtcSessionDescriptionInit);
      await sendMessage(this.remoteConnectionId, 'SDP', rtcSessionDescriptionInit);
    } catch (e) {
      this.onError(e)
    }
  }

  private sendIceCandidate = async (candidate: RTCIceCandidate) => {
    if (this.remoteConnectionId == null) return;
    try {
      await sendMessage(this.remoteConnectionId, 'ICE', candidate);
    } catch (e) {
      this.onError(e)
    }
  }

  connect = async (remoteConnectionId: string | null, remoteClientId: string | null) => {
    console.log('connect');
    if (remoteConnectionId == null || remoteClientId == null) return;
    if (this.remoteClientId && this.remoteClientId !== remoteClientId) {
      throw new IlligalStateError("cannot change remote client");
    }
    this.remoteConnectionId = remoteConnectionId
    this.remoteClientId = remoteClientId
    await this.exchangeSDP();
  }

  addLocalMediaStream = (mediaStream: MediaStream) => {
    this.localMediaStream = mediaStream;
    if (this.rtcPeerConnection.signalingState === "closed") return;
    console.log('local track');
    mediaStream.getTracks()
      .sort((a, b) => a.kind > b.kind ? 1 : -1)
      .forEach(track => this.rtcPeerConnection.addTrack(track));
  }

  disconnect = () => {
    while (this.listeningCancelers.length > 0) {
      const canceler = this.listeningCancelers.pop();
      if (canceler) canceler();
    }
    this.remoteConnectionId = null;
    this.rtcPeerConnection.close();
  }
}