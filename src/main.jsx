import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider }         from './context/AuthContext.jsx'
import { SecurityProvider }     from './context/SecurityContext.jsx'
import { GuestSessionProvider } from './context/GuestSessionContext.jsx'
import { flushOfflineQueue }    from './services/syncService.js'
import './styles.css'

// Flush any sync items queued during a previous offline session
flushOfflineQueue().catch(() => {})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SecurityProvider>
        <GuestSessionProvider>
          <App />
        </GuestSessionProvider>
      </SecurityProvider>
    </AuthProvider>
  </React.StrictMode>
)
