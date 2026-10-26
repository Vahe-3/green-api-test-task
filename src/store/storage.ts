import type { Chat, Credentials, Message, MessageStatus } from '../types';

export interface ChatData {
  chats: Chat[];
  messages: Record<string, Message[]>;
}

const KEY_PREFIX = 'green-chat:';
const CREDENTIALS_KEY = `${KEY_PREFIX}credentials`;
const dataKey = (idInstance: string) => `${KEY_PREFIX}data:${idInstance}`;

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const stringOr = (value: unknown, fallback: string) => (isString(value) ? value : fallback);

const STATUSES = new Set<unknown>(['sending', 'sent', 'delivered', 'read', 'failed'] satisfies MessageStatus[]);
const isStatus = (value: unknown): value is MessageStatus => STATUSES.has(value);

function parseCredentials(value: unknown): Credentials | null {
  if (!isRecord(value)) return null;
  const { apiUrl, idInstance, apiTokenInstance } = value;
  if (!isString(apiUrl) || !isString(idInstance) || !isString(apiTokenInstance)) return null;
  if (!apiUrl || !idInstance || !apiTokenInstance) return null;
  return { apiUrl, idInstance, apiTokenInstance };
}

function parseChat(value: unknown): Chat | null {
  if (!isRecord(value) || !isString(value.id) || !value.id) return null;
  return {
    id: value.id,
    phone: stringOr(value.phone, ''),
    username: stringOr(value.username, ''),
    name: stringOr(value.name, ''),
    unreadCount: isNumber(value.unreadCount) && value.unreadCount > 0 ? Math.floor(value.unreadCount) : 0,
    createdAt: isNumber(value.createdAt) && value.createdAt > 0 ? value.createdAt : Date.now(),
  };
}

function parseMessage(value: unknown, chatId: string): Message | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.text) || !isNumber(value.timestamp)) return null;
  if (value.direction !== 'incoming' && value.direction !== 'outgoing') return null;

  const message: Message = {
    id: value.id,
    chatId,
    text: value.text,
    direction: value.direction,
    timestamp: value.timestamp,
  };
  if (value.direction === 'outgoing' && isStatus(value.status)) {
    message.status = value.status === 'sending' ? 'failed' : value.status;
  }
  if (isString(value.error)) message.error = value.error;
  if (value.unsupported === true) message.unsupported = true;
  return message;
}

function parseChatData(value: unknown): ChatData {
  const data: ChatData = { chats: [], messages: {} };
  if (!isRecord(value)) return data;

  const savedMessages = isRecord(value.messages) ? value.messages : {};
  const seen = new Set<string>();
  for (const item of Array.isArray(value.chats) ? value.chats : []) {
    const chat = parseChat(item);
    if (!chat || seen.has(chat.id)) continue;
    seen.add(chat.id);
    const list = Object.hasOwn(savedMessages, chat.id) ? savedMessages[chat.id] : undefined;
    data.chats.push(chat);
    data.messages[chat.id] = Array.isArray(list) ? list.map((m) => parseMessage(m, chat.id)).filter((m) => m !== null) : [];
  }
  return data;
}

export const loadCredentials = () => parseCredentials(read(CREDENTIALS_KEY));

export const saveCredentials = (credentials: Credentials | null) => write(CREDENTIALS_KEY, credentials);

export const loadChatData = (idInstance: string) => parseChatData(read(dataKey(idInstance)));

export const saveChatData = (idInstance: string, data: ChatData) => write(dataKey(idInstance), data);

export function clearSavedData() {
  try {
    const keys = Object.keys(localStorage).filter((key) => key === CREDENTIALS_KEY || key.startsWith(dataKey('')));
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {}
}
