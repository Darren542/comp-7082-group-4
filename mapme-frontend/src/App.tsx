import { Routes, Route } from 'react-router-dom'
import Login from './pages/login'
import Map from './pages/map'
import LandingPage from './pages/landingPage'
import './App.css'
import { useState } from 'react'
import Signup from './pages/signup'

interface User {
  id: string,
  email: string,
  token: string,
}

function App() {
  const [user] = useState<User | null>(null);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/map" element={<Map />} />
      <Route path="/" element={<LandingPage user={user} />} />
    </Routes>
  )
}

export default App
