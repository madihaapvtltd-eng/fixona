import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

// Register PWA service worker with error handling
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready
    .then((registration) => {
      console.log('PWA Service Worker ready:', registration)
    })
    .catch((error) => {
      console.error('Service Worker error:', error)
    })

  // Unregister old/stuck service workers on page load to prevent issues
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().then(() => {
          console.log('Service Worker unregistered to prevent cache issues')
        })
      })
    })
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
