import React from 'react';
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import './AlertModal.css';

const AlertModal = ({ isOpen, title, message, type = 'warning', onClose, actionButton }) => {
  if (!isOpen) return null;

  const icons = {
    warning: <AlertTriangle size={48} className="text-warning" />,
    error: <XCircle size={48} className="text-danger" />,
    success: <CheckCircle size={48} className="text-success" />
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass">
        <div className="modal-icon">
          {icons[type]}
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        
        <div className="modal-actions">
          {actionButton ? (
             actionButton
          ) : (
            <button className="modal-btn" onClick={onClose}>
              Acknowledge
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
