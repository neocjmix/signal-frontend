let LATENCY = 1000;

export interface RoomResponse {
  roomCode: number,
  isPrivate: boolean
}

export interface CreateRoomFormData {
  roomType: string,
  roomPassword: string
}

const mock = async <T>(response: () => T | Promise<T>): Promise<T> => new Promise(resolve => {
  const promise = Promise.resolve(typeof response === 'function' ? response() : response);
  setTimeout(() => resolve(promise), LATENCY)
});

export const api = {
  getRoom: (roomCode: number) => mock<RoomResponse>(() => ({
    roomCode,
    isPrivate: true,
  })),
  handleError(e: Error) {
    console.error(e);
    alert("🙀 오류가 발생하였습니다.")
  },
  fetchRoomKey: ({password}: { password: string }) => mock<string>(() => {
    if (password === '1234') return 'AWSConnectionId';
    else throw new Error();
  }),
  createRoom: ({roomPassword, roomType}: CreateRoomFormData) =>
    mock<RoomResponse>(() => ({
      roomCode: 111111,
      isPrivate: roomPassword !== ''
    })),
}