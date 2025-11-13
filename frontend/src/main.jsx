import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>       {/* 1. <Router> is now the outermost component */}
      <AuthProvider> {/* 2. <AuthProvider> is INSIDE Router */}
        <App />      {/* 3. <App> is inside both */}
      </AuthProvider>
    </Router>
  </StrictMode>,
)