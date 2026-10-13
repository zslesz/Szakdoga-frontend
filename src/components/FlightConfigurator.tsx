import { useState, useEffect } from 'react';
import WeightBalancePanel from './WeightBalancePanel';
import Scene from './Scene';
import FuelCalculator from './FuelCalculator';

// 1. Típusok definiálása
interface ULDContainer {
  id: string | number;
  name?: string;
  max_gross_weight?: number;
  tare_weight?: number;
  volume?: number;
  width?: number;
  height?: number;
  depth?: number;
  base_width?: number | null;
  contour_height?: number;
  cog_target_x?: number;
  cog_target_y?: number;
  cog_target_z?: number;
}

interface Aircraft {
  id: string;
  name: string;
  max_cargo_weight?: number;
  body_type?: string;
  max_range_km?: number;
  compatible_containers?: ULDContainer[];
}

// Új: Kézzel felvitt / Generált doboz típusa
interface CargoItem {
  id: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
  can_rotate: boolean;
  type?: string;
  is_placed?: boolean; // Pakolás után beállítjuk
}

interface PlacedItem {
  item: {
    id: string;
    weight?: number;
  };
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  weight?: number;
}

export default function FlightConfigurator() {
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");
  const [selectedContainerId, setSelectedContainerId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [boxCount, setBoxCount] = useState<number>(40);

  // --- Rakomány lista (kézi + generált) ---
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [packedItems, setPackedItems] = useState<PlacedItem[]>([]);
  const [unpackedItemsCount, setUnpackedItemsCount] = useState<number>(0);

  // --- Kézi doboz hozzáadás form state (KIBŐVÍTVE A DARABSZÁMMAL) ---
  const [manualBox, setManualBox] = useState({
    w: 50, h: 50, d: 50, weight: 15, count: 1
  });

  useEffect(() => {
    const fetchAircrafts = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/aircrafts');
        if (response.ok) {
          const data = await response.json();
          setAircrafts(data);
        } else {
          console.error("Hiba a szerver válaszában");
        }
      } catch (error) {
        console.error("Nem sikerült csatlakozni a backendhez.", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchAircrafts();
  }, []);

  const selectedAircraftData = aircrafts.find(ac => ac.id === selectedAircraft);
  const selectedULD = selectedAircraftData?.compatible_containers?.find(
    c => String(c.id) === selectedContainerId
  );

  // --- Manuális doboz(ok) hozzáadása a listához ---
  const handleAddManualBox = () => {
    const newBoxes: CargoItem[] = [];
    const baseId = Date.now().toString().slice(-5);

    // Ciklus, ami annyiszor fut le, amennyit a Darab mezőbe írtak
    for (let i = 0; i < (manualBox.count || 1); i++) {
      newBoxes.push({
        id: `MANUAL-${baseId}-${i}`, // Egyedi ID minden doboznak
        width: manualBox.w,
        height: manualBox.h,
        depth: manualBox.d,
        weight: manualBox.weight,
        can_rotate: true,
        type: 'Egyedi'
      });
    }

    setCargoItems([...cargoItems, ...newBoxes]);
    setPackedItems([]);
    setUnpackedItemsCount(0);
  };

  // --- Csak generálja a dobozokat, és beteszi a listába ---
  const handleGenerateBoxes = () => {
    const STANDARD_BOXES = [
      { type: 'S',  w: 30, h: 20, d: 15, maxWeight: 5 },
      { type: 'M',  w: 40, h: 30, d: 20, maxWeight: 10 },
      { type: 'L',  w: 60, h: 40, d: 30, maxWeight: 20 },
      { type: 'XL', w: 80, h: 60, d: 40, maxWeight: 31 }
    ];

    const newGeneratedItems: CargoItem[] = [];
    const baseId = Date.now().toString().slice(-4);

    for (let i = 0; i < boxCount; i++) {
      const randomBoxTemplate = STANDARD_BOXES[Math.floor(Math.random() * STANDARD_BOXES.length)];
      const randomWeight = Math.floor(1 + Math.random() * randomBoxTemplate.maxWeight);

      newGeneratedItems.push({
        id: `BOX-${randomBoxTemplate.type}-${baseId}-${i}`,
        width: randomBoxTemplate.w,
        height: randomBoxTemplate.h,
        depth: randomBoxTemplate.d,
        weight: randomWeight,
        can_rotate: true,
        type: randomBoxTemplate.type
      });
    }

    setCargoItems([...cargoItems, ...newGeneratedItems]);
    setPackedItems([]);
    setUnpackedItemsCount(0);
  };

  const handleClearBoxes = () => {
    setCargoItems([]);
    setPackedItems([]);
    setUnpackedItemsCount(0);
  };

  // --- Optimalizálás (API hívás) a teljes cargoItems listával ---
  const handleOptimizePacking = async () => {
    if (!selectedULD || !selectedULD.width || cargoItems.length === 0) return;

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          container: {
            id: String(selectedULD.id),
            name: selectedULD.name || "",
            width: selectedULD.width,
            height: selectedULD.height,
            depth: selectedULD.depth,
            base_width: selectedULD.base_width || null,
            contour_height: selectedULD.contour_height || 0,
            max_volume: selectedULD.volume || 0,
            max_weight: selectedULD.max_gross_weight || 0,
            cog_target_x: selectedULD.cog_target_x || (selectedULD.width ? selectedULD.width / 2 : 0),
            cog_target_y: selectedULD.cog_target_y || (selectedULD.height ? selectedULD.height / 2 : 0),
            cog_target_z: selectedULD.cog_target_z || (selectedULD.depth ? selectedULD.depth / 2 : 0)
          },
          items: cargoItems
        })
      });

      if (response.ok) {
        const packedData = await response.json();

        if (packedData.placed_items) {
           setPackedItems(packedData.placed_items);

           const placedCount = packedData.placed_items.length;
           setUnpackedItemsCount(cargoItems.length - placedCount);

           const placedIds = new Set(packedData.placed_items.map((pi: any) => pi.item.id));
           setCargoItems(cargoItems.map(c => ({...c, is_placed: placedIds.has(c.id)})));
        }
      } else {
        console.error("Hiba történt az optimalizálás során", response.status);
      }
    } catch (error) {
      console.error("Nem sikerült elérni a pakoló API-t", error);
    } finally {
      setLoading(false);
    }
  };

  const currentTotalWeight = packedItems.reduce((sum, pi) => sum + (pi.item?.weight || pi.weight || 0), 0);
  const currentTotalVolume = packedItems.reduce((sum, pi) => sum + (pi.w * pi.h * pi.d) / 1_000_000, 0);

  const maxW = selectedULD?.max_gross_weight || 1;
  const isDanger = currentTotalWeight > maxW;
  const cogStatus = isDanger ? 'DANGER' : (currentTotalWeight > 0 ? 'OK' : 'UNKNOWN');

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 lg:p-8 text-slate-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ================= BAL OSZLOP ================= */}
        <div className="flex flex-col gap-6">

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <label className="block text-slate-400 font-semibold mb-3 uppercase tracking-wider text-sm">
              Repülők neve
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-600 text-white text-lg p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              value={selectedAircraft}
              onChange={(e) => {
                setSelectedAircraft(e.target.value);
                setSelectedContainerId("");
                setCargoItems([]);
                setPackedItems([]);
              }}
              disabled={loading}
            >
              <option value="">{loading ? "Adatok betöltése..." : "-- Kérlek válassz egy gépet --"}</option>
              {aircrafts.map((ac) => <option key={ac.id} value={ac.id}>{ac.name}</option>)}
            </select>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl min-h-[400px]">
            <h2 className="text-slate-400 font-semibold uppercase tracking-wider text-sm mb-4">Repülőgépek adatai</h2>

            {selectedAircraftData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 md:col-span-2">
                    <p className="text-sm text-slate-400 mb-1">Típus</p>
                    <p className="text-xl font-bold text-white">{selectedAircraftData.name}</p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Maximális teherbírás</p>
                    <p className="text-xl font-bold text-blue-400">
                      {selectedAircraftData.max_cargo_weight ? `${selectedAircraftData.max_cargo_weight.toLocaleString()} kg` : 'Nincs adat'}
                    </p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Max. távolság</p>
                    <p className="text-xl font-bold text-blue-400">
                      {selectedAircraftData.max_range_km ? `${selectedAircraftData.max_range_km.toLocaleString()} km` : 'Nincs adat'}
                    </p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 md:col-span-2">
                    <p className="text-sm text-slate-400 mb-2">Kompatibilis ULD-k</p>
                    {selectedAircraftData.compatible_containers && selectedAircraftData.compatible_containers.length > 0 ? (
                      <select
                        className="w-full bg-slate-800 border border-slate-600 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer mb-4"
                        value={selectedContainerId}
                        onChange={(e) => {
                          setSelectedContainerId(e.target.value);
                          setPackedItems([]);
                        }}
                      >
                        <option value="">-- Válassz egy ULD konténert a részletekhez --</option>
                        {selectedAircraftData.compatible_containers.map((container: ULDContainer) => (
                          <option key={String(container.id)} value={String(container.id)}>
                            {container.name || container.id}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-lg font-semibold text-slate-500">Nincs kompatibilis ULD</p>
                    )}

                    {selectedULD && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-900/20 rounded-xl border border-blue-800/50 mt-4">
                        <div>
                          <p className="text-xs text-blue-300/70 uppercase tracking-wider mb-1">Max bruttó súly</p>
                          <p className="text-lg font-semibold text-blue-200">{selectedULD.max_gross_weight} kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-300/70 uppercase tracking-wider mb-1">Önsúly (Tare)</p>
                          <p className="text-lg font-semibold text-blue-200">{selectedULD.tare_weight} kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-300/70 uppercase tracking-wider mb-1">Térfogat</p>
                          <p className="text-lg font-semibold text-blue-200">{selectedULD.volume} m³</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full pb-10">
                <p className="text-slate-500 text-center">Kérlek válassz egy repülőgépet a listából,<br/> hogy megtekinthesd a részleteit.</p>
              </div>
            )}

            {selectedAircraftData && (
              <FuelCalculator
                aircraftId={selectedAircraftData.id}
                aircraftName={selectedAircraftData.name}
                maxRange={selectedAircraftData.max_range_km}
                maxPayloadKg={selectedAircraftData.max_cargo_weight}
                currentPayloadKg={currentTotalWeight}
              />
            )}
          </div>
        </div>

        {/* ================= JOBB OSZLOP ================= */}
        <div className="flex flex-col gap-6">

          <WeightBalancePanel
            maxWeight={selectedULD?.max_gross_weight || 0}
            maxVolume={selectedULD?.volume || 0}
            currentWeight={currentTotalWeight}
            currentVolume={currentTotalVolume}
            cogStatus={cogStatus}
          />

          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl flex flex-col overflow-hidden relative">

             {/* 3D NÉZET FEJLÉC ÉS IRÁNYÍTÁS */}
             <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex flex-col xl:flex-row justify-between items-center gap-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">3D Bin Packing Nézet</h3>

                {selectedULD && selectedULD.width && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-700">
                       <input
                          type="number" min="1" max="200" value={boxCount}
                          onChange={(e) => setBoxCount(Number(e.target.value))}
                          className="w-16 bg-slate-800 border border-slate-600 text-white px-2 py-1 rounded outline-none text-center font-mono text-sm"
                        />
                        <button
                          onClick={handleGenerateBoxes}
                          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          + Auto
                        </button>
                    </div>

                    <button
                      onClick={handleOptimizePacking}
                      disabled={loading || cargoItems.length === 0}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-slate-400 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-900/20 ml-auto"
                    >
                      {loading ? "Feldolgozás..." : "Optimalizálás (Pakolás)"}
                    </button>
                  </div>
                )}
             </div>

             {/* MANUÁLIS HOZZÁADÁS SÁV (BŐVÍTVE) */}
             {selectedULD && (
               <div className="bg-slate-800 p-3 border-b border-slate-700 flex flex-wrap gap-3 items-end text-sm">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Szélesség (cm)</label>
                    <input type="number" value={manualBox.w} onChange={e => setManualBox({...manualBox, w: Number(e.target.value)})} className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Magasság (cm)</label>
                    <input type="number" value={manualBox.h} onChange={e => setManualBox({...manualBox, h: Number(e.target.value)})} className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Mélység (cm)</label>
                    <input type="number" value={manualBox.d} onChange={e => setManualBox({...manualBox, d: Number(e.target.value)})} className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-center" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Súly (kg)</label>
                    <input type="number" value={manualBox.weight} onChange={e => setManualBox({...manualBox, weight: Number(e.target.value)})} className="w-16 bg-slate-900 border border-emerald-600/50 rounded px-2 py-1 text-emerald-400 font-bold text-center" />
                  </div>
                  {/* ÚJ DARABSZÁM MEZŐ */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Darab</label>
                    <input type="number" min="1" max="100" value={manualBox.count} onChange={e => setManualBox({...manualBox, count: Number(e.target.value)})} className="w-16 bg-slate-900 border border-blue-600/50 rounded px-2 py-1 text-blue-400 font-bold text-center" />
                  </div>
                  <button onClick={handleAddManualBox} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-medium transition-colors h-[34px]">
                    + Kézi hozzáadás
                  </button>
               </div>
             )}

             {/* 3D SCENE */}
             {selectedULD && selectedULD.width ? (
                <div className="w-full h-[500px] relative">

                  {unpackedItemsCount > 0 && (
                    <div className="absolute top-4 right-4 z-10 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl border border-red-400 shadow-lg shadow-red-900/30 flex items-center gap-2 animate-bounce">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      <span className="font-bold">{unpackedItemsCount} doboz kimaradt!</span>
                    </div>
                  )}

                  {packedItems.length > 0 && unpackedItemsCount === 0 && cargoItems.length > 0 && (
                     <div className="absolute top-4 right-4 z-10 bg-emerald-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl border border-emerald-400 shadow-lg shadow-emerald-900/30 flex items-center gap-2">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                       <span className="font-bold">Minden befért!</span>
                     </div>
                  )}

                  <Scene
                    container={{
                      id: String(selectedULD.id),
                      name: selectedULD.name || "",
                      width: selectedULD.width || 0,
                      height: selectedULD.height || 0,
                      depth: selectedULD.depth || 0,
                      base_width: selectedULD.base_width || null,
                      contour_height: selectedULD.contour_height || 0
                    }}
                    placedItems={packedItems}
                  />
                </div>
             ) : (
                <div className="w-full min-h-[500px] flex items-center justify-center">
                  <p className="text-slate-500 font-medium text-lg">
                    Válassz egy ULD konténert a 3D nézethez!
                  </p>
                </div>
             )}
          </div>

          {/* LISTA A RAKOMÁNYRÓL */}
          {cargoItems.length > 0 && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden mt-2">
              <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Rakomány Lista ({cargoItems.length} db)</h3>
                <button onClick={handleClearBoxes} className="text-red-400 hover:text-red-300 text-xs font-semibold uppercase tracking-wider transition-colors">Összes törlése</button>
              </div>
              <div className="max-h-60 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {cargoItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border text-sm flex flex-col gap-1 transition-all
                        ${packedItems.length > 0 
                            ? (item.is_placed 
                                ? 'bg-emerald-900/20 border-emerald-800/50 text-emerald-200' 
                                : 'bg-red-900/20 border-red-800/50 text-red-200 opacity-80') 
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs opacity-70">{item.id.split('-').slice(0, 2).join('-')}</span>
                        {item.type === 'Egyedi' && <span className="bg-blue-900 text-blue-200 text-[10px] px-1.5 py-0.5 rounded">Egyedi</span>}
                      </div>
                      <div className="font-semibold">{item.width} x {item.height} x {item.depth} cm</div>
                      <div className="font-bold mt-1 text-right">{item.weight} kg</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}