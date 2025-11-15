import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '../Layout.jsx'
import Home from '../pages/Home.jsx'
import Analysis from '../pages/Analysis.jsx'
import HowItWorks from '../pages/HowItWorks.jsx'
import Safety from '../pages/Safety.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/home" element={<Layout><Home /></Layout>} />
        <Route path="/analysis" element={<Layout><Analysis /></Layout>} />
        <Route path="/how-it-works" element={<Layout><HowItWorks /></Layout>} />
        <Route path="/safety" element={<Layout><Safety /></Layout>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)

