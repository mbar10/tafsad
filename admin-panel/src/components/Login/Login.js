import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { handleLogin, loginError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin(username, password);
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>התחברות למערכת</h2>
        {loginError && <div className="error-message">{loginError}</div>}
        <div className="form-group">
          <label htmlFor="username">שם משתמש:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">סיסמה:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">התחבר</button>
      </form>
    </div>
  );
};

export default Login; 