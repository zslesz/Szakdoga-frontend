import { useState } from 'react';
import { apiService } from '../services/apiService';

export function useCargoPacking() {
  const [cargoItems, setCargoItems] = useState<any[]>([]);
  const [packedItems, setPackedItems] = useState<any[]>([]);
  const [unpackedItemsCount, setUnpackedItemsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Kézi doboz(ok) hozzáadása
  const handleAddManualBox = (boxData: { w: number; h: number; d: number; weight: number; count: number }) => {
    const baseId = Date.now().toString().slice(-5);
    const newBoxes = Array.from({ length: boxData.count || 1 }, (_, i) => ({
      id: `MANUAL-${baseId}-${i}`,
      width: boxData.w,
      height: boxData.h,
      depth: boxData.d,
      weight: boxData.weight,
      can_rotate: true,
      type: 'Egyedi'
    }));

    setCargoItems(prev => [...prev, ...newBoxes]);
    setPackedItems([]);
    setUnpackedItemsCount(0);
  };

  // Automatikus dobozgenerálás
  const handleGenerateBoxes = (boxCount: number) => {
    const STANDARD_BOXES = [
      { type: 'S',  w: 30, h: 20, d: 15, maxWeight: 5 },
      { type: 'M',  w: 40, h: 30, d: 20, maxWeight: 10 },
      { type: 'L',  w: 60, h: 40, d: 30, maxWeight: 20 },
      { type: 'XL', w: 80, h: 60, d: 40, maxWeight: 31 }
    ];

    const newGeneratedItems: any[] = [];
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

    setCargoItems(prev => [...prev, ...newGeneratedItems]);
    setPackedItems([]);
    setUnpackedItemsCount(0);
  };

  // Rakomány kiürítése
  const handleClearBoxes = () => {
    setCargoItems([]);
    setPackedItems([]);
    setUnpackedItemsCount(0);
  };

  // 3D Optimalizálás hívás az API-ra
  const handleOptimizePacking = async (selectedULD: any) => {
    if (!selectedULD || !selectedULD.width || cargoItems.length === 0) return;

    setLoading(true);
    try {
      const containerPayload = {
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
      };

      const packedData = await apiService.optimizePacking(containerPayload, cargoItems);

      if (packedData.placed_items) {
        setPackedItems(packedData.placed_items);
        setUnpackedItemsCount(cargoItems.length - packedData.placed_items.length);

        const placedIds = new Set(packedData.placed_items.map((pi: any) => pi.item?.id || pi.id));
        setCargoItems(prev => prev.map(c => ({ ...c, is_placed: placedIds.has(c.id) })));
      }
    } catch (error) {
      console.error("Nem sikerült elérni a pakoló API-t:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    cargoItems,
    packedItems,
    unpackedItemsCount,
    loading,
    handleAddManualBox,
    handleGenerateBoxes,
    handleClearBoxes,
    handleOptimizePacking,
    setCargoItems
  };
}