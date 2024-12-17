import React, { useState } from 'react';
    import { useTranslation } from 'react-i18next';

    function LoginForm({ onLogin }) {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [error, setError] = useState('');
      const { t } = useTranslation();

      const handleSubmit = async (event) => {
        event.preventDefault();
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
          onLogin(data.user);
        } else {
          setError(data.message);
        }
      };

      const handleTestLogin = async () => {
        setUsername('testuser2');
        setPassword('testpassword2');
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: 'testuser2', password: 'testpassword2' })
        });
        const data = await response.json();
        if (response.ok) {
          onLogin(data.user);
        } else {
          setError(data.message);
        }
      };

      return (
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div>{error}</div>}
          <div>
            <input
              type="text"
              placeholder={t('username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit">{t('login')}</button>
          <button type="button" onClick={handleTestLogin}>
            {t('login_with_test_account')}
          </button>
        </form>
      );
    }

    export default LoginForm;
