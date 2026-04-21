import { useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';
import AppRoute from './AppRoute';
import enMessages from './locales/en.json';
import plMessages from './locales/pl.json';
import {useAuthStore} from '@store/useAuthStore';
import './App.css';

// elo
const flattenMessages = (nestedMessages: any, prefix = '') => {
  if (nestedMessages === null) return {};
  return Object.keys(nestedMessages).reduce((messages: any, key) => {
    const value = nestedMessages[key];
    const prefixedKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      messages[prefixedKey] = value;
    } else {
      Object.assign(messages, flattenMessages(value, prefixedKey));
    }
    return messages;
  }, {});
};

const locale = navigator.language.startsWith('pl') ? 'pl' : 'en';

const messages = {
  pl: flattenMessages(plMessages),
  en: flattenMessages(enMessages),
};

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const [isSessionInitialized, setIsSessionInitialized] = useState(false);

  useEffect(() => {
    let active = true;

    const bootstrapSession = async () => {
      try {
        await initialize();
      } finally {
        if (active) setIsSessionInitialized(true);
      }
    };

    void bootstrapSession();
    return () => {
      active = false;
    };
  }, [initialize]);

  if (!isSessionInitialized) {
    return null;
  }

  return (
    <IntlProvider
      locale={locale}
      messages={messages[locale]}
      defaultLocale="pl"
    >
      <AppRoute />
    </IntlProvider>
  );
}

export default App;