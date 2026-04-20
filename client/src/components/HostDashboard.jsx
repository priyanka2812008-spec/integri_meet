import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';
import { AlertCircle, Activity, Users, ShieldAlert, Video, VideoOff, UserX } from 'lucide-react';
import AlertModal from './AlertModal';
import CodeEditor from './CodeEditor';
import './HostDashboard.css';

const HostDashboard = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [currentCode, setCurrentCode] = useState('');

  const fetchSessionAndLogs = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/meeting/${roomId}`);
      if (res.ok) {
        setSession(await res.json());
      }
      
      const logRes = await fetch(`http://localhost:5000/api/meeting/${roomId}/logs`);
      if (logRes.ok) {
        setLogs(await logRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSessionAndLogs();

    socket.connect();
    // Host doesn't need video but joins room to get events
    socket.emit('join-room', { roomId, role: 'host' });

    socket.on('refresh-dashboard', () => {
      fetchSessionAndLogs();
    });

    socket.on('alert', (data) => {
      setActiveAlert(data);
    });

    socket.on('code-update', (data) => {
      setCurrentCode(data.code);
    });

    return () => {
      socket.off('refresh-dashboard');
      socket.off('alert');
      socket.off('code-update');
      socket.disconnect();
    };
  }, [roomId]);

  if (!session) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header glass">
        <div>
           <h2>Host Dashboard</h2>
           <p className="room-id">Room: {roomId}</p>
        </div>
        <div className="stats-cards">
          <div className="stat-card">
            <Users size={20} className="text-primary" />
            <span>{session.participants.length} Total</span>
          </div>
          <div className="stat-card">
            <Activity size={20} className="text-success" />
            <span>{session.participants.filter(p => p.status === 'live').length} Active</span>
          </div>
          <div className="stat-card">
            <ShieldAlert size={20} className="text-danger" />
            <span>{session.participants.filter(p => p.status === 'terminated').length} Terminated</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="participants-panel glass">
          <h3><Users size={18} /> Participants</h3>
          <div className="participants-list">
            {session.participants.length === 0 ? (
              <p className="empty-state">No participants joined yet.</p>
            ) : (
              session.participants.map(p => (
                <div key={p.email} className={`participant-card ${p.status}`}>
                  <div className="p-info">
                    <strong>{p.name}</strong>
                    <span>{p.email}</span>
                  </div>
                  <div className="p-status">
                    {p.status === 'live' && <span className="badge success"><Video size={14}/> Live</span>}
                    {p.status === 'camera_disabled' && <span className="badge warning"><VideoOff size={14}/> Cam Off</span>}
                    {p.status === 'terminated' && (
                      <span className="badge danger"><UserX size={14}/> Kicked: {p.reason}</span>
                    )}
                    {p.status === 'left' && <span className="badge neutral">Left</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        </div>

        <div className="logs-panel glass">
          <h3><Activity size={18} /> Activity Logs</h3>
          <div className="logs-list">
            {logs.length === 0 ? (
              <p className="empty-state">No activity recorded yet.</p>
            ) : (
              logs.map(log => (
                <div key={log._id} className={`log-item ${log.eventType}`}>
                  <div className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  <div className="log-content">
                    <strong>{log.userEmail || 'System'}</strong>: {log.details}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="code-panel glass">
          <h3><Video size={18} /> Live Code Preview</h3>
          <div className="code-preview-wrapper">
             <CodeEditor 
               roomId={roomId} 
               initialCode={session.currentCode || currentCode} 
               readOnly={true} 
             />
          </div>
        </div>
      </div>

      <AlertModal 
        isOpen={!!activeAlert}
        type="error"
        title="Security Alert"
        message={activeAlert?.message}
        onClose={() => setActiveAlert(null)}
      />
    </div>
  );
};

export default HostDashboard;
