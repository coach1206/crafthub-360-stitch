import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider }         from './context/AuthContext.jsx'
import { SecurityProvider }     from './context/SecurityContext.jsx'
import { GuestSessionProvider } from './context/GuestSessionContext.jsx'
import { KioskProvider }        from './context/KioskContext.jsx'
import { flushOfflineQueue }    from './services/syncService.js'
import { registerServiceWorker } from './serviceWorkerRegistration.js'
import './styles.css'

console.log('MAIN ENTRY LOADED')
console.log('ROOT ELEMENT FOUND', !!document.getElementById('root'))

// Flush any sync items queued during a previous offline session
flushOfflineQueue().catch(() => {})

// Register service worker for PWA / offline support
registerServiceWorker()

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
