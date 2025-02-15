import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bgPhoto from "../../assets/bg.png";
import city from "../../assets/city.png";
import gLogo from "../../assets/googleLogo.svg";
import { Button } from "../../components/button";
import { InputField } from "../../components/inputField";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (localStorage.getItem('userToken')) {
      // User logged in, navigate to map
      navigate('/map');
    }
  }, [navigate])

  const handleLogin = async () => {
    setError("");

    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Set user state using returned data
      localStorage.setItem('userToken', data.session.access_token);
      localStorage.setItem('userEmail', data.user.email);

      // Redirect to map page
      navigate("/map");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <div
      className="bg-cover h-screen w-screen flex flex-col items-center justify-center"
      style={{ backgroundImage: `url(${bgPhoto})` }}
    >
      <div className="flex w-full max-w-7xl items-center justify-center">
        <div className="w-1/2 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-6xl font-bold text-black">Login To MapMe</h1>
            <h1 className="text-3xl text-black pt-5 font-medium">Your map is waiting</h1>
          </div>
          <div className="w-1/2 flex flex-col items-center justify-center mt-8 space-y-4">
            <InputField placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <InputField
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500">{error}</p>}
            <Button text="Login" onClick={handleLogin} />
            <h1 className="text-2xl opacity-30 text-black font-medium">Or</h1>
            <button
              className="flex items-center justify-center gap-2 w-[345px] h-[48px] border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              <img src={gLogo} alt="Google logo" className="w-6 h-6" />
              <span className="text-gray-700 font-medium">Sign in with Google</span>
            </button>
            <h1>
              Forgot Password? <a className="text-blue-500 underline">Reset</a>
            </h1>
            <h1>
              Don't have an account? <a className="cursor-pointer text-blue-500 underline" href="/signup">Signup</a>
            </h1>
          </div>
        </div>
        <div className="w-1/2">
          <div>
            <img src={city} alt="city" width={500} height={300} className="object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
