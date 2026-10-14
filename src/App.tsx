import { useState, useEffect } from 'react';
import Login from './components/auth/Login.tsx';
import FlightConfigurator from './components/flight-configurator/FlightConfigurator.tsx';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    // Ellenőrizzük, van-e már token a böngészőben (hogy ne kelljen frissítéskor újra belépni)
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedName = localStorage.getItem('username');

    if (token) {
      setIsAuthenticated(true);
      setRole(savedRole || 'viewer');
      setUsername(savedName || 'User');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => {
      setIsAuthenticated(true);
      setRole(localStorage.getItem('role') || 'viewer');
      setUsername(localStorage.getItem('username') || 'User');
    }} />;
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* FEJLÉC A KIJELENTKEZÉS GOMBBAL */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-md">
        <h1 className="text-white font-bold text-xl tracking-wide">AeroCargo Manager</h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white text-sm font-bold">{username}</p>
            <p className="text-blue-400 text-xs uppercase tracking-wider font-semibold">{role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Kijelentkezés
          </button>
        </div>
      </header>

      {/* MAGA AZ ALKALMAZÁS */}
      <FlightConfigurator />
    </div>
  );
}