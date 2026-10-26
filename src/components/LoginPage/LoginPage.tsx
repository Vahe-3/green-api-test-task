import { useState } from 'react';
import { api, isDemoMode, NotificationsOffError } from '../../api';
import { useChatStore } from '../../store/ChatStoreContext';
import type { Credentials } from '../../types';
import { errorText } from '../../utils/chat';
import { Icon } from '../ui/Icon';
import { TextField } from '../ui/TextField';
import './LoginPage.css';

const DEFAULT_API_URL = 'https://api.green-api.com';

type Errors = Partial<Record<keyof Credentials, string>>;

function validate(credentials: Credentials): Errors {
  const errors: Errors = {};
  if (!credentials.idInstance) errors.idInstance = 'Enter your instance ID';
  else if (!/^\d+$/.test(credentials.idInstance)) {
    errors.idInstance = 'The instance ID is a number from the GREEN-API console, not your username';
  }
  if (!credentials.apiTokenInstance) errors.apiTokenInstance = 'Enter your API token';
  if (!/^https?:\/\/[^\s/]+$/.test(credentials.apiUrl)) errors.apiUrl = `Enter a URL like ${DEFAULT_API_URL}`;
  return errors;
}

export function LoginPage() {
  const { state, login } = useChatStore();
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [showToken, setShowToken] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<'off' | 'enabling' | 'enabled' | null>(null);

  const readForm = (): Credentials => ({
    idInstance: idInstance.trim(),
    apiTokenInstance: apiTokenInstance.trim(),
    apiUrl: apiUrl.trim().replace(/\/+$/, ''),
  });

  async function submit() {
    const credentials = readForm();
    const found = validate(credentials);
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await api.checkAuth(credentials);
      login(credentials);
    } catch (error) {
      if (error instanceof NotificationsOffError) setNotifications('off');
      else setSubmitError(errorText(error));
      setLoading(false);
    }
  }

  async function enableNotifications() {
    setNotifications('enabling');
    setSubmitError(null);
    try {
      await api.enableNotifications(readForm());
      setNotifications('enabled');
    } catch (error) {
      setNotifications('off');
      setSubmitError(errorText(error));
    }
  }

  const error = submitError ?? (state.signOutReason && `You were signed out. ${state.signOutReason}`);

  const clearError = (field: keyof Credentials) => {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  return (
    <div className="login">
      <form
        className="login__card"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="login__logo">
          <Icon name="chat" size={64} />
        </div>
        <h1 className="login__title">Sign in to Telegram</h1>
        <p className="login__subtitle">
          Enter the details of your GREEN-API instance. You'll find them on the instance page in the{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            GREEN-API console
          </a>
          .
        </p>

        {isDemoMode && (
          <div className="login__demo" role="note">
            Demo mode: any values work, and replies are simulated.
          </div>
        )}

        <TextField
          label="Instance ID (idInstance)"
          hint="A number, e.g. 4100123456"
          value={idInstance}
          onChange={(event) => {
            setIdInstance(event.target.value);
            clearError('idInstance');
          }}
          error={errors.idInstance}
          inputMode="numeric"
          autoComplete="username"
          autoFocus
        />
        <TextField
          label="API token (apiTokenInstance)"
          type={showToken ? 'text' : 'password'}
          value={apiTokenInstance}
          onChange={(event) => {
            setApiTokenInstance(event.target.value);
            clearError('apiTokenInstance');
          }}
          error={errors.apiTokenInstance}
          autoComplete="current-password"
          spellCheck={false}
          trailing={
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowToken((value) => !value)}
              aria-label={showToken ? 'Hide token' : 'Show token'}
              title={showToken ? 'Hide token' : 'Show token'}
            >
              <Icon name={showToken ? 'eyeOff' : 'eye'} />
            </button>
          }
        />
        <TextField
          label="API URL"
          value={apiUrl}
          onChange={(event) => {
            setApiUrl(event.target.value);
            clearError('apiUrl');
          }}
          error={errors.apiUrl}
          hint="Shown as apiUrl in the console next to your instance."
          inputMode="url"
          spellCheck={false}
        />

        {(notifications === 'off' || notifications === 'enabling') && (
          <div className="login__notice" role="alert">
            <p>
              Message notifications are turned off for this instance, so the app can't receive replies or read
              receipts. New GREEN-API instances start with them off.
            </p>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => void enableNotifications()}
              disabled={notifications === 'enabling'}
            >
              {notifications === 'enabling' ? (
                <span className="spinner" aria-label="Turning on notifications" />
              ) : (
                'Turn them on'
              )}
            </button>
          </div>
        )}

        {notifications === 'enabled' && (
          <div className="login__success" role="status">
            Notifications are on. GREEN-API restarts the instance to apply them, which can take up to 5 minutes. Then
            press Sign in again.
          </div>
        )}

        {error && (
          <div className="login__error" role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
          {loading ? <span className="spinner" aria-label="Signing in" /> : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
