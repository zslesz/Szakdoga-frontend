interface WeightBalanceProps {
  maxWeight?: number;
  currentWeight?: number;
  maxVolume?: number;
  currentVolume?: number;
  cogStatus?: 'UNKNOWN' | 'OK' | 'WARNING' | 'DANGER';
}

export default function WeightBalancePanel({
  maxWeight = 0,
  currentWeight = 0,
  maxVolume = 0,
  currentVolume = 0,
  cogStatus = 'UNKNOWN'
}: WeightBalanceProps) {

  // Százalékok kiszámítása (biztonságosan, nullával való osztás elkerülésével)
  const weightPercent = maxWeight > 0 ? Math.min(100, (currentWeight / maxWeight) * 100) : 0;
  const volumePercent = maxVolume > 0 ? Math.min(100, (currentVolume / maxVolume) * 100) : 0;

  // Színek meghatározása a súlypont állapotához
  const cogColors = {
    UNKNOWN: 'text-slate-500 border-slate-700 bg-slate-800',
    OK: 'text-emerald-400 border-emerald-500/50 bg-emerald-900/20',
    WARNING: 'text-amber-400 border-amber-500/50 bg-amber-900/20',
    DANGER: 'text-rose-400 border-rose-500/50 bg-rose-900/20',
  };

  const cogLabels = {
    UNKNOWN: 'Nincs adat',
    OK: 'Határértéken belül',
    WARNING: 'Kritikushoz közeli',
    DANGER: 'Határértéken kívül!',
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
      <h2 className="text-slate-400 font-semibold uppercase tracking-wider text-sm mb-6">
        Telítettség és Súlypont (CG)
      </h2>

      <div className="space-y-6">
        {/* Súly Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">Összsúly (Bruttó)</span>
            <span className="font-mono text-blue-300">
              {currentWeight.toFixed(1)} / {maxWeight} kg ({weightPercent.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-700 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${weightPercent > 90 ? 'bg-rose-500' : 'bg-blue-500'}`}
              style={{ width: `${weightPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Térfogat Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">Térfogat kihasználtság</span>
            <span className="font-mono text-blue-300">
              {currentVolume.toFixed(2)} / {maxVolume} m³ ({volumePercent.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-700 overflow-hidden">
            <div
              className="h-3 rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${volumePercent}%` }}
            ></div>
          </div>
        </div>

        {/* Súlypont (CoG) Státusz */}
        <div className="pt-4 border-t border-slate-700">
          <p className="text-slate-400 text-sm mb-3">Súlypont (Center of Gravity) Státusz</p>
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${cogColors[cogStatus]}`}>
            <div className="w-3 h-3 rounded-full bg-current animate-pulse"></div>
            <span className="font-semibold uppercase tracking-wide text-sm">
              {cogLabels[cogStatus]}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}