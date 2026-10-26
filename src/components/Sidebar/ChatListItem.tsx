import { memo } from 'react';
import type { Chat, Message } from '../../types';
import { chatTitle, cx } from '../../utils/chat';
import { formatListDate } from '../../utils/date';
import { Avatar } from '../ui/Avatar';
import { StatusIcon } from '../ui/StatusIcon';

interface ChatListItemProps {
  chat: Chat;
  lastMessage?: Message;
  active: boolean;
  onSelect: (chatId: string) => void;
}

export const ChatListItem = memo(function ChatListItem({ chat, lastMessage, active, onSelect }: ChatListItemProps) {
  const time = lastMessage?.timestamp ?? chat.createdAt;

  return (
    <li>
      <button
        type="button"
        className={cx('chat-item', active && 'chat-item--active')}
        aria-current={active ? 'true' : undefined}
        onClick={() => onSelect(chat.id)}
      >
        <Avatar id={chat.id} name={chat.name} />
        <div className="chat-item__body">
          <div className="chat-item__row">
            <span className="chat-item__title">{chatTitle(chat)}</span>
            <span className="chat-item__meta">
              {lastMessage?.direction === 'outgoing' && <StatusIcon status={lastMessage.status} size={18} />}
              <time dateTime={new Date(time).toISOString()}>{formatListDate(time)}</time>
            </span>
          </div>
          <div className="chat-item__row">
            <span className={cx('chat-item__preview', !lastMessage && 'chat-item__preview--empty')}>
              {lastMessage ? lastMessage.text : 'No messages yet'}
            </span>
            {chat.unreadCount > 0 && (
              <span className="badge" aria-label={`${chat.unreadCount} unread`}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
});
