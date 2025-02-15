import { Link } from 'react-router-dom'; 
import { Button } from '../button'; 
import logo from '../../assets/logo.png';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const navigate = useNavigate();

  const userToken = localStorage.getItem('userToken');

  // Clear session
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  }

  return (
    <header className="w-full bg-[#BFD7FF] p-0" style={{width: "100%", height: "60px"}}>
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
                <Link to="/about" className="text-xl text-black hover:text-blue-600">About</Link>
            </li>
            <li>
              {/* <Button text="Login" onClick={() => window.location.href = '/login'} /> */}
              {
                userToken ? (
                  <Button text="Logout" onClick={handleLogout} />
                ) : (
                  <Button text="Login" onClick={() => navigate('/login')} />
                )
              }
            </li>

          </ul>
        </nav>
      </div>
    </header>
  );
};