import { IntlProvider } from 'react-intl';
import AppRoute from './AppRoute';
import enMessages from './locales/en.json';
import plMessages from './locales/pl.json';
import './App.css';

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