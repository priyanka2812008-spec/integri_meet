import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // Removing StrictMode to prevent double-mounting which causes dual WebRTC/socket connections
  <App />
)
