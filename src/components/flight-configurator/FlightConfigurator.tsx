import { useState } from 'react';
import WeightBalancePanel from './WeightBalancePanel.tsx';
import FuelCalculator from './FuelCalculator.tsx';
import AircraftSelector from './AircraftSelector.tsx';
import ManualBoxForm from './ManualBoxForm.tsx';
import Packing3DView from './Packing3DView.tsx';
import CargoItemList from './CargoItemList.tsx';

import { useAircrafts } from '../../hooks/useAircrafts.ts';
import { useCargoPacking } from '../../hooks/useCargoPacking.ts';

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
  } = useCargoPacking();

  const [boxCount, setBoxCount] = useState<number>(40);

  // Szerepkör rugalmas ellenőrzése
  const rawRole = localStorage.getItem('role') || 'viewer';
  const userRole = rawRole.toLowerCase();
  const isAgentOrAdmin = userRole.includes('admin') || userRole.includes('agent');

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
              handleClearBoxes();
            }}
            onSelectContainer={(id) => {
              setSelectedContainerId(id);
              handleClearBoxes();
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