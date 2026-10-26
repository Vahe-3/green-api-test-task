import { useEffect, useState } from 'react';
import { api, isDemoMode } from '../api';
import { useChatStore, useCredentials } from '../store/ChatStoreContext';
import { ChatWindow } from './ChatWindow/ChatWindow';
import { NewChatDialog } from './NewChatDialog/NewChatDialog';
import { Sidebar } from './Sidebar/Sidebar';
import './Messenger.css';

const APP_TITLE = isDemoMode ? 'Telegram Chat (demo)' : 'Telegram Chat';

export function Messenger() {
  const { state, addMessage, setStatus, logout } = useChatStore();
  const credentials = useCredentials();
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const activeChat = state.chats.find((chat) => chat.id === state.activeChatId) ?? null;

  useEffect(
    () =>
      api.subscribe(credentials, (event) => {
        if (event.type === 'connection') {
          setOnline(event.online);
        } else if (event.type === 'signedOut') {
          logout(event.reason);
        } else if (event.type === 'status') {
          setStatus(event.chatId, event.idMessage, event.status, event.error);
        } else {
          addMessage(
            {
              id: event.idMessage,
              chatId: event.chatId,
              text: event.text,
              direction: event.direction,
              timestamp: event.timestamp,
              status: event.direction === 'outgoing' ? 'sent' : undefined,
              unsupported: event.unsupported || undefined,
            },
            {
              id: event.chatId,
              phone: event.senderPhone ?? '',
              username: '',
              name: event.senderName ?? '',
              unreadCount: 0,
              createdAt: event.timestamp,
            },
          );
        }
      }),
    [credentials, addMessage, setStatus, logout],
  );

  const unread = state.chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) ${APP_TITLE}` : APP_TITLE;
  }, [unread]);

  return (
    <div className="messenger" data-view={activeChat ? 'chat' : 'list'}>
      <Sidebar online={online} onNewChat={() => setNewChatOpen(true)} />
      <main className="chat-area">
        {activeChat ? (
          <ChatWindow key={activeChat.id} chat={activeChat} />
        ) : (
          <div className="chat-placeholder">
            <span className="pill">Select a chat to start messaging</span>
          </div>
        )}
      </main>
      {newChatOpen && <NewChatDialog onClose={() => setNewChatOpen(false)} />}
    </div>
  );
}
