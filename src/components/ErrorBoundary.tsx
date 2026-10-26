import { Component, type ReactNode } from 'react';
import { clearSavedData } from '../store/storage';
import { errorText } from '../utils/chat';
import { Icon } from './ui/Icon';

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, { error: unknown }> {
  state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error: error ?? new Error('Unknown error') };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="notice-screen">
        <div className="notice-screen__card" role="alert">
          <div className="notice-screen__icon notice-screen__icon--danger">
            <Icon name="error" size={48} />
          </div>
          <h1 className="notice-screen__title">Something went wrong</h1>
          <p className="notice-screen__text">
            Reloading the page usually helps. If it keeps happening, reset the app: this signs you out and deletes
            the chats saved in this browser.
          </p>
          <p className="notice-screen__detail">{errorText(this.state.error)}</p>
          <div className="notice-screen__actions">
            <button type="button" className="btn btn--primary btn--block" onClick={() => location.reload()}>
              Reload
            </button>
            <button
              type="button"
              className="btn btn--text btn--danger btn--block"
              onClick={() => {
                clearSavedData();
                location.reload();
              }}
            >
              Reset the app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
