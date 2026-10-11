import { useState, useEffect } from 'react';
import WeightBalancePanel from './WeightBalancePanel';
import Scene from './Scene';

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

  // A bepakolt csomagok memóriája
  const [packedItems, setPackedItems] = useState<PlacedItem[]>([]);

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

  // --- GLOBÁLIS VÁLTOZÓK ---
  const selectedAircraftData = aircrafts.find(ac => ac.id === selectedAircraft);
  const selectedULD = selectedAircraftData?.compatible_containers?.find(
    c => String(c.id) === selectedContainerId
  );

  // Valós API hívás a Python Bin Packing Backendhez
  // Valós API hívás a Python Bin Packing Backendhez (Szabványosított dobozokkal)
  const handleGenerateBoxes = async () => {
    if (!selectedULD || !selectedULD.width) return;

    setLoading(true);

    // 1. Szabványos futárszolgálati dobozméretek (DPD, DHL, GLS minta alapján)
    const STANDARD_BOXES = [
      { type: 'S',  w: 30, h: 20, d: 15, maxWeight: 5 },   // Kisebb elektronika, könyvek
      { type: 'M',  w: 40, h: 30, d: 20, maxWeight: 10 },  // Cipősdoboz méret, ruhák
      { type: 'L',  w: 60, h: 40, d: 30, maxWeight: 20 },  // Normál csomag (pl. mikrohullámú sütő doboza)
      { type: 'XL', w: 80, h: 60, d: 40, maxWeight: 31 }   // Nemzetközi futár limit (31.5kg)
    ];

    // 2. Generálunk egy adag szabványos dobozt
    const rawItems = [];
    for (let i = 0; i < boxCount; i++) {
      // Véletlenszerűen kiválasztunk egyet a 4 szabványos méret közül
      const randomBoxTemplate = STANDARD_BOXES[Math.floor(Math.random() * STANDARD_BOXES.length)];

      // A súly 1 kg és a doboz maximális teherbírása között lesz véletlenszerűen
      const randomWeight = Math.floor(1 + Math.random() * randomBoxTemplate.maxWeight);

      rawItems.push({
        id: `BOX-${randomBoxTemplate.type}-${i}`, // Pl. BOX-M-12 (Így látod majd a méretet az ID-ban is)
        width: randomBoxTemplate.w,
        height: randomBoxTemplate.h,
        depth: randomBoxTemplate.d,
        weight: randomWeight,
        can_rotate: true
      });
    }

    try {
      // 3. Kérés küldése a FastAPI /optimize végpontodra
      const response = await fetch('http://localhost:8000/api/v1/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          items: rawItems
        })
      });

      if (response.ok) {
        // 4. A backend visszaadja az OptimizeResponse-t!
        const packedData = await response.json();

        if (packedData.placed_items) {
           // Kirajzoljuk a hézagmentes dobozokat a 3D nézetben
           setPackedItems(packedData.placed_items);
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

  // Aktuális súly és térfogat kiszámítása
  const currentTotalWeight = packedItems.reduce((sum, pi) => sum + (pi.item?.weight || pi.weight || 0), 0);
  const currentTotalVolume = packedItems.reduce((sum, pi) => sum + (pi.w * pi.h * pi.d) / 1_000_000, 0);

  // CoG / Telítettség állapot
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
                setPackedItems([]); // Töröljük a dobozokat gépváltáskor
              }}
              disabled={loading}
            >
              <option value="">
                {loading ? "Adatok betöltése..." : "-- Kérlek válassz egy gépet --"}
              </option>
              {aircrafts.map((ac) => (
                <option key={ac.id} value={ac.id}>{ac.name}</option>
              ))}
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

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Body Type</p>
                    <p className="text-lg font-semibold text-white">
                      {selectedAircraftData.body_type ? selectedAircraftData.body_type : 'Nincs adat'}
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
                          <p className="text-lg font-semibold text-blue-200">
                            {selectedULD.max_gross_weight ? `${selectedULD.max_gross_weight} kg` : 'Nincs adat'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-300/70 uppercase tracking-wider mb-1">Önsúly (Tare)</p>
                          <p className="text-lg font-semibold text-blue-200">
                            {selectedULD.tare_weight ? `${selectedULD.tare_weight} kg` : 'Nincs adat'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-300/70 uppercase tracking-wider mb-1">Térfogat</p>
                          <p className="text-lg font-semibold text-blue-200">
                            {selectedULD.volume ? `${selectedULD.volume} m³` : 'Nincs adat'}
                          </p>
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

          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl flex flex-col overflow-hidden">

             <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">3D Bin Packing Nézet</h3>
                {selectedULD && selectedULD.width && (
                  <div className="flex items-center gap-3">
                    <label className="text-slate-400 text-sm font-medium">Mennyiség:</label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={boxCount}
                      onChange={(e) => setBoxCount(Number(e.target.value))}
                      className="w-20 bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-center font-mono"
                    />
                    <button
                      onClick={handleGenerateBoxes}
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-slate-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/20"
                    >
                      {loading ? "Feldolgozás..." : "Generálás"}
                    </button>
                  </div>
                )}
             </div>

             {selectedULD && selectedULD.width ? (
                <div className="w-full min-h-[500px]">
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

        </div>

      </div>
    </div>
  );
}