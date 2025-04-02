import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { MapPage } from './pages/MapPage'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/404'
import './App.css'

function App() {

  return (
    <Routes>
      <Route path="/login" element={
        <RequireNoAuth>
          <LoginPage />
        </RequireNoAuth>
      } />
      <Route path="/signup" element={
        <RequireNoAuth>
          <SignupPage />
        </RequireNoAuth>
      } />
      <Route path="/map" element={
        <RequrireAuth>
          <MapPage />
        </RequrireAuth>
      } />
      <Route path="/" element={<LandingPage />} />

      {/* Default Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

const RequrireAuth = ({ children }: { children: React.ReactNode }) => {
  const userToken = localStorage.getItem('userToken');
  if (!userToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const RequireNoAuth = ({ children }: { children: React.ReactNode }) => {
  const userToken = localStorage.getItem('userToken');
  if (userToken) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default App
