import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { SunriverLogo } from '../components/Icons';
import { Language } from '../types';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const context = useContext(AppContext);

  if (!context) return null;
  const { login, language, setLanguage, t, customLogo } = context;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      setError('');
    } else {
      setError(t('invalid_credentials'));
    }
  };

  const LanguageButton: React.FC<{ lang: Language, label: string }> = ({ lang, label }) => (
    <button
        onClick={() => setLanguage(lang)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${language === lang ? 'bg-sunriver-yellow text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
        {label}
    </button>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50 p-4">
      <div className="w-full max-w-sm p-6 sm:p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
            <SunriverLogo src={customLogo} className="w-20 h-20 mx-auto text-sunriver-yellow object-contain" />
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">{t('sunriver_hotel')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('management_system')}</p>
        </div>

        <div className="flex justify-center space-x-4">
            <LanguageButton lang="en" label="English" />
            <LanguageButton lang="th" label="ภาษาไทย" />
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">{t('username')}</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-sunriver-yellow focus:border-sunriver-yellow focus:z-10 sm:text-sm"
                placeholder={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-input" className="sr-only">{t('password')}</label>
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-sunriver-yellow focus:border-sunriver-yellow focus:z-10 sm:text-sm"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sunriver-yellow hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sunriver-yellow"
            >
              {t('login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;