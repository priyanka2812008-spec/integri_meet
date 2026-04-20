import React, { useEffect, useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme for the editor
import { socket } from '../utils/socket';
import { Copy, Terminal } from 'lucide-react';
import './CodeEditor.css';

const CodeEditor = ({ roomId, userEmail, initialCode, readOnly = false }) => {
  const [code, setCode] = useState(initialCode || '// Start coding here...\n');

  useEffect(() => {
    // Listen for code updates from others
    socket.on('code-update', (data) => {
      setCode(data.code);
    });

    return () => {
      socket.off('code-update');
    };
  }, []);

  const handleCodeChange = (newCode) => {
    if (readOnly) return;
    setCode(newCode);
    socket.emit('code-update', { roomId, code: newCode });
  };

  const handlePaste = (e) => {
    if (readOnly) return;
    // Security violation: Notify host of paste action
    console.warn('Security Alert: Code pasted into editor');
    socket.emit('security-alert', {
      roomId,
      userEmail,
      type: 'Potential Cheating',
      message: 'Code pasted into the editor'
    });
  };

  return (
    <div className="editor-container glass">
      <div className="editor-header">
        <div className="editor-title">
          <Terminal size={16} />
          <span>Collaborative Editor (JS)</span>
        </div>
        <div className="editor-actions">
           <span className="editor-status">{readOnly ? 'View Only' : 'Real-time Sync Active'}</span>
        </div>
      </div>
      <div className="editor-wrapper">
        <Editor
          value={code}
          onValueChange={handleCodeChange}
          highlight={(code) => highlight(code, languages.js)}
          padding={20}
          onPaste={handlePaste}
          readOnly={readOnly}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            minHeight: '100%',
            backgroundColor: 'transparent',
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
