import type { Chat, Credentials, Message, MessageStatus } from '../types';
import { loadChatData, loadCredentials, type ChatData } from './storage';

export interface EarlyStatus {
  messageId: string;
  status: MessageStatus;
  error?: string;
}

export interface ChatState {
  credentials: Credentials | null;
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  earlyStatuses: EarlyStatus[];
  openElsewhere: boolean;
  signOutReason: string | null;
}

export type ChatAction =
  | { type: 'login'; credentials: Credentials; data: ChatData }
  | { type: 'logout'; reason?: string }
  | { type: 'restore'; state: ChatState }
  | { type: 'tabClaimed' }
  | { type: 'openChat'; chat: Chat }
  | { type: 'selectChat'; chatId: string | null }
  | { type: 'deleteChat'; chatId: string }
  | { type: 'addMessage'; message: Message; chat?: Chat }
  | { type: 'updateMessage'; chatId: string; messageId: string; patch: Partial<Message> }
  | { type: 'messageSent'; chatId: string; localId: string; serverId: string }
  | { type: 'setStatus'; chatId: string; messageId: string; status: MessageStatus; error?: string };

const STATUS_RANK: Record<MessageStatus, number> = { failed: -1, sending: 0, sent: 1, delivered: 2, read: 3 };

const MAX_EARLY_STATUSES = 50;

const emptyState: ChatState = {
  credentials: null,
  chats: [],
  messages: {},
  activeChatId: null,
  earlyStatuses: [],
  openElsewhere: false,
  signOutReason: null,
};

export function initState(): ChatState {
  const credentials = loadCredentials();
  if (!credentials) return emptyState;
  return { ...emptyState, credentials, ...loadChatData(credentials.idInstance) };
}

const patchChat = (chats: Chat[], chatId: string, patch: Partial<Chat>) =>
  chats.map((chat) => (chat.id === chatId ? { ...chat, ...patch } : chat));

const hasMessage = (state: ChatState, chatId: string, messageId: string) =>
  state.messages[chatId]?.some((m) => m.id === messageId) ?? false;

function patchMessage(state: ChatState, chatId: string, messageId: string, update: (m: Message) => Message) {
  const list = state.messages[chatId];
  if (!list) return state;
  return {
    ...state,
    messages: { ...state.messages, [chatId]: list.map((m) => (m.id === messageId ? update(m) : m)) },
  };
}

function applyStatus(message: Message, status: MessageStatus, error?: string): Message {
  const isUpgrade = !message.status || message.status === 'failed' || STATUS_RANK[status] > STATUS_RANK[message.status];
  if (status !== 'failed' && !isUpgrade) return message;
  return { ...message, status, error: status === 'failed' ? error : undefined };
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'login':
      return { ...emptyState, credentials: action.credentials, ...action.data };

    case 'logout':
      return { ...emptyState, signOutReason: action.reason ?? null };

    case 'restore': {
      const keepChat = action.state.chats.some((chat) => chat.id === state.activeChatId);
      return { ...action.state, activeChatId: keepChat ? state.activeChatId : null };
    }

    case 'tabClaimed':
      return { ...state, openElsewhere: true };

    case 'openChat': {
      const exists = state.chats.some((chat) => chat.id === action.chat.id);
      return {
        ...state,
        chats: exists ? patchChat(state.chats, action.chat.id, { unreadCount: 0 }) : [action.chat, ...state.chats],
        activeChatId: action.chat.id,
      };
    }

    case 'selectChat':
      return {
        ...state,
        activeChatId: action.chatId,
        chats: action.chatId ? patchChat(state.chats, action.chatId, { unreadCount: 0 }) : state.chats,
      };

    case 'deleteChat': {
      const messages = { ...state.messages };
      delete messages[action.chatId];
      return {
        ...state,
        chats: state.chats.filter((chat) => chat.id !== action.chatId),
        messages,
        activeChatId: state.activeChatId === action.chatId ? null : state.activeChatId,
      };
    }

    case 'addMessage': {
      const { message, chat: info } = action;
      const list = state.messages[message.chatId] ?? [];
      if (list.some((m) => m.id === message.id)) return state;

      let chats = state.chats;
      const existing = chats.find((chat) => chat.id === message.chatId);
      if (!existing) {
        if (!info) return state;
        chats = [info, ...chats];
      } else if (info && ((!existing.name && info.name) || (!existing.phone && info.phone))) {
        chats = patchChat(chats, existing.id, { name: existing.name || info.name, phone: existing.phone || info.phone });
      }

      if (message.direction === 'incoming' && state.activeChatId !== message.chatId) {
        chats = chats.map((chat) => (chat.id === message.chatId ? { ...chat, unreadCount: chat.unreadCount + 1 } : chat));
      }
      return { ...state, chats, messages: { ...state.messages, [message.chatId]: [...list, message] } };
    }

    case 'updateMessage':
      return patchMessage(state, action.chatId, action.messageId, (m) => ({ ...m, ...action.patch }));

    case 'messageSent': {
      const { chatId, localId, serverId } = action;
      const early = state.earlyStatuses.filter((s) => s.messageId === serverId);
      const next = patchMessage(state, chatId, localId, (m) =>
        early.reduce<Message>((message, s) => applyStatus(message, s.status, s.error), {
          ...m,
          id: serverId,
          status: 'sent',
          error: undefined,
        }),
      );
      if (early.length === 0) return next;
      return { ...next, earlyStatuses: state.earlyStatuses.filter((s) => s.messageId !== serverId) };
    }

    case 'setStatus': {
      const { chatId, messageId, status, error } = action;
      if (!hasMessage(state, chatId, messageId)) {
        const earlyStatuses = [...state.earlyStatuses, { messageId, status, error }].slice(-MAX_EARLY_STATUSES);
        return { ...state, earlyStatuses };
      }
      return patchMessage(state, chatId, messageId, (m) => applyStatus(m, status, error));
    }
  }
}
