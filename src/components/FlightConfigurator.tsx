import { useState, useEffect } from 'react';

interface ULDContainer {
  id?: string | number;
  name?: string;
  [key: string]: unknown; // Ha jönne más adat is, ne dobjon hibát
}

interface Aircraft {
  id: string;
  name: string;
  max_cargo_weight?: number;
  body_type?: string;
  max_range_km?: number; // (Használd azt a nevet, amire az előbb átírtad!)
  compatible_containers?: ULDContainer[];
}

export default function FlightConfigurator() {
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");
  const [selectedContainerId, setSelectedContainerId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAircrafts = async () => {
      try {
        // FIGYELEM: Ide írd vissza azt a végpontot, amit az előbb sikeresen megtaláltál!
        const response = await fetch('http://localhost:8000/api/v1/aircrafts');

        if (response.ok) {
          const data = await response.json();
          setAircrafts(data);
        } else {
          console.error("Hiba történt a szerver válaszában");
        }
      } catch (error) {
        console.error("Nem sikerült csatlakozni a backendhez.", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchAircrafts();
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 lg:p-8 text-slate-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ================= BAL OSZLOP ================= */}
        <div className="flex flex-col gap-6">

          {/* 1. Doboz: Repülők neve */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <label className="block text-slate-400 font-semibold mb-3 uppercase tracking-wider text-sm">
              Repülők neve
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-600 text-white text-lg p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              value={selectedAircraft}
              onChange={(e) => {
                setSelectedAircraft(e.target.value);
                setSelectedContainerId(""); // Ezt a sort adtuk hozzá!
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

          {/* 2. Doboz: Repülőgépek adatai */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl min-h-[400px]">
            <h2 className="text-slate-400 font-semibold uppercase tracking-wider text-sm mb-4">Repülőgépek adatai</h2>

            {selectedAircraft ? (
              <div className="space-y-4">
                {(() => {
                  const data = aircrafts.find(ac => ac.id === selectedAircraft);
                  if (!data) return null;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Típus - Teljes szélesség (2 oszlopot foglal) */}
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 md:col-span-2">
                        <p className="text-sm text-slate-400 mb-1">Típus</p>
                        <p className="text-xl font-bold text-white">{data.name}</p>
                      </div>

                      {/* Teherbírás */}
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                        <p className="text-sm text-slate-400 mb-1">Maximális teherbírás</p>
                        <p className="text-xl font-bold text-blue-400">
                          {data.max_cargo_weight ? `${data.max_cargo_weight.toLocaleString()} kg` : 'Nincs adat'}
                        </p>
                      </div>

                      {/* Hatótáv */}
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                        <p className="text-sm text-slate-400 mb-1">Max. távolság</p>
                        <p className="text-xl font-bold text-blue-400">
                          {data.max_range_km ? `${data.max_range_km.toLocaleString()} km` : 'Nincs adat'}
                        </p>
                      </div>

                      {/* Body Type */}
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                        <p className="text-sm text-slate-400 mb-1">Body Type</p>
                        <p className="text-lg font-semibold text-white">
                          {data.body_type ? data.body_type : 'Nincs adat'}
                        </p>
                      </div>

                      {/* Kompatibilis ULD-k - Lenyitható lista (Két oszlopot foglal) */}
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 md:col-span-2">
                        <p className="text-sm text-slate-400 mb-2">Kompatibilis ULD-k</p>

                        {data.compatible_containers && data.compatible_containers.length > 0 ? (
                          <select
                            className="w-full bg-slate-800 border border-slate-600 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer mb-4"
                            value={selectedContainerId}
                            onChange={(e) => setSelectedContainerId(e.target.value)}
                          >
                            <option value="">-- Válassz egy ULD konténert a részletekhez --</option>
                            {data.compatible_containers.map((container: ULDContainer) => (
                              <option key={String(container.id)} value={String(container.id)}>
                                {container.name || container.id}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-lg font-semibold text-slate-500">Nincs kompatibilis ULD</p>
                        )}

                        {/* Kiválasztott ULD Paraméterei */}
                        {selectedContainerId && (() => {
                          const selectedULD = data.compatible_containers.find(c => String(c.id) === selectedContainerId);
                          if (!selectedULD) return null;

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-900/20 rounded-xl border border-blue-800/50">

                              {/* 1. Paraméter */}
                              <div>
                                <p className="text-xs text-blue-300/70 uppercase tracking-wider mb-1">Max bruttó súly</p>
                                <p className="text-lg font-semibold text-blue-200">
                                  {selectedULD.max_gross_weight ? `${selectedULD.max_gross_weight} kg` : 'Nincs adat'}
                                </p>
                              </div>

                              {/* 2. Paraméter */}
                              <div>
                                <p className="text-xs text-blue-300/70 uppercase tracking-wider mb-1">Önsúly (Tare)</p>
                                <p className="text-lg font-semibold text-blue-200">
                                  {selectedULD.tare_weight ? `${selectedULD.tare_weight} kg` : 'Nincs adat'}
                                </p>
                              </div>

                              {/* 3. Paraméter */}
                              <div>
                                <p className="text-xs text-blue-300/70 uppercase tracking-wider mb-1">Térfogat</p>
                                <p className="text-lg font-semibold text-blue-200">
                                  {selectedULD.volume ? `${selectedULD.volume} m³` : 'Nincs adat'}
                                </p>
                              </div>

                            </div>
                          );
                        })()}
                      </div>

                      {/* Ideiglenes helyőrző a 3D rajzhoz */}
                      <div className="mt-2 md:col-span-2 border-t border-slate-700 pt-4">
                        <p className="text-slate-500 italic">Itt fognak megjelenni a géphez tartozó ULD konténer pozíciók...</p>
                      </div>

                    </div>
                  );
                })()}
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

          {/* 3. Doboz: Telítettség és Súlypont */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h2 className="text-slate-400 font-semibold uppercase tracking-wider text-sm mb-4">Telítettség és Súlypont</h2>
            <p className="text-slate-500">Itt lesznek a százalékok és a CG státusz...</p>
          </div>

          {/* 4. Doboz: 3D Animáció */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl min-h-[500px] flex items-center justify-center">
            <h2 className="text-slate-500 font-medium text-lg">Ide jön a Three.js 3D nézet</h2>
          </div>
        </div>

      </div>
    </div>
  );
}