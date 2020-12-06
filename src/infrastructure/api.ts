import axios from "axios";
import {ROOM_TYPE} from "../enum";

const {REACT_APP_API_ID, REACT_APP_REGION, REACT_APP_STAGE} = process.env
const REST_API_URL = `https://${REACT_APP_API_ID}.execute-api.${REACT_APP_REGION}.amazonaws.com/${REACT_APP_STAGE}`;

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

