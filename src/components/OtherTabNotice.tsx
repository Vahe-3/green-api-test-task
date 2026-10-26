import { useChatStore } from '../store/ChatStoreContext';
import { Icon } from './ui/Icon';

export function OtherTabNotice() {
  const { reclaimTab } = useChatStore();
  return (
    <div className="notice-screen">
      <div className="notice-screen__card" role="alertdialog" aria-labelledby="other-tab-title">
        <div className="notice-screen__icon">
          <Icon name="chat" size={48} />
        </div>
        <h1 id="other-tab-title" className="notice-screen__title">
          Open in another tab
        </h1>
        <p className="notice-screen__text">
          Telegram Chat works in one tab at a time, so no messages get lost between tabs. It's paused here.
        </p>
        <div className="notice-screen__actions">
          <button type="button" className="btn btn--primary btn--block" onClick={reclaimTab} autoFocus>
            Use here
          </button>
        </div>
      </div>
    </div>
  );
}
