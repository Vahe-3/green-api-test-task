interface ClaimMessage {
  type: 'claim';
  at: number;
}

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('green-chat:tabs');
let claimedAt = 0;

export function claimTab() {
  claimedAt = Date.now();
  channel?.postMessage({ type: 'claim', at: claimedAt } satisfies ClaimMessage);
}

export function onTabClaimed(listener: () => void): () => void {
  if (!channel) return () => {};
  const onMessage = (event: MessageEvent<unknown>) => {
    const data = event.data as Partial<ClaimMessage> | null;
    if (data?.type === 'claim' && typeof data.at === 'number' && data.at >= claimedAt) listener();
  };
  channel.addEventListener('message', onMessage);
  return () => channel.removeEventListener('message', onMessage);
}
