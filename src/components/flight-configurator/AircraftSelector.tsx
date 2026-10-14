import type { Aircraft, ULDContainer } from '../../hooks/useAircrafts';

interface AircraftSelectorProps {
  aircrafts: Aircraft[];
  selectedAircraft: string;
  selectedContainerId: string;
  selectedAircraftData?: Aircraft;
  selectedULD?: ULDContainer;
  loading: boolean;
  onSelectAircraft: (id: string) => void;
  onSelectContainer: (id: string) => void;
}

export default function AircraftSelector({
  aircrafts,
  selectedAircraft,
  selectedContainerId,
  selectedAircraftData,
  selectedULD,
  loading,
  onSelectAircraft,
  onSelectContainer,
}: AircraftSelectorProps) {
  return (
    <>
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <label className="block text-slate-400 font-semibold mb-3 uppercase tracking-wider text-sm">
          Repülők neve
        </label>
        <select
          className="w-full bg-slate-900 border border-slate-600 text-white text-lg p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          value={selectedAircraft}
          onChange={(e) => onSelectAircraft(e.target.value)}
          disabled={loading}
        >
          <option value="">{loading ? "Adatok betöltése..." : "-- Kérlek válassz egy gépet --"}</option>
          {aircrafts.map((ac) => <option key={ac.id} value={ac.id}>{ac.name}</option>)}
        </select>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
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
                    onChange={(e) => onSelectContainer(e.target.value)}
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
          <div className="flex items-center justify-center h-48 pb-10">
            <p className="text-slate-500 text-center">Kérlek válassz egy repülőgépet a listából,<br/> hogy megtekinthesd a részleteit.</p>
          </div>
        )}
      </div>
    </>
  );
}