import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { socket } from '../utils/socket';
import { useTabVisibility } from '../utils/tabDetection';
import AlertModal from './AlertModal';
import CodeEditor from './CodeEditor';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, ShieldAlert, Code } from 'lucide-react';
import './MeetingRoom.css';

const MeetingRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { name, email, role } = location.state || {};

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef(null);
  
  const [localStream, setLocalStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [initialCode, setInitialCode] = useState('');
  const [showEditor, setShowEditor] = useState(true);

  // Protect route
  useEffect(() => {
    if (!email || !roomId) {
      navigate('/');
    }
  }, [email, roomId, navigate]);

  // Tab switch detection
  useTabVisibility(() => {
    if (!isTerminated && role === 'participant') {
      console.warn('Tab switch detected!');
      
      // Explicitly turn off camera locally
      setCameraOn(false);
      if (localStream) {
        localStream.getVideoTracks().forEach(t => t.enabled = false);
      }
      
      // Emit event to backend
      socket.emit('tab-switch', { roomId, userEmail: email });
    }
  });

  useEffect(() => {
    // Connect socket and join room
    socket.connect();
    socket.emit('join-room', { roomId, email, role });

    // Fetch initial session state to get existing code
    const fetchSession = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/meeting/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setInitialCode(data.currentCode);
        }
      } catch (e) {
        console.error('Error fetching session', e);
      }
    };
    fetchSession();

    // Handle termination kick
    socket.on('user-terminated', ({ reason }) => {
      setIsTerminated(true);
      setTerminationReason(reason);
      
      // Stop media tracks immediately
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      socket.disconnect();
    });

    // Handle signaling
    socket.on('user-joined', async ({ socketId }) => {
      if (role === 'host' || role === 'participant') {
        const pc = createPeerConnection(socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { target: socketId, offer, from: socket.id });
      }
    });

    socket.on('offer', async ({ offer, from }) => {
       const pc = createPeerConnection(from);
       await pc.setRemoteDescription(new RTCSessionDescription(offer));
       const answer = await pc.createAnswer();
       await pc.setLocalDescription(answer);
       socket.emit('answer', { target: from, answer, from: socket.id });
    });

    socket.on('answer', async ({ answer }) => {
       if (peerConnectionRef.current) {
         await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
       }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
       if (peerConnectionRef.current) {
         try {
           await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
         } catch (e) {
           console.error('Error adding ice candidate', e);
         }
       }
    });

    return () => {
      socket.off('user-terminated');
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.disconnect();
    };
  }, [roomId, email, role]);

  const createPeerConnection = (targetSocketId) => {
    // If we already have a connection, close it before starting a new one for 1-on-1
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('ice-candidate', { target: targetSocketId, candidate: event.candidate, from: socket.id });
      }
    };

    pc.ontrack = event => {
      console.log('Received remote track', event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  };

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing media', err);
    }
  };

  // Initialize Media Stream - Runs once
  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing media', err);
      }
    };

    startMedia();
    
    return () => {
      // Cleanup tracks on unmount
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []); // Run only on mount

  // AI Overlay Detection Interval
  useEffect(() => {
    if (role !== 'participant' || isTerminated || !localStream) return;

    const aiInterval = setInterval(async () => {
      if (localVideoRef.current) {
        try {
          // Create canvas to capture frame
          const canvas = document.createElement('canvas');
          canvas.width = localVideoRef.current.videoWidth || 640;
          canvas.height = localVideoRef.current.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(localVideoRef.current, 0, 0);
          const imageBase64 = canvas.toDataURL('image/jpeg', 0.5);

          // Send to AI endpoint
          const response = await fetch('http://localhost:5000/api/ai/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64, roomId, userEmail: email })
          });
          const data = await response.json();

          if (data.suspicious) {
            console.warn(`AI ALERT: ${data.message}`);
            // Explicitly turn off camera locally
            setCameraOn(false);
            if (localStream) {
              localStream.getVideoTracks().forEach(t => t.enabled = false);
            }
            // Emit with custom reason from AI module
            socket.emit('tab-switch', { roomId, userEmail: email, customReason: data.message });
          }
        } catch (err) {
          console.error('AI Processing error', err);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(aiInterval);
  }, [localStream, isTerminated, role, roomId, email]);

  const toggleCamera = () => {
    const newStatus = !cameraOn;
    setCameraOn(newStatus);
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = newStatus;
      // Notify backend to update UI on host dashboard
      socket.emit('camera-status', { roomId, userEmail: email, status: newStatus });
    }
  };

  const toggleMic = () => {
    setMicOn(!micOn);
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !micOn;
    }
  };

  const leaveMeeting = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    socket.disconnect();
    navigate('/');
  };

  if (isTerminated) {
    return (
      <AlertModal 
        isOpen={true}
        type="error"
        title="Access Terminated"
        message={terminationReason}
        actionButton={
          <button className="modal-btn" onClick={() => navigate('/')}>Return to Home</button>
        }
      />
    );
  }

  return (
    <div className="room-container">
      <div className="room-header glass">
        <div className="room-info">
          <h2>Technical Interview</h2>
          <span className="room-id">ID: {roomId}</span>
          {role === 'participant' && (
            <div className="security-badge">
              <ShieldAlert size={16} /> Strict Monitoring Active
            </div>
          )}
        </div>
      </div>

      <div className="room-content">
        <div className="video-section">
          <div className="video-grid">
            <div className="video-wrapper main-video">
               <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
               <div className="video-label">Interviewer</div>
            </div>

            <div className="video-wrapper self-video">
               <video ref={localVideoRef} autoPlay muted playsInline className="local-video" />
               <div className="video-label">{name} (You)</div>
               {!cameraOn && <div className="camera-off-overlay"><CameraOff size={32} /></div>}
            </div>
          </div>
        </div>

        {showEditor && (
          <div className="editor-section">
            <CodeEditor 
              roomId={roomId} 
              userEmail={email} 
              initialCode={initialCode} 
              readOnly={isTerminated}
            />
          </div>
        )}
      </div>

      <div className="controls glass">
        <button className={`control-btn ${!micOn ? 'danger' : ''}`} onClick={toggleMic}>
          {micOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        <button className={`control-btn ${!cameraOn ? 'danger' : ''}`} onClick={toggleCamera}>
           {cameraOn ? <Camera size={24} /> : <CameraOff size={24} />}
        </button>
        <button className="control-btn end-call" onClick={leaveMeeting}>
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

export default MeetingRoom;
