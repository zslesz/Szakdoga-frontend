interface CargoItem {
  id: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
  type?: string;
  is_placed?: boolean;
}

interface CargoItemListProps {
  cargoItems: CargoItem[];
  packedItemsCount: number;
  isAgentOrAdmin: boolean;
  onClear: () => void;
}

export default function CargoItemList({
  cargoItems,
  packedItemsCount,
  isAgentOrAdmin,
  onClear,
}: CargoItemListProps) {
  if (cargoItems.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden mt-2">
      <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Rakomány Lista ({cargoItems.length} db)
        </h3>

        {isAgentOrAdmin && (
          <button onClick={onClear} className="text-red-400 hover:text-red-300 text-xs font-semibold uppercase tracking-wider transition-colors">
            Összes törlése
          </button>
        )}
      </div>
      <div className="max-h-60 overflow-y-auto p-4 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {cargoItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border text-sm flex flex-col gap-1 transition-all
                ${packedItemsCount > 0 
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
  );
}