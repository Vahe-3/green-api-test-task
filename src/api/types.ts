import type { Credentials, MessageDirection } from '../types';

export type ContactQuery = { phone: string } | { username: string };

export interface Contact {
  chatId: string;
  phone: string;
  username: string;
}

export type MessengerEvent =
  | {
      type: 'message';
      direction: MessageDirection;
      idMessage: string;
      chatId: string;
      text: string;
      timestamp: number;
      unsupported?: boolean;
      senderName?: string;
      senderPhone?: string;
    }
  | {
      type: 'status';
      idMessage: string;
      chatId: string;
      status: 'delivered' | 'read' | 'failed';
      error?: string;
    }
  | {
      type: 'connection';
      online: boolean;
    }
  | {
      type: 'signedOut';
      reason: string;
    };

export interface MessengerApi {
  checkAuth(credentials: Credentials): Promise<void>;
  enableNotifications(credentials: Credentials): Promise<void>;
  findContact(credentials: Credentials, query: ContactQuery): Promise<Contact>;
  sendMessage(credentials: Credentials, chatId: string, text: string): Promise<string>;
  subscribe(credentials: Credentials, onEvent: (event: MessengerEvent) => void): () => void;
}
