import { Routes, Route, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { MapPage } from './pages/MapPage';
import { HomePage } from './pages/HomePage';
import './App.css';


function App() {
  const navigate = useNavigate();

  return (
    <>
      <Routes>
        {/* Need to add to router redirect away from this page if logged in */}
        <Route path="/login" element={<LoginPage />} />
        {/* Need to add to router redirect away from this map if not logged in */}
        <Route path="/map" element={<MapPage />} />
        <Route path="/" element={<HomePage />}/>
      </Routes>
    </>
  );
}

export default App;
