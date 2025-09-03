// src/Socket.js
import { io } from "socket.io-client";

// Singleton socket instance
let socket;

/**
 * Returns a persistent socket instance.
 * If the socket doesn't exist yet, it will create one.
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.REACT_APP_BACKEND_URL || "http://localhost:8080", {
      reconnectionAttempts: Infinity,
      timeout: 10000,
    });
  }
  return socket;
};
