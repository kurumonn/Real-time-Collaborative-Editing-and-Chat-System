import React, { useState, useEffect } from 'react';
    import ReactQuill from 'react-quill';
    import 'react-quill/dist/quill.snow.css';
    import { io } from 'socket.io-client';
    import LoginForm from './LoginForm';
    import { useTranslation } from 'react-i18next';
    import LanguageSwitcher from './LanguageSwitcher';

    const socket = io('http://localhost:3000', {
      transports: ['websocket'],
      upgrade: false
    });

    function App() {
      const [quill, setQuill] = useState(null);
      const [documentId, setDocumentId] = useState('');
      const [chatMessages, setChatMessages] = useState([]);
      const [chatInput, setChatInput] = useState('');
      const [isLoggedIn, setIsLoggedIn] = useState(false);
      const [user, setUser] = useState(null);
      const { t } = useTranslation();

      useEffect(() => {
        const checkAuth = async () => {
          const response = await fetch('/check-auth');
          const data = await response.json();
          setIsLoggedIn(data.isLoggedIn);
          setUser(data.user);
        };

        checkAuth();
      }, []);

      useEffect(() => {
        if (quill) {
          const handleTextChange = (delta, oldDelta, source) => {
            if (source === 'user') {
              socket.emit('text-change', { documentId, delta });
            }
          };

          quill.on('text-change', handleTextChange);

          socket.on('text-change', (delta) => {
            quill.updateContents(delta);
          });

          return () => {
            quill.off('text-change', handleTextChange);
            socket.off('text-change');
          };
        }
      }, [quill, documentId]);

      useEffect(() => {
        socket.on('chat-message', (message) => {
          setChatMessages((prevMessages) => [...prevMessages, message]);
        });

        socket.on('unauthorized', (message) => {
          console.error(message);
          setIsLoggedIn(false);
        });

        return () => {
          socket.off('chat-message');
          socket.off('unauthorized');
        };
      }, []);

      const handleJoinDocument = () => {
        if (documentId) {
          socket.emit('join-document', documentId);
        }
      };

      const handleSendMessage = () => {
        if (chatInput) {
          socket.emit('chat-message', { documentId, message: chatInput });
          setChatInput('');
        }
      };

      const handleLogin = (userData) => {
        setIsLoggedIn(true);
        setUser(userData);
      };

      const handleLogout = async () => {
        await fetch('/logout', { method: 'POST' });
        setIsLoggedIn(false);
        setUser(null);
      };

      if (!isLoggedIn) {
        return <LoginForm onLogin={handleLogin} />;
      }

      return (
        <div>
          <div>
            <span>{t('logged_in_as', { username: user.username })}</span>
            <button onClick={handleLogout}>{t('logout')}</button>
            <LanguageSwitcher />
          </div>
          <div>
            <input
              type="text"
              placeholder={t('enter_document_id')}
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
            />
            <button onClick={handleJoinDocument}>{t('join_document')}</button>
          </div>
          <div className="editor-container">
            <div className="editor">
              <ReactQuill theme="snow" onChangeSelection={(range) => { if (range && !quill) setQuill(range.quill); }} />
            </div>
            <div className="chat">
              <div className="chat-messages">
                {chatMessages.map((msg, index) => (
                  <div key={index}>{msg}</div>
                ))}
              </div>
              <input
                type="text"
                placeholder={t('enter_message')}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button onClick={handleSendMessage}>{t('send')}</button>
            </div>
          </div>
        </div>
      );
    }

    export default App;
