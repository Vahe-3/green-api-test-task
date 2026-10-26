import type { MessageStatus } from '../../types';
import { Icon } from './Icon';

const LABELS: Record<MessageStatus, string> = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Not sent',
};

export function StatusIcon({ status, size = 16 }: { status?: MessageStatus; size?: number }) {
  if (!status) return null;
  const icon = status === 'sending' ? 'clock' : status === 'sent' ? 'check' : status === 'failed' ? 'error' : 'doubleCheck';
  return (
    <span className={`status status--${status}`} title={LABELS[status]}>
      <Icon name={icon} size={size} />
    </span>
  );
}
