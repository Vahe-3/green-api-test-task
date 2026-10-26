import { useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { ChatStoreContext, type ChatStore } from './ChatStoreContext';
import { chatReducer, initState } from './reducer';
import { loadChatData, saveChatData, saveCredentials } from './storage';
import { claimTab, onTabClaimed } from './tabSync';

export function ChatStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, undefined, initState);
  const { credentials, chats, messages, openElsewhere } = state;
  const signedIn = credentials !== null;

  useEffect(() => {
    if (!signedIn || openElsewhere) return;
    claimTab();
    return onTabClaimed(() => dispatch({ type: 'tabClaimed' }));
  }, [signedIn, openElsewhere]);

  useEffect(() => {
    if (!openElsewhere) saveCredentials(credentials);
  }, [credentials, openElsewhere]);

  useEffect(() => {
    if (credentials && !openElsewhere) saveChatData(credentials.idInstance, { chats, messages });
  }, [credentials, chats, messages, openElsewhere]);

  const actions = useMemo<Omit<ChatStore, 'state'>>(
    () => ({
      login: (credentials) => dispatch({ type: 'login', credentials, data: loadChatData(credentials.idInstance) }),
      logout: (reason) => dispatch({ type: 'logout', reason }),
      reclaimTab: () => dispatch({ type: 'restore', state: initState() }),
      openChat: (chat) => dispatch({ type: 'openChat', chat }),
      selectChat: (chatId) => dispatch({ type: 'selectChat', chatId }),
      deleteChat: (chatId) => dispatch({ type: 'deleteChat', chatId }),
      addMessage: (message, chat) => dispatch({ type: 'addMessage', message, chat }),
      updateMessage: (chatId, messageId, patch) => dispatch({ type: 'updateMessage', chatId, messageId, patch }),
      messageSent: (chatId, localId, serverId) => dispatch({ type: 'messageSent', chatId, localId, serverId }),
      setStatus: (chatId, messageId, status, error) => dispatch({ type: 'setStatus', chatId, messageId, status, error }),
    }),
    [],
  );

  const store = useMemo(() => ({ state, ...actions }), [state, actions]);

  return <ChatStoreContext.Provider value={store}>{children}</ChatStoreContext.Provider>;
}
