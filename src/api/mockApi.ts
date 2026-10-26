import type { MessengerApi, MessengerEvent } from './types';

const listeners = new Set<(event: MessengerEvent) => void>();

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const newId = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
const emit = (event: MessengerEvent) => listeners.forEach((listener) => listener(event));

export const mockApi: MessengerApi = {
  async checkAuth() {
    await delay(600);
  },

  async enableNotifications() {
    await delay(400);
  },

  async findContact(_credentials, query) {
    await delay(400);
    return 'phone' in query
      ? { chatId: query.phone, phone: query.phone, username: '' }
      : { chatId: String(Math.floor(Math.random() * 1e9)), phone: '', username: query.username };
  },

  async sendMessage(_credentials, chatId, text) {
    await delay(500);
    if (text === '/fail') throw new Error('Mock send failure');

    const idMessage = newId();
    setTimeout(() => emit({ type: 'status', idMessage, chatId, status: 'delivered' }), 700);
    setTimeout(() => emit({ type: 'status', idMessage, chatId, status: 'read' }), 1400);
    setTimeout(
      () =>
        emit({
          type: 'message',
          direction: 'incoming',
          idMessage: newId(),
          chatId,
          text: `Echo: ${text}`,
          timestamp: Date.now(),
        }),
      2000,
    );
    return idMessage;
  },

  subscribe(_credentials, onEvent) {
    listeners.add(onEvent);
    return () => listeners.delete(onEvent);
  },
};
