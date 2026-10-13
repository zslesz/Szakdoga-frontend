import { useState, useEffect } from 'react';

interface FuelCalculatorProps {
  aircraftId: string;
  aircraftName: string;
  maxRange?: number;
  maxPayloadKg?: number; // ÚJ PROP: A gép maximális teherbírása
  currentPayloadKg: number;
}

// Interfész a backendből érkező adatokhoz
interface FuelData {
  speed_kmh: number;
  base_burn_kgh: number;
  penalty_per_tonne: number;
  est_time_hours: number;
  hours: number;
  minutes: number;
  current_burn_rate: number;
  trip_fuel: number;
  contingency_fuel: number;
  reserve_fuel: number;
  total_fuel: number;
}

export default function FuelCalculator({
  aircraftId,
  aircraftName,
  maxRange = 6000,
  maxPayloadKg = 100000, // Alapértelmezett 100 tonna, ha nincs adat
  currentPayloadKg
}: FuelCalculatorProps) {

  // Állapotok a csúszkákhoz
  const [distance, setDistance] = useState<number>(maxRange > 0 ? Math.floor(maxRange / 2) : 3000);
  const [sliderPayload, setSliderPayload] = useState<number>(currentPayloadKg / 1000);

  const [fuelData, setFuelData] = useState<FuelData | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // A maximális teherbírás tonnában (a csúszka végpontja)
  const maxPayloadTonnes = maxPayloadKg / 1000;

  // Ha változik a kiválasztott gép hatótávja, frissítjük a távolságot
  useEffect(() => {
    if (maxRange > 0) setDistance(prev => prev > maxRange ? maxRange : prev);
  }, [maxRange]);

  // Ha a 3D nézetben pakolnak (változik a currentPayloadKg), ráhúzzuk a csúszkát is
  useEffect(() => {
    setSliderPayload(currentPayloadKg / 1000);
  }, [currentPayloadKg]);

  // --- API HÍVÁS A BACKENDHEZ ---
  useEffect(() => {
    if (!aircraftId) return;

    const fetchFuelMath = async () => {
      setIsCalculating(true);
      try {
        const response = await fetch('http://localhost:8000/api/v1/fuel/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aircraft_id: aircraftId,
            distance_km: distance,
            payload_kg: sliderPayload * 1000 // A CSÚSZKA ÉRTÉKÉT KÜLDJÜK (kg-ban)
          })
        });

        if (response.ok) {
          const data = await response.json();
          setFuelData(data);
        }
      } catch (error) {
        console.error("Hiba az üzemanyag számításnál", error);
      } finally {
        setIsCalculating(false);
      }
    };

    // Debounce: Vár 300ms-t a csúszka mozgatása után, hogy ne terhelje túl a backendet
    const timeoutId = setTimeout(() => {
      fetchFuelMath();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [aircraftId, distance, sliderPayload]);

  const formatNum = (num: number) => Math.round(num).toLocaleString('hu-HU').replace(/,/g, ' ');

  // Ha még tölt, vagy nincs adat
  if (!fuelData) {
    return <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mt-6 text-slate-400 text-center animate-pulse">Kalkulátor betöltése...</div>;
  }

  // Kördiagram kalkulációk
  const pctTrip = fuelData.total_fuel > 0 ? (fuelData.trip_fuel / fuelData.total_fuel) * 100 : 0;
  const pctContingency = fuelData.total_fuel > 0 ? (fuelData.contingency_fuel / fuelData.total_fuel) * 100 : 0;

  const endTrip = pctTrip;
  const endCont = pctTrip + pctContingency;
  const conicGradient = `conic-gradient(#3b82f6 0% ${endTrip}%, #f59e0b ${endTrip}% ${endCont}%, #10b981 ${endCont}% 100%)`;

  return (
    <div className={`bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mt-6 transition-opacity duration-300 ${isCalculating ? 'opacity-75' : 'opacity-100'}`}>

      {/* FEJLÉC */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white uppercase tracking-wider">Cargo Üzemanyag-kalkulátor - {aircraftName}</h3>
      </div>

      <div className="space-y-6">

        {/* TÁVOLSÁG CSÚSZKA */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Repülési távolság</label>
            <span className="text-xl font-bold text-blue-400">{formatNum(distance)} <span className="text-sm font-normal text-blue-400/70">km</span></span>
          </div>
          <input
            type="range"
            min="100"
            max={maxRange > 0 ? maxRange : 12000}
            step="100"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* --- ÚJ: HASZNOS TEHER (CARGO) CSÚSZKA --- */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Hasznos teher (Cargo)</label>
            <span className="text-xl font-bold text-emerald-400">{sliderPayload.toFixed(1)} <span className="text-sm font-normal text-emerald-400/70">tonna</span></span>
          </div>
          <input
            type="range"
            min="0"
            max={maxPayloadTonnes}
            step="0.5"
            value={sliderPayload}
            onChange={(e) => setSliderPayload(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
            <span>0 t</span>
            <span>{maxPayloadTonnes} t (Max)</span>
          </div>
        </div>

        {/* EREDMÉNY KÁRTYÁK */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 shadow-lg">
            <p className="text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">Teljes Tankolandó</p>
            <p className="text-2xl font-bold text-white">{formatNum(fuelData.total_fuel)} <span className="text-sm font-medium text-blue-200">kg</span></p>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Becsült Idő</p>
            <p className="text-2xl font-bold text-white">{fuelData.est_time_hours.toFixed(2)} <span className="text-sm font-medium text-slate-400">óra</span></p>
            <p className="text-slate-500 text-xs mt-1">{fuelData.hours} óra {fuelData.minutes} perc</p>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Fogyasztás</p>
            <p className="text-2xl font-bold text-white">{formatNum(fuelData.current_burn_rate)} <span className="text-sm font-medium text-slate-400">kg/h</span></p>
            <p className="text-slate-500 text-xs mt-1">Aktuális terhelésnél</p>
          </div>
        </div>

        {/* KÖRDIAGRAM ÉS JELMAGYARÁZAT */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-900/50 rounded-xl p-4 border border-slate-700 gap-6">
          <div
            className="w-24 h-24 rounded-full flex shrink-0 items-center justify-center shadow-xl shadow-black/20"
            style={{ background: conicGradient }}
          >
            <div className="w-16 h-16 bg-[#0f172a] rounded-full flex items-center justify-center">
               <span className="text-slate-400 text-xs font-medium">{Math.round(pctTrip)}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs text-slate-300 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Út (Trip)</span></div>
              <span className="font-mono">{formatNum(fuelData.trip_fuel)} kg</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span>Eseti (5%)</span></div>
              <span className="font-mono">{formatNum(fuelData.contingency_fuel)} kg</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span>Tartalék</span></div>
              <span className="font-mono">{formatNum(fuelData.reserve_fuel)} kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}