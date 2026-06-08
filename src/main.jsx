import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CvProvider } from './Context/CvContext'
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <CvProvider>
    <App />
  </CvProvider>
  </BrowserRouter>
)
