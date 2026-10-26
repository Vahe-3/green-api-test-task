import { useState } from 'react';
import { api, type ContactQuery } from '../../api';
import { useChatStore, useCredentials } from '../../store/ChatStoreContext';
import { errorText } from '../../utils/chat';
import { digitsOnly, isValidPhone } from '../../utils/phone';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';

const USERNAME_PATTERN = /^@[a-z0-9_]{4,32}$/i;

function parseContact(value: string): ContactQuery | null {
  const input = value.trim();
  if (input.startsWith('@')) return USERNAME_PATTERN.test(input) ? { username: input } : null;
  const digits = digitsOnly(input);
  return isValidPhone(digits) ? { phone: digits } : null;
}

export function NewChatDialog({ onClose }: { onClose: () => void }) {
  const { state, openChat } = useChatStore();
  const credentials = useCredentials();
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit() {
    const query = parseContact(contact);
    if (!query) {
      setError(
        contact.trim().startsWith('@')
          ? 'A username has 4–32 letters, digits or underscores, e.g. @john_smith'
          : 'Enter the number in international format, e.g. +7 999 123 45 67',
      );
      return;
    }

    const existing = state.chats.find((chat) =>
      'phone' in query ? chat.phone === query.phone : chat.username.toLowerCase() === query.username.toLowerCase(),
    );
    if (existing) {
      openChat(existing);
      onClose();
      return;
    }

    setLoading(true);
    try {
      const found = await api.findContact(credentials, query);
      openChat({
        id: found.chatId,
        phone: found.phone,
        username: found.username,
        name: name.trim(),
        unreadCount: 0,
        createdAt: Date.now(),
      });
      onClose();
    } catch (err) {
      setError(errorText(err));
      setLoading(false);
    }
  }

  return (
    <Modal title="New chat" onClose={onClose}>
      <form
        className="modal__form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextField
          label="Phone number or @username"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          autoFocus
          value={contact}
          onChange={(event) => {
            setContact(event.target.value);
            setError(undefined);
          }}
          error={error}
          hint="Number with country code, e.g. +7 999 123 45 67, or a username like @john_smith"
        />
        <TextField
          label="Name (optional)"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="modal__actions">
          <button type="button" className="btn btn--text" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--text" disabled={loading}>
            {loading ? <span className="spinner" aria-label="Looking up the contact" /> : 'Start chat'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
