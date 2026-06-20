import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider }         from './context/AuthContext.jsx'
import { SecurityProvider }     from './context/SecurityContext.jsx'
import { GuestSessionProvider } from './context/GuestSessionContext.jsx'
import { KioskProvider }        from './context/KioskContext.jsx'
import { flushOfflineQueue }    from './services/syncService.js'
import './styles.css'

// Flush any sync items queued during a previous offline session
flushOfflineQueue().catch(() => {})

// TEMP: unregister any existing service workers so stale cached frontend
// assets are dropped while we verify the latest build is actually serving live.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister())
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SecurityProvider>
        <GuestSessionProvider>
          <KioskProvider>
            <App />
          </KioskProvider>
        </GuestSessionProvider>
      </SecurityProvider>
    </AuthProvider>
  </React.StrictMode>
)
