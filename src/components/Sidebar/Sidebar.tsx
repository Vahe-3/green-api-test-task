import { useMemo, useState } from 'react';
import { isDemoMode } from '../../api';
import { useChatStore } from '../../store/ChatStoreContext';
import { useTheme } from '../../theme';
import { chatTitle, cx, lastActivity, lastMessage } from '../../utils/chat';
import { digitsOnly } from '../../utils/phone';
import { Dropdown } from '../ui/Dropdown';
import { Icon } from '../ui/Icon';
import { ChatListItem } from './ChatListItem';
import './Sidebar.css';

interface SidebarProps {
  online: boolean;
  onNewChat: () => void;
}

export function Sidebar({ online, onNewChat }: SidebarProps) {
  const { state, selectChat, logout } = useChatStore();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');

  const chats = useMemo(() => {
    const text = query.trim().toLowerCase();
    const digits = digitsOnly(text);
    return state.chats
      .filter(
        (chat) =>
          !text ||
          chatTitle(chat).toLowerCase().includes(text) ||
          chat.username.toLowerCase().includes(text) ||
          (digits && chat.phone.includes(digits)),
      )
      .sort((a, b) => lastActivity(b, state.messages[b.id]) - lastActivity(a, state.messages[a.id]));
  }, [state.chats, state.messages, query]);

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <Dropdown
          icon="menu"
          label="Menu"
          header={
            <>
              Signed in to instance
              <br />
              <strong>{state.credentials?.idInstance}</strong>
            </>
          }
          items={[
            {
              label: 'Dark mode',
              icon: 'moon',
              onSelect: toggleTheme,
              trailing: <span className={cx('switch', theme === 'dark' && 'switch--on')} />,
            },
            { label: 'Log out', icon: 'logout', onSelect: logout, danger: true },
          ]}
        />
        <label className="search">
          <Icon name="search" size={22} />
          <input
            className="search__input"
            placeholder="Search"
            aria-label="Search chats"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button type="button" className="search__clear" onClick={() => setQuery('')} aria-label="Clear search">
              <Icon name="close" size={18} />
            </button>
          )}
        </label>
      </header>

      {isDemoMode && (
        <div className="sidebar__demo" role="note">
          Demo mode: messages are not sent to Telegram, replies are simulated.
        </div>
      )}

      {!online && (
        <div className="sidebar__connecting" role="status">
          <span className="spinner spinner--small" />
          Connecting to GREEN-API…
        </div>
      )}

      {chats.length > 0 ? (
        <ul className="chat-list">
          {chats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              lastMessage={lastMessage(state.messages[chat.id])}
              active={chat.id === state.activeChatId}
              onSelect={selectChat}
            />
          ))}
        </ul>
      ) : (
        <div className="chat-list__empty">
          {query ? (
            <p>No chats found</p>
          ) : (
            <>
              <p className="chat-list__empty-title">No chats yet</p>
              <p>Start a chat with someone using their phone number.</p>
              <button type="button" className="btn btn--text" onClick={onNewChat}>
                New chat
              </button>
            </>
          )}
        </div>
      )}

      <button type="button" className="fab" onClick={onNewChat} aria-label="New chat" title="New chat">
        <Icon name="edit" />
      </button>
    </aside>
  );
}
