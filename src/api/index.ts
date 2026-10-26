import { greenApi } from './greenApi';
import { mockApi } from './mockApi';
import type { MessengerApi } from './types';

export const isDemoMode = import.meta.env.VITE_USE_MOCK_API === 'true';

export const api: MessengerApi = isDemoMode ? mockApi : greenApi;

export { NotificationsOffError } from './errors';
export type { Contact, ContactQuery, MessengerApi, MessengerEvent } from './types';
