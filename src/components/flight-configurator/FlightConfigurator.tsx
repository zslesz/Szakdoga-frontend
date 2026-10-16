import { useState } from 'react';
import WeightBalancePanel from './WeightBalancePanel.tsx';
import FuelCalculator from './FuelCalculator.tsx';
import AircraftSelector from './AircraftSelector.tsx';
import ManualBoxForm from './ManualBoxForm.tsx';
import Packing3DView from './Packing3DView.tsx';
import CargoItemList from './CargoItemList.tsx';
import {apiService} from "../../services/apiService.ts";

import { useAircrafts } from '../../hooks/useAircrafts.ts';
import { useCargoPacking } from '../../hooks/useCargoPacking.ts';
import PendingOrdersPanel from './PendingOrdersPanel';
import ActiveFlightsPanel from './ActiveFlightsPanel';

export default function FlightConfigurator() {
  const {
    aircrafts,
    selectedAircraft,
    selectedContainerId,
    selectedAircraftData,
    selectedULD,
    loading,
    setSelectedAircraft,
    setSelectedContainerId,
  } = useAircrafts();

  const {
    cargoItems,
    packedItems,
    unpackedItemsCount,
    loading: packingLoading,
    handleAddManualBox,
    handleGenerateBoxes,
    handleClearBoxes,
    handleOptimizePacking,
      setCargoItems
  } = useCargoPacking();

  const [boxCount, setBoxCount] = useState<number>(40);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

  // Szerepkör rugalmas ellenőrzése
  const rawRole = localStorage.getItem('role') || 'viewer';
  const userRole = rawRole.toLowerCase();
  const isAgentOrAdmin = userRole.includes('admin') || userRole.includes('agent');

  const currentTotalWeight = packedItems.reduce((sum, pi) => sum + (pi.item?.weight || pi.weight || 0), 0);
  const currentTotalVolume = packedItems.reduce((sum, pi) => sum + (pi.w * pi.h * pi.d) / 1_000_000, 0);

  const maxW = selectedULD?.max_gross_weight || 1;
  const isDanger = currentTotalWeight > maxW;
  const cogStatus = isDanger ? 'DANGER' : (currentTotalWeight > 0 ? 'OK' : 'UNKNOWN');


  // Új függvény a rendelés behúzására
  const handleImportOrder = (items: any[], orderId: number) => {
    // 1. Az Agentnek magának kell kiválasztania a gépet, így ezt nullázzuk (ha volt valami kiválasztva)
    setSelectedAircraft('');
    setSelectedContainerId('');

    // 2. Beöntjük a csomagokat a React állapotába
    setCargoItems(items);

    // 3. Megjegyezzük, hogy melyik rendelésen dolgozunk!
    setActiveOrderId(orderId);

    // Felgörgetünk a tetejére
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApproveShipment = async () => {
    if (!activeOrderId || !selectedAircraft) return;

    try {
      const result = await apiService.approveOrder(activeOrderId, selectedAircraft);
      alert(result.message); // Kiszól, hogy pl. "A HA-LQK lajstromjelű gép útnak indult."

      // Sikeres jóváhagyás után ürítjük az űrlapot
      setActiveOrderId(null);
      setCargoItems([]); // Dobozok törlése
      // (Opcionálisan itt lehetne egy window.location.reload() is a legegyszerűbb frissítéshez)
      window.location.reload();
    } catch (error: any) {
      alert("Hiba: " + error.message);
    }
  };

  return (

    <div className="w-full max-w-[1600px] mx-auto p-4 lg:p-8 text-slate-200">
      {/* CSAK ADMIN VAGY AGENT LÁTHATJA A RENDELÉSEKET */}
      {isAgentOrAdmin && (
        <>
          <PendingOrdersPanel onImportOrder={handleImportOrder} />
          <ActiveFlightsPanel /> {/* EZ AZ ÚJ SOR! */}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ================= BAL OSZLOP ================= */}
        <div className="flex flex-col gap-6">
          <AircraftSelector
            aircrafts={aircrafts}
            selectedAircraft={selectedAircraft}
            selectedContainerId={selectedContainerId}
            selectedAircraftData={selectedAircraftData}
            selectedULD={selectedULD}
            loading={loading}
            onSelectAircraft={(id) => {
              setSelectedAircraft(id);
              setSelectedContainerId('');
              if (activeOrderId === null) {
                handleClearBoxes();
              }
            }}
            onSelectContainer={(id) => {
              setSelectedContainerId(id);
              if (activeOrderId === null) {
                handleClearBoxes();
              }
            }}
          />

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
            {/* MANUÁLIS BEVITELI ŰRLAP */}
            {selectedULD && isAgentOrAdmin && (
              <ManualBoxForm onAdd={handleAddManualBox} />
            )}

            {/* CSAK AKKOR LÁTSZIK, HA RENDELÉST IMPORTÁLTUNK */}
      {activeOrderId && selectedAircraft && (
        <div className="bg-emerald-900/30 border border-emerald-500/50 p-4 rounded-xl mb-6 flex justify-between items-center shadow-lg shadow-emerald-900/20">
          <div>
            <h3 className="text-emerald-400 font-bold text-lg">Aktív rendelés feldolgozása</h3>
            <p className="text-slate-300 text-sm">Ha a pakolás sikeres, hagyd jóvá a szállítmányt!</p>
          </div>
          <button
            onClick={handleApproveShipment}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform hover:scale-105"
          >
            ✅ Szállítmány Jóváhagyása & Gép Indítása
          </button>
        </div>
      )}

            {/* 3D NÉZET ÉS PAKOLÁS VEZÉRLŐK */}
            <Packing3DView
              selectedULD={selectedULD}
              boxCount={boxCount}
              setBoxCount={setBoxCount}
              isAgentOrAdmin={isAgentOrAdmin}
              loading={packingLoading}
              cargoItemsCount={cargoItems.length}
              unpackedItemsCount={unpackedItemsCount}
              packedItems={packedItems}
              onGenerateBoxes={() => handleGenerateBoxes(boxCount)}
              onOptimize={() => handleOptimizePacking(selectedULD)}
            />
          </div>

          {/* RAKOMÁNY LISTA */}
          <CargoItemList
            cargoItems={cargoItems}
            packedItemsCount={packedItems.length}
            isAgentOrAdmin={isAgentOrAdmin}
            onClear={handleClearBoxes}
          />
        </div>

      </div>
    </div>
  );
}