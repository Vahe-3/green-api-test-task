import type { Credentials } from '../types';
import { NotificationsOffError } from './errors';
import type { Contact, MessengerApi, MessengerEvent } from './types';

export class GreenApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GreenApiError';
    this.status = status;
  }
}

const HTTP_ERRORS: Record<number, string> = {
  401: 'Wrong apiTokenInstance. Copy it again from the GREEN-API console.',
  403: 'Wrong idInstance or API URL. Copy them again from the GREEN-API console.',
  429: 'Too many requests to GREEN-API. Wait a moment and try again.',
  466: 'The limit of your GREEN-API tariff is reached.',
};

const INSTANCE_STATES: Record<string, string> = {
  notAuthorized: 'This instance is not linked to Telegram yet. Scan the QR code in the GREEN-API console first.',
  pendingPassword: 'Finish linking the instance: enter your Telegram two-step verification password in the GREEN-API console.',
  starting: 'The instance is starting. Try again in a minute.',
  blocked: 'The Telegram account linked to this instance is blocked.',
  suspended: 'The Telegram account linked to this instance is temporarily restricted.',
};

const RECEIVE_TIMEOUT_S = 20;
const MAX_RETRY_DELAY_MS = 30_000;

const REQUEST_TIMEOUT_MS = 30_000;
const RECEIVE_REQUEST_TIMEOUT_MS = RECEIVE_TIMEOUT_S * 1000 + 15_000;

const SIGNED_OUT_STATUSES = new Set([401, 403]);

interface RequestOptions {
  httpMethod?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  suffix?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function readError(text: string): string | undefined {
  try {
    const data = JSON.parse(text) as { message?: string; reason?: string };
    return data.message || data.reason || undefined;
  } catch {
    return text.trim().slice(0, 200) || undefined;
  }
}

async function call<T>(credentials: Credentials, method: string, options: RequestOptions = {}): Promise<T> {
  const { httpMethod = 'GET', body, suffix = '', signal, timeoutMs = REQUEST_TIMEOUT_MS } = options;
  const url =
    `${credentials.apiUrl}/waInstance${encodeURIComponent(credentials.idInstance)}` +
    `/${method}/${encodeURIComponent(credentials.apiTokenInstance)}${suffix}`;
  const timeout = AbortSignal.timeout(timeoutMs);

  let response: Response;
  let text: string;
  try {
    response = await fetch(url, {
      method: httpMethod,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    text = await response.text();
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timeout.aborted) {
      throw new GreenApiError('GREEN-API did not respond in time. Check your internet connection and try again.');
    }
    throw new GreenApiError('Could not reach GREEN-API. Check the API URL and your internet connection.');
  }

  if (!response.ok) {
    const message = HTTP_ERRORS[response.status] ?? readError(text) ?? `GREEN-API error ${response.status}`;
    throw new GreenApiError(message, response.status);
  }
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GreenApiError('GREEN-API sent an unexpected answer. Check the API URL.');
  }
}

interface Notification {
  receiptId: number;
  body: WebhookBody;
}

interface WebhookBody {
  typeWebhook: string;
  idMessage?: string;
  timestamp?: number;
  chatId?: string;
  status?: string;
  description?: string;
  senderData?: {
    chatId: string;
    chatName?: string;
    senderName?: string;
    senderContactName?: string;
    senderPhoneNumber?: number;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: { textMessage: string };
    extendedTextMessageData?: { text: string };
  };
}

const MEDIA_LABELS: Record<string, string> = {
  imageMessage: 'Photo',
  videoMessage: 'Video',
  audioMessage: 'Audio',
  documentMessage: 'File',
  stickerMessage: 'Sticker',
  locationMessage: 'Location',
  contactMessage: 'Contact',
  pollMessage: 'Poll',
};

function toEvent(body: WebhookBody): MessengerEvent | null {
  if (body.typeWebhook === 'outgoingMessageStatus') {
    if (!body.idMessage || !body.chatId) return null;
    if (body.status === 'delivered' || body.status === 'read') {
      return { type: 'status', idMessage: body.idMessage, chatId: body.chatId, status: body.status };
    }
    if (body.status === 'failed' || body.status === 'noAccount') {
      const error =
        body.status === 'noAccount'
          ? 'No Telegram account on this number, or it is hidden by privacy settings'
          : body.description;
      return { type: 'status', idMessage: body.idMessage, chatId: body.chatId, status: 'failed', error };
    }
    return null;
  }

  const direction =
    body.typeWebhook === 'incomingMessageReceived'
      ? 'incoming'
      : body.typeWebhook === 'outgoingMessageReceived'
        ? 'outgoing'
        : null;
  const { senderData, messageData, idMessage } = body;
  if (!direction || !senderData || !messageData || !idMessage) return null;

  if (senderData.chatId.startsWith('-')) return null;

  let text: string;
  let unsupported = false;
  if (messageData.typeMessage === 'textMessage') {
    text = messageData.textMessageData?.textMessage ?? '';
  } else if (messageData.typeMessage === 'extendedTextMessage') {
    text = messageData.extendedTextMessageData?.text ?? '';
  } else if (MEDIA_LABELS[messageData.typeMessage]) {
    text = `${MEDIA_LABELS[messageData.typeMessage]}: open Telegram to view`;
    unsupported = true;
  } else {
    return null;
  }
  if (!text) return null;

  return {
    type: 'message',
    direction,
    idMessage,
    chatId: senderData.chatId,
    text,
    unsupported,
    timestamp: (body.timestamp ?? Date.now() / 1000) * 1000,
    senderName: direction === 'incoming' ? senderData.senderContactName || senderData.senderName : senderData.chatName,
    senderPhone: direction === 'incoming' && senderData.senderPhoneNumber ? String(senderData.senderPhoneNumber) : undefined,
  };
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal.addEventListener('abort', done, { once: true });
  });
}

