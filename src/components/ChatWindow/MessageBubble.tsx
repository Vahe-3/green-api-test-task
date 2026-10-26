import { memo } from 'react';
import type { Message } from '../../types';
import { cx } from '../../utils/chat';
import { formatTime } from '../../utils/date';
import { StatusIcon } from '../ui/StatusIcon';

interface MessageBubbleProps {
  message: Message;
  first: boolean;
  last: boolean;
  onRetry: (message: Message) => void;
}

export const MessageBubble = memo(function MessageBubble({ message, first, last, onRetry }: MessageBubbleProps) {
  const outgoing = message.direction === 'outgoing';
  const failed = outgoing && message.status === 'failed';

  return (
    <div
      className={cx(
        'msg',
        outgoing ? 'msg--out' : 'msg--in',
        first && 'msg--first',
        last && 'msg--last',
        message.unsupported && 'msg--unsupported',
      )}
    >
      <div className="msg__bubble">
        <span className="msg__text">
          {message.text}
          <span className="msg__spacer" aria-hidden="true" />
        </span>
        <span className="msg__meta">
          <time dateTime={new Date(message.timestamp).toISOString()}>{formatTime(message.timestamp)}</time>
          {failed ? (
            <button
              type="button"
              className="msg__retry"
              onClick={() => onRetry(message)}
              aria-label="Not sent. Retry"
              title="Not sent. Click to retry"
            >
              <StatusIcon status="failed" />
            </button>
          ) : (
            outgoing && <StatusIcon status={message.status} />
          )}
        </span>
        {last && (
          <svg className="msg__tail" width="9" height="17" viewBox="0 0 9 17" aria-hidden="true">
            <path d="M0 0C0 8 3 14 9 17H0Z" />
          </svg>
        )}
      </div>

      {failed && (
        <div className="msg__failed" role="alert">
          <span>Not sent{message.error ? `: ${message.error}` : ''}</span>
          <button type="button" className="msg__failed-retry" onClick={() => onRetry(message)}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
});
