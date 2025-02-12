import { Link } from 'react-router-dom'; 
import { Button } from '../components/button'; 
import logo from '../assets/logo.png';

const Header = () => {
  return (
    <header className="w-full bg-[#BFD7FF] p-4">
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
            
          <ul className="flex space-x-6 items-center">
            <li>
                <Link to="/about" className="text-xl text-black hover:text-blue-600">About</Link>
            </li>
            <li>
              <Button text="Login" onClick={() => window.location.href = '/login'} />
            </li>

          </ul>
        </nav>
      </div>
    </header>
  );
};
// Tried to use import { Routes, Route, useNavigate } from 'react-router-dom'; but didn't work :/ 

export default Header;
