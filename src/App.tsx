import { LoginPage } from './components/LoginPage/LoginPage';
import { Messenger } from './components/Messenger';
import { OtherTabNotice } from './components/OtherTabNotice';
import { useChatStore } from './store/ChatStoreContext';

export default function App() {
  const { state } = useChatStore();
  if (!state.credentials) return <LoginPage />;
  if (state.openElsewhere) return <OtherTabNotice />;
  return <Messenger />;
}
