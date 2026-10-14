import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

export interface ULDContainer {
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

export interface Aircraft {
  id: string;
  name: string;
  max_cargo_weight?: number;
  body_type?: string;
  max_range_km?: number;
  compatible_containers?: ULDContainer[];
}

export function useAircrafts() {
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<string>('');
  const [selectedContainerId, setSelectedContainerId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAircrafts = async () => {
      try {
        const data = await apiService.getAircrafts();
        setAircrafts(data);
      } catch (error) {
        console.error('Hiba a repülők lekérésekor:', error);
      } finally {
        setLoading(false);
      }
    };
    void fetchAircrafts();
  }, []);

  const selectedAircraftData = aircrafts.find((ac) => ac.id === selectedAircraft);
  const selectedULD = selectedAircraftData?.compatible_containers?.find(
    (c) => String(c.id) === selectedContainerId
  );

  return {
    aircrafts,
    selectedAircraft,
    selectedContainerId,
    selectedAircraftData,
    selectedULD,
    loading,
    setSelectedAircraft,
    setSelectedContainerId,
  };
}