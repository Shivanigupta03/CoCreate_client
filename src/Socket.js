import { io } from "socket.io-client";


let socket;


export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.REACT_APP_BACKEND_URL || "http://localhost:8080", {
      reconnectionAttempts: Infinity,
      timeout: 10000,
    });
  }
  return socket;
};
