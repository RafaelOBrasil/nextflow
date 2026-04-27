'use client';

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (typeof window === 'undefined') return { emit: () => {}, on: () => {}, off: () => {} } as any;
  
  if (!socket) {
    socket = io({
      path: '/api/socket',
      autoConnect: false,
      transports: ['polling', 'websocket'],
    });
  }
  return socket;
};
