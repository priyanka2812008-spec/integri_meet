import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Shield, Video } from 'lucide-react';
import './JoinPage.css';

const JoinPage = () => {
  const [formData, setFormData] = useState({
    roomId: '',
    name: '',
    email: '',
    role: 'participant',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.roomId || !formData.email || (!formData.name && formData.role === 'participant')) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/meeting/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: formData.roomId,
          hostEmail: formData.role === 'host' ? formData.email : undefined,
          participantEmail: formData.role === 'participant' ? formData.email : undefined,
          participantName: formData.role === 'participant' ? formData.name : undefined,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join meeting');
      }

      // Route based on role
      if (formData.role === 'host') {
        navigate(`/host/${formData.roomId}`, { state: { email: formData.email } });
      } else {
        navigate(`/room/${formData.roomId}`, { state: { ...formData } });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-container">
      <div className="join-card glass">
        <div className="join-header">
          <Shield className="icon-shield" size={48} />
          <h2>Join IntegriMeet</h2>
          <p>Secure Technical Interview Environment</p>
        </div>

        <form onSubmit={handleSubmit} className="join-form">
          {error && <div className="error-message">{error}</div>}

          <div className="role-selector">
            <label className={`role-option ${formData.role === 'participant' ? 'active' : ''}`}>
              <input
                type="radio"
                name="role"
                value="participant"
                checked={formData.role === 'participant'}
                onChange={handleInputChange}
                hidden
              />
              <UserPlus size={20} /> Candidate
            </label>
            <label className={`role-option ${formData.role === 'host' ? 'active' : ''}`}>
              <input
                type="radio"
                name="role"
                value="host"
                checked={formData.role === 'host'}
                onChange={handleInputChange}
                hidden
              />
              <Video size={20} /> Host
            </label>
          </div>

          <div className="form-group">
            <label>Meeting ID</label>
            <input
              type="text"
              name="roomId"
              placeholder="e.g. tech-interview-123"
              value={formData.roomId}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          {formData.role === 'participant' && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
          )}

          <button type="submit" className="join-button" disabled={loading}>
            {loading ? 'Connecting...' : (formData.role === 'host' ? 'Create / Monitor' : 'Join Interview')}
          </button>
        </form>
        
        {formData.role === 'participant' && (
          <div className="security-notice">
            <p>🔒 <strong>Zero-Tolerance Policy active:</strong> Tab switching will result in immediate termination.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinPage;
