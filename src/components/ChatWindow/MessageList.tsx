import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { Message } from '../../types';
import { formatDayLabel, isSameDay } from '../../utils/date';
import { MessageBubble } from './MessageBubble';

const GROUP_GAP_MS = 5 * 60_000;
const NEAR_BOTTOM_PX = 120;

interface DayGroup {
  key: string;
  label: string;
  items: Array<{ message: Message; first: boolean; last: boolean }>;
}

const sameRun = (a: Message, b: Message) =>
  a.direction === b.direction && b.timestamp - a.timestamp < GROUP_GAP_MS && isSameDay(a.timestamp, b.timestamp);

function groupByDay(messages: Message[]): DayGroup[] {
  const days: DayGroup[] = [];
  messages.forEach((message, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    if (!prev || !isSameDay(prev.timestamp, message.timestamp)) {
      days.push({ key: `day-${message.id}`, label: formatDayLabel(message.timestamp), items: [] });
    }
    days[days.length - 1].items.push({
      message,
      first: !prev || !sameRun(prev, message),
      last: !next || !sameRun(message, next),
    });
  });
  return days;
}

interface MessageListProps {
  messages: Message[];
  onRetry: (message: Message) => void;
}

export function MessageList({ messages, onRetry }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const days = useMemo(() => groupByDay(messages), [messages]);
  const lastMessage = messages[messages.length - 1];

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && (atBottom.current || lastMessage?.direction === 'outgoing')) el.scrollTop = el.scrollHeight;
  }, [messages.length, lastMessage?.direction]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (atBottom.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="messages"
      ref={scrollRef}
      onScroll={(event) => {
        const el = event.currentTarget;
        atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
      }}
    >
      <div className="messages__inner" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty__title">No messages here yet</div>
            <div className="chat-empty__text">Send a message to start the conversation.</div>
          </div>
        ) : (
          days.map((day) => (
            <section key={day.key} className="day">
              <div className="pill day__label">{day.label}</div>
              {day.items.map(({ message, first, last }) => (
                <MessageBubble key={message.id} message={message} first={first} last={last} onRetry={onRetry} />
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
