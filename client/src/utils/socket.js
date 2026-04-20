import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_BACKEND_URL || (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:5000');

export const socket = io(URL, {
  autoConnect: false // We will connect manually when joining room
});
