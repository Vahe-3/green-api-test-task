import type { Chat, Message } from '../types';
import { formatPhone } from './phone';

export const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(' ');

export const chatTitle = (chat: Chat) => chat.name || formatPhone(chat.phone) || chat.username || chat.id;

export const lastMessage = (messages: Message[] | undefined) => messages?.[messages.length - 1];

export const lastActivity = (chat: Chat, messages: Message[] | undefined) =>
  lastMessage(messages)?.timestamp ?? chat.createdAt;

export const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong');
