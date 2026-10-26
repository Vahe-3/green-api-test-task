import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '../../utils/chat';
import { Icon } from '../ui/Icon';

const MAX_MESSAGE_LENGTH = 4096;
const SHOW_COUNTER_FROM = MAX_MESSAGE_LENGTH - 200;
const MAX_INPUT_HEIGHT = 220;

const drafts = new Map<string, string>();

interface MessageInputProps {
  chatId: string;
  onSend: (text: string) => void;
}

export function MessageInput({ chatId, onSend }: MessageInputProps) {
  const [text, setText] = useState(() => drafts.get(chatId) ?? '');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const message = text.trim();
  const canSend = message.length > 0 && message.length <= MAX_MESSAGE_LENGTH;

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [text]);

  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus();
  }, []);

  function change(value: string) {
    setText(value);
    if (value) drafts.set(chatId, value);
    else drafts.delete(chatId);
  }

  function submit() {
    if (!canSend) return;
    onSend(message);
    change('');
    inputRef.current?.focus();
  }

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="composer__box">
        <textarea
          ref={inputRef}
          className="composer__input"
          rows={1}
          placeholder="Message"
          aria-label="Message"
          value={text}
          onChange={(event) => change(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {message.length > SHOW_COUNTER_FROM && (
          <span
            className={cx('composer__counter', message.length > MAX_MESSAGE_LENGTH && 'composer__counter--over')}
            title={`Up to ${MAX_MESSAGE_LENGTH} characters`}
          >
            {MAX_MESSAGE_LENGTH - message.length}
          </span>
        )}
      </div>
      <button type="submit" className="composer__send" disabled={!canSend} aria-label="Send message" title="Send">
        <Icon name="send" />
      </button>
    </form>
  );
}
