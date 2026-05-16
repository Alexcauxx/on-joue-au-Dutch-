import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ── Enregistrement du Service Worker ───────────────────────────
// Activé uniquement en production (pas en développement local)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        console.log('[SW] Enregistré avec succès:', reg.scope)

        // Vérifier les mises à jour
        reg.addEventListener('updatefound', () => {
          console.log('[SW] Mise à jour disponible')
          const newWorker = reg.installing
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] Nouvelle version disponible — rechargement possible')
            }
          })
        })
      })
      .catch(err => console.error('[SW] Erreur d\'enregistrement:', err))
  })
} else if (!import.meta.env.PROD) {
  console.log('[SW] Service Worker désactivé en développement')
}
