import { WS_URL } from './api';
import { MediaMetadata, ServerWsEvent } from '../types';

type EventHandler = (event: ServerWsEvent) => void;

let socket: WebSocket | null = null;
let handler: EventHandler | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 8;
const BASE_DELAY_MS = 1000;

function scheduleReconnect(token: string, eventHandler: EventHandler, onOpen?: () => void) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    return;
  }
  const delay = Math.min(BASE_DELAY_MS * 2 ** reconnectAttempts, 30_000);
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => {
    connectWebSocket(token, eventHandler, onOpen);
  }, delay);
}

export function connectWebSocket(
  token: string,
  eventHandler: EventHandler,
  onOpen?: () => void,
) {
  disconnectWebSocket();

  handler = eventHandler;
  socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

  socket.onopen = () => {
    reconnectAttempts = 0;
    onOpen?.();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as ServerWsEvent;
      handler?.(data);
    } catch {
      // Ignore malformed events.
    }
  };

  socket.onerror = () => {
    // Errors are followed by onclose, handled there.
  };

  socket.onclose = () => {
    socket = null;
    // Auto-reconnect with exponential back-off
    scheduleReconnect(token, eventHandler, onOpen);
  };
}

export function disconnectWebSocket() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = 0;
  if (socket) {
    // Remove onclose to suppress reconnect after deliberate disconnect
    socket.onclose = null;
    socket.close();
    socket = null;
  }
}

export function sendWebSocketEvent(event: unknown) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }
  socket.send(JSON.stringify(event));
}

export function joinChat(chatId: string) {
  sendWebSocketEvent({ type: 'join_chat', chat_id: chatId });
}

export function sendMessageEvent(
  chatId: string,
  recipientId: string,
  encryptedContent: string,
  nonce: string,
  media: MediaMetadata[],
) {
  sendWebSocketEvent({
    type: 'send_message',
    chat_id: chatId,
    recipient_id: recipientId,
    encrypted_content: encryptedContent,
    nonce,
    media,
  });
}

export function sendTypingEvent(chatId: string, recipientId: string, isTyping: boolean) {
  sendWebSocketEvent({
    type: 'typing',
    chat_id: chatId,
    recipient_id: recipientId,
    is_typing: isTyping,
  });
}

export function sendReactionEvent(chatId: string, messageId: string, emoji: string) {
  sendWebSocketEvent({
    type: 'reaction',
    chat_id: chatId,
    message_id: messageId,
    emoji,
  });
}