export const greenApi: MessengerApi = {
  async checkAuth(credentials) {
    const { stateInstance } = await call<{ stateInstance: string }>(credentials, 'getStateInstance');
    if (stateInstance !== 'authorized') {
      throw new GreenApiError(INSTANCE_STATES[stateInstance] ?? `The instance is not ready (state: ${stateInstance}).`);
    }

    const settings = await call<{ webhookUrl?: string; incomingWebhook?: string; outgoingWebhook?: string }>(
      credentials,
      'getSettings',
    );
    if (settings.webhookUrl) {
      throw new GreenApiError(
        'This instance sends notifications to a webhook URL, so the app cannot receive messages. Clear the webhook URL in the GREEN-API console and try again in a minute.',
      );
    }
    if (settings.incomingWebhook === 'no' || settings.outgoingWebhook === 'no') throw new NotificationsOffError();
  },

  async enableNotifications(credentials) {
    const { saveSettings } = await call<{ saveSettings?: boolean }>(credentials, 'setSettings', {
      httpMethod: 'POST',
      body: {
        incomingWebhook: 'yes',
        outgoingWebhook: 'yes',
        outgoingMessageWebhook: 'yes',
      },
    });
    if (!saveSettings) {
      throw new GreenApiError('GREEN-API did not save the settings. Turn on the notifications in the GREEN-API console.');
    }
  },

  async findContact(credentials, query) {
    const body = 'phone' in query ? { phoneNumber: Number(query.phone) } : { username: query.username };
    const result = await call<{
      exist?: boolean;
      chatId?: string;
      username?: string;
      phoneNumber?: number;
      status?: boolean;
      reason?: string;
    }>(credentials, 'checkAccount', { httpMethod: 'POST', body });

    if (result.status === false) throw new GreenApiError(result.reason ?? 'Could not check this contact.');
    if (!result.exist || !result.chatId) {
      throw new GreenApiError(
        'phone' in query
          ? 'No Telegram account found for this number. It may be hidden by privacy settings; try their @username.'
          : 'No Telegram account found with this username.',
      );
    }
    const contact: Contact = {
      chatId: result.chatId,
      phone: result.phoneNumber ? String(result.phoneNumber) : 'phone' in query ? query.phone : '',
      username: result.username ?? ('username' in query ? query.username : ''),
    };
    return contact;
  },

  async sendMessage(credentials, chatId, text) {
    const { idMessage } = await call<{ idMessage: string }>(credentials, 'sendMessage', {
      httpMethod: 'POST',
      body: { chatId, message: text },
    });
    return idMessage;
  },

  subscribe(credentials, onEvent) {
    const controller = new AbortController();
    const { signal } = controller;

    void (async () => {
      let failures = 0;
      while (!signal.aborted) {
        try {
          const notification = await call<Notification | null>(credentials, 'receiveNotification', {
            suffix: `?receiveTimeout=${RECEIVE_TIMEOUT_S}`,
            signal,
            timeoutMs: RECEIVE_REQUEST_TIMEOUT_MS,
          });
          if (failures > 0) onEvent({ type: 'connection', online: true });
          failures = 0;
          if (!notification) continue;

          try {
            const event = toEvent(notification.body);
            if (event) onEvent(event);
          } catch {}
          await call(credentials, 'deleteNotification', {
            httpMethod: 'DELETE',
            suffix: `/${notification.receiptId}`,
            signal,
          });
        } catch (error) {
          if (signal.aborted) return;
          if (error instanceof GreenApiError && error.status && SIGNED_OUT_STATUSES.has(error.status)) {
            onEvent({ type: 'signedOut', reason: error.message });
            return;
          }
          failures++;
          if (failures === 1) onEvent({ type: 'connection', online: false });
          await wait(Math.min(MAX_RETRY_DELAY_MS, 1000 * 2 ** failures), signal);
        }
      }
    })();

    return () => controller.abort();
  },
};
