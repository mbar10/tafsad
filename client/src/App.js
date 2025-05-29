import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Form from './components/Form';
import { getConfig } from './config';

function App() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const {isEmpire} = getConfig();

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <img src="./mamason_invert.png" style={{width: "200px"}}/>
          <h1>מילוי טופס דיווח</h1>
          {
            isEmpire && <h2 className="empire">אימפריה!</h2>
          }
        </header>
        <main>
          <Routes>
            <Route path="/" element={
              <>
                <Form onSuccess={() => showSuccessToast('הטופס נשלח בהצלחה!')} />
                {showToast && (
                  <div className="toast">
                    {toastMessage}
                  </div>
                )}
              </>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 