import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { MapPage } from './pages/MapPage'
import { LandingPage } from './pages/LandingPage'
import './App.css'

interface User {
  id: string,
  email: string,
  token: string,
}

function App() {
  const [user] = useState<User | null>(null);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/" element={<LandingPage user={user} />} />
    </Routes>
  )
}

export default App
