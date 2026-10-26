export interface Credentials {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export type MessageDirection = 'incoming' | 'outgoing';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  chatId: string;
  text: string;
  direction: MessageDirection;
  timestamp: number;
  status?: MessageStatus;
  error?: string;
  unsupported?: boolean;
}

export interface Chat {
  id: string;
  phone: string;
  username: string;
  name: string;
  unreadCount: number;
  createdAt: number;
}
