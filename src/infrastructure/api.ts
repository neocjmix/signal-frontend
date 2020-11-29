import axios from "axios";
import {ROOM_TYPE} from "../enum";

const API_ID = '9l5iwnfzf8';
const REGION = 'ap-northeast-2';
const STAGE = 'Prod';
const REST_API_URL = `https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}`;

export interface RoomResponse {
  roomType: ROOM_TYPE,
  members: { [clientId: string]: string }
}

export interface CreateRoomRequest {
  roomType: ROOM_TYPE,
  roomPassword: string
  connectionId: string
  clientId: string
}

export const api = {
  fetchRoom: async ({roomCode, clientId, password, connectionId}: {
    roomCode: string,
    clientId: string | null,
    connectionId: string,
    password?: string
  }): Promise<RoomResponse> => {
    const {data} = await axios.post(`${REST_API_URL}/room/${roomCode}`, {password, clientId, connectionId});
    return data;
  },
  async createRoom({roomPassword, roomType, connectionId, clientId}: CreateRoomRequest) {
    const {data: roomCode} = await axios.post(`${REST_API_URL}/room`, {roomPassword, roomType, connectionId, clientId});
    return {roomCode};
  },
}

