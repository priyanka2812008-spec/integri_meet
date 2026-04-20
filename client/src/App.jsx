import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JoinPage from './components/JoinPage';
import MeetingRoom from './components/MeetingRoom';
import HostDashboard from './components/HostDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header glass">
          <div className="logo">
            <span className="shield">🛡️</span>
            <h1>IntegriMeet</h1>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<JoinPage />} />
            <Route path="/room/:roomId" element={<MeetingRoom />} />
            <Route path="/host/:roomId" element={<HostDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
