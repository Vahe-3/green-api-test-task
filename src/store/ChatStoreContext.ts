import { createContext, useContext } from 'react';
import type { Chat, Credentials, Message, MessageStatus } from '../types';
import type { ChatState } from './reducer';

export interface ChatStore {
  state: ChatState;
  login: (credentials: Credentials) => void;
  logout: (reason?: string) => void;
  reclaimTab: () => void;
  openChat: (chat: Chat) => void;
  selectChat: (chatId: string | null) => void;
  deleteChat: (chatId: string) => void;
  addMessage: (message: Message, chat?: Chat) => void;
  updateMessage: (chatId: string, messageId: string, patch: Partial<Message>) => void;
  messageSent: (chatId: string, localId: string, serverId: string) => void;
  setStatus: (chatId: string, messageId: string, status: MessageStatus, error?: string) => void;
}

export const ChatStoreContext = createContext<ChatStore | null>(null);

export function useChatStore(): ChatStore {
  const store = useContext(ChatStoreContext);
  if (!store) throw new Error('useChatStore must be used inside ChatStoreProvider');
  return store;
}

export function useCredentials(): Credentials {
  const { state } = useChatStore();
  if (!state.credentials) throw new Error('useCredentials called while signed out');
  return state.credentials;
}
