import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { loadConfig } from './config';

const root = ReactDOM.createRoot(document.getElementById('root'));

loadConfig()
  .then(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((err) => {
    console.error('Failed to load config:', err);
    root.render(<div>Error loading config</div>);
  });

reportWebVitals();
