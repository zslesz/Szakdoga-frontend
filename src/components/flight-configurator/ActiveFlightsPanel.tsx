import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

export default function ActiveFlightsPanel() {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const data = await apiService.getInTransitFleet();
      setFlights(data);
    } catch (error) {
      console.error('Hiba a járatok lekérésekor', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  const handleArrival = async (fleetId: number) => {
    try {
      const result = await apiService.arriveFleet(fleetId);
      alert(result.message);
      fetchFlights(); // Frissítjük a listát, hogy eltűnjön a gép
      // Újratöltjük az oldalt, hogy a lenyíló listák is frissüljenek
      window.location.reload();
    } catch (error: any) {
      alert("Hiba: " + error.message);
    }
  };

  if (loading) return null;
  if (flights.length === 0) return null; // Ha nincs gép a levegőben, elrejtjük

  return (
    <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl mb-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-sky-400">✈️</span> Úton lévő (Aktív) járatok ({flights.length})
        </h2>
        <button onClick={fetchFlights} className="text-sm text-slate-400 hover:text-white transition-colors">
          🔄 Frissítés
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flights.map(flight => (
          <div key={flight.id} className="bg-slate-900 border border-sky-900/50 p-4 rounded-xl flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sky-400">{flight.registration}</h3>
              <p className="text-xs text-slate-400">Típus: {flight.aircraft_type_id}</p>
            </div>

            <button
              onClick={() => handleArrival(flight.id)}
              className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-sky-900/20"
            >
              🛬 Érkezés rögzítése
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}