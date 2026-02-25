import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SneakerProvider } from './context/SneakerContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SneakerProvider>
      <App />
    </SneakerProvider>
  </StrictMode>,
)
