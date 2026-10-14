import { useState } from 'react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // A FastAPI OAuth2 formátumot vár, nem JSON-t!
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      // ✅ HELYES URL A LOGIN.TSX-BEN:
      const response = await fetch('http://127.0.0.1:8000/api/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role); // Ez az elem felelős a szerepkör tárolásáért
        localStorage.setItem('username', username);

        onLoginSuccess(); // Szólunk a fő appnak, hogy váltson nézetet
      } else {
        setError('Hibás felhasználónév vagy jelszó!');
      }
    } catch (err) {
      setError('Nem sikerült csatlakozni a szerverhez.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">

        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">Légi Árufuvarozási Rendszer</h2>
        <p className="text-slate-400 text-center text-sm mb-8">Kérjük, jelentkezzen be a folytatáshoz</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Felhasználónév</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Jelszó</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Bejelentkezés...' : 'Bejelentkezés'}
          </button>
        </form>

        <div className="mt-8 text-center text-slate-500 text-xs">
          <p>Teszt fiókok: Admin / Cargo Agent / Loadmaster</p>
          <p>Jelszavak: admin / cargoagent / loadmaster</p>
        </div>
      </div>
    </div>
  );
}