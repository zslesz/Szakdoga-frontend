import { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import FlightConfigurator from './components/flight-configurator/FlightConfigurator';
import CustomerPortal from './components/flight-configurator/CustomerPortal.tsx';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedName = localStorage.getItem('username');

    if (token) {
      setIsAuthenticated(true);
      setRole((savedRole || 'viewer').toLowerCase());
      setUsername(savedName || 'User');
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => {
      setIsAuthenticated(true);
      setRole((localStorage.getItem('role') || 'viewer').toLowerCase());
      setUsername(localStorage.getItem('username') || 'User');
    }} />;
  }

  // ELDÖNTJÜK, MIT LÁT A FELHASZNÁLÓ A SZEREPKÖRE ALAPJÁN
  let MainContent;
  if (role === 'user' || role === 'customer') {
    MainContent = <CustomerPortal />;
  } else {
    MainContent = <FlightConfigurator />;
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

      {/* MAGA AZ ALKALMAZÁS NÉZETE */}
      {MainContent}

    </div>
  );
}