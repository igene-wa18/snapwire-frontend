import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  const socketUrl = import.meta.env.VITE_SOCKET_URL || '/';
  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('✓ Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('✗ Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('✗ Socket disconnected:', reason);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ─── CHAT ROOM HELPERS ────────────────────────────────────────────────
export function joinChat(chatId) {
  socket?.emit('chat:join', { chatId });
}

export function leaveChat(chatId) {
  socket?.emit('chat:leave', { chatId });
}

// ─── MESSAGE HELPERS ──────────────────────────────────────────────────
export function sendMessage(chatId, content, type = 'text', tempId, replyTo) {
  socket?.emit('message:send', { chatId, content, type, tempId, replyTo });
}

export function markDelivered(messageId, chatId) {
  socket?.emit('message:delivered', { messageId, chatId });
}

export function markRead(chatId, messageIds) {
  socket?.emit('message:read', { chatId, messageIds });
}

// ─── TYPING HELPERS ───────────────────────────────────────────────────
export function startTyping(chatId) {
  socket?.emit('typing:start', { chatId });
}

export function stopTyping(chatId) {
  socket?.emit('typing:stop', { chatId });
}
