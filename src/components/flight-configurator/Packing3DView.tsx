import Scene from './Scene.tsx';
import type { ULDContainer } from '../../hooks/useAircrafts';

interface Packing3DViewProps {
  selectedULD?: ULDContainer;
  boxCount: number;
  setBoxCount: (count: number) => void;
  isAgentOrAdmin: boolean;
  loading: boolean;
  cargoItemsCount: number;
  unpackedItemsCount: number;
  packedItems: any[];
  onGenerateBoxes: () => void;
  onOptimize: () => void;
}

export default function Packing3DView({
  selectedULD,
  boxCount,
  setBoxCount,
  isAgentOrAdmin,
  loading,
  cargoItemsCount,
  unpackedItemsCount,
  packedItems,
  onGenerateBoxes,
  onOptimize,
}: Packing3DViewProps) {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl flex flex-col overflow-hidden relative">
      <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex flex-col xl:flex-row justify-between items-center gap-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">3D Bin Packing Nézet</h3>

        {selectedULD && selectedULD.width && (
          <>
            {isAgentOrAdmin ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-700">
                  <input
                    type="number" min="1" max="200" value={boxCount}
                    onChange={(e) => setBoxCount(Number(e.target.value))}
                    className="w-16 bg-slate-800 border border-slate-600 text-white px-2 py-1 rounded outline-none text-center font-mono text-sm"
                  />
                  <button onClick={onGenerateBoxes} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm transition-colors">
                    + Auto
                  </button>
                </div>

                <button
                  onClick={onOptimize}
                  disabled={loading || cargoItemsCount === 0}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-slate-400 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-900/20 ml-auto"
                >
                  {loading ? "Feldolgozás..." : "Optimalizálás (Pakolás)"}
                </button>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-lg text-sm font-semibold">
                Nincs jogosultsága a rakomány módosítására (Csak megfigyelő)
              </div>
            )}
          </>
        )}
      </div>

      {selectedULD && selectedULD.width ? (
        <div className="w-full h-[500px] relative">
          {unpackedItemsCount > 0 && (
            <div className="absolute top-4 right-4 z-10 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl border border-red-400 shadow-lg shadow-red-900/30 flex items-center gap-2 animate-bounce">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <span className="font-bold">{unpackedItemsCount} doboz kimaradt!</span>
            </div>
          )}

          {packedItems.length > 0 && unpackedItemsCount === 0 && cargoItemsCount > 0 && (
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
  );
}