import { Link } from 'react-router-dom'; 
import { Button } from '../button'; 
import logo from '../../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export const Header = () => {
  const navigate = useNavigate();
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);

  const userToken = localStorage.getItem('userToken');

  useEffect(() => {
    const displayName = localStorage.getItem('userDisplayName');
    setUserDisplayName(displayName);
  }, []);

  // Clear session
  const handleLogout = () => {
    localStorage.clear();
    setUserDisplayName(null);
    navigate('/');
  }

  return (
    <header className="w-full bg-[#BFD7FF] p-0 fixed top-0 z-50" style={{width: "100%", height: "60px"}}>
      <div className="flex items-center justify-between h-full">
        <Link to="/" className="flex items-center">
          <img 
            src={logo}
            alt="Logo" 
            width={50} 
            height={50} 
            className="mr-4"
          />
          <h1 className="text-2xl font-bold">MapMe</h1>
        </Link>
        <nav>
            
          <ul className="flex space-x-6 items-center pr-4">
            <li>
                <Link to="/map" className="text-xl text-black hover:text-blue-600">About</Link>
            </li>
            
            {userToken ? (
              <>
                <li>
                  <button 
                    onClick={handleLogout} 
                    className="cursor-pointer text-xl text-red-600 hover:text-red-800"
                  >
                    Logout
                  </button>
                </li>
                <li>
                  <Button 
                    text={userDisplayName || 'Profile'} 
                    onClick={() => navigate('/map')} 
                  />
                </li>
              </>
            ) : (
              <li>
                <Button text="Login" onClick={() => navigate('/login')} />
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};