import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService.ts';

interface CargoItem {
  id: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
  can_rotate: boolean;
  type?: string;
}

export default function CustomerPortal() {
  const [customerName, setCustomerName] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(1000);
  const [items, setItems] = useState<CargoItem[]>([]);

  const [manualBox, setManualBox] = useState({ w: 50, h: 50, d: 50, weight: 15, count: 1 });
  const [status, setStatus] = useState({ loading: false, success: false, error: '' });

  useEffect(() => {
    // Kiolvassuk a bejelentkezett felhasználó nevét
    const name = localStorage.getItem('username') || 'Vendég Ügyfél';
    setCustomerName(name);
  }, []);

  const handleAddBox = () => {
    const baseId = Date.now().toString().slice(-5);
    const newBoxes: CargoItem[] = Array.from({ length: manualBox.count || 1 }, (_, i) => ({
      id: `CUST-${baseId}-${i}`,
      width: manualBox.w,
      height: manualBox.h,
      depth: manualBox.d,
      weight: manualBox.weight,
      can_rotate: true,
      type: 'Egyedi'
    }));
    setItems([...items, ...newBoxes]);
  };

  const handleRemoveBox = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      setStatus({ loading: false, success: false, error: 'Kérjük, adjon hozzá legalább egy csomagot!' });
      return;
    }

    setStatus({ loading: true, success: false, error: '' });
    try {
      await apiService.saveOrder(customerName, distanceKm, items);
      setStatus({ loading: false, success: true, error: '' });
      setItems([]); // Sikeres mentés után kiürítjük a kosarat

      // 3 másodperc múlva eltüntetjük a zöld sikeres üzenetet
      setTimeout(() => setStatus(s => ({ ...s, success: false })), 3000);
    } catch (err) {
      setStatus({ loading: false, success: false, error: 'Hiba történt a rendelés leadásakor.' });
    }
  };

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  return (
    <div className="w-full max-w-[1000px] mx-auto p-4 lg:p-8 text-slate-200">

      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Új Szállítmány Megrendelése</h2>
        <p className="text-slate-400 mb-8">Kérjük, adja meg a szállítási távolságot és a feladni kívánt csomagok paramétereit. A rendszerünk automatikusan kiszámítja a legoptimálisabb szállítást.</p>

        {/* Űrlap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm text-slate-400 mb-2 uppercase tracking-wider font-semibold">Becsült Távolság (km)</label>
            <input
              type="number"
              value={distanceKm}
              onChange={e => setDistanceKm(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Csomag hozzáadása */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 mb-8">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Csomagok Hozzáadása</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Szélesség (cm)</label>
              <input type="number" value={manualBox.w} onChange={e => setManualBox({...manualBox, w: Number(e.target.value)})} className="w-20 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-center" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Magasság (cm)</label>
              <input type="number" value={manualBox.h} onChange={e => setManualBox({...manualBox, h: Number(e.target.value)})} className="w-20 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-center" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Mélység (cm)</label>
              <input type="number" value={manualBox.d} onChange={e => setManualBox({...manualBox, d: Number(e.target.value)})} className="w-20 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-center" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Súly (kg)</label>
              <input type="number" value={manualBox.weight} onChange={e => setManualBox({...manualBox, weight: Number(e.target.value)})} className="w-20 bg-slate-800 border border-emerald-600/50 rounded px-3 py-2 text-emerald-400 font-bold text-center" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Darabszám</label>
              <input type="number" min="1" max="100" value={manualBox.count} onChange={e => setManualBox({...manualBox, count: Number(e.target.value)})} className="w-20 bg-slate-800 border border-blue-600/50 rounded px-3 py-2 text-blue-400 font-bold text-center" />
            </div>
            <button onClick={handleAddBox} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition-colors ml-auto">
              + Kosárba
            </button>
          </div>
        </div>

        {/* Csomagok listája (Kosár) */}
        {items.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Feladandó Csomagok ({items.length} db)</h3>
              <span className="text-emerald-400 font-bold">Összsúly: {totalWeight} kg</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {items.map(item => (
                <div key={item.id} className="bg-slate-900 border border-slate-700 p-3 rounded-lg relative group">
                  <button onClick={() => handleRemoveBox(item.id)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">✕</button>
                  <p className="text-xs text-slate-500 font-mono mb-1">{item.id.split('-').slice(0, 2).join('-')}</p>
                  <p className="font-semibold text-white">{item.width}x{item.height}x{item.depth} cm</p>
                  <p className="text-emerald-400 font-bold text-sm mt-1">{item.weight} kg</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Küldés és Státusz */}
        <div className="flex items-center justify-between border-t border-slate-700 pt-6">
          <div className="text-sm font-semibold">
            {status.error && <span className="text-red-400">❌ {status.error}</span>}
            {status.success && <span className="text-emerald-400">✅ Rendelés sikeresen rögzítve az adatbázisban! A Cargo Agent hamarosan feldolgozza.</span>}
          </div>
          <button
            onClick={handleSubmit}
            disabled={status.loading || items.length === 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all"
          >
            {status.loading ? 'Küldés...' : 'Rendelés Leadása'}
          </button>
        </div>

      </div>
    </div>
  );
}