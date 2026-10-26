import { useCallback, useState } from 'react';
import { api } from '../../api';
import { useChatStore, useCredentials } from '../../store/ChatStoreContext';
import type { Chat, Message } from '../../types';
import { chatTitle, errorText } from '../../utils/chat';
import { formatPhone } from '../../utils/phone';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';
import { Icon } from '../ui/Icon';
import { ConfirmDialog } from '../ui/Modal';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import './ChatWindow.css';

const NO_MESSAGES: Message[] = [];

export function ChatWindow({ chat }: { chat: Chat }) {
  const { state, addMessage, updateMessage, messageSent, selectChat, deleteChat } = useChatStore();
  const credentials = useCredentials();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const messages = state.messages[chat.id] ?? NO_MESSAGES;
  const chatId = chat.id;
  const title = chatTitle(chat);
  const subtitle =
    [chat.name && formatPhone(chat.phone), chat.username !== title && chat.username].filter(Boolean).join(' · ') ||
    'Telegram';

  const deliver = useCallback(
    async (messageId: string, text: string) => {
      try {
        const idMessage = await api.sendMessage(credentials, chatId, text);
        messageSent(chatId, messageId, idMessage);
      } catch (error) {
        updateMessage(chatId, messageId, { status: 'failed', error: errorText(error) });
      }
    },
    [credentials, chatId, messageSent, updateMessage],
  );

  const send = useCallback(
    (text: string) => {
      const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      addMessage({ id, chatId, text, direction: 'outgoing', timestamp: Date.now(), status: 'sending' });
      void deliver(id, text);
    },
    [addMessage, chatId, deliver],
  );

  const retry = useCallback(
    (message: Message) => {
      updateMessage(chatId, message.id, { status: 'sending', error: undefined });
      void deliver(message.id, message.text);
    },
    [chatId, deliver, updateMessage],
  );

  return (
    <section className="chat" aria-label={`Chat with ${title}`}>
      <header className="chat-header">
        <button
          type="button"
          className="icon-btn chat-header__back"
          onClick={() => selectChat(null)}
          aria-label="Back to chats"
        >
          <Icon name="back" />
        </button>
        <Avatar id={chat.id} name={chat.name} size={42} />
        <div className="chat-header__info">
          <h2 className="chat-header__title">{title}</h2>
          <div className="chat-header__subtitle">{subtitle}</div>
        </div>
        <Dropdown
          icon="more"
          label="Chat options"
          align="right"
          items={[{ label: 'Delete chat', icon: 'delete', danger: true, onSelect: () => setConfirmingDelete(true) }]}
        />
      </header>

      <MessageList messages={messages} onRetry={retry} />
      <MessageInput chatId={chat.id} onSend={send} />

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete chat"
          text={`Delete the chat with ${title}? Its messages will be removed from this browser.`}
          confirmLabel="Delete"
          onConfirm={() => deleteChat(chat.id)}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </section>
  );
}
