const BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const apiService = {
  getAircrafts: async () => {
    const res = await fetch(`${BASE_URL}/aircrafts`);
    if (!res.ok) throw new Error('Hiba a repülők lekérésekor');
    return res.json();
  },

  optimizePacking: async (containerData: any, items: any[]) => {
    const res = await fetch(`${BASE_URL}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ container: containerData, items }),
    });
    if (!res.ok) throw new Error('Hiba az optimalizálás során');
    return res.json();
  },

  getPendingOrders: async () => {
    const response = await fetch(`${BASE_URL}/orders`);
    if (!response.ok) throw new Error('Hiba a rendelések lekérésekor');
    return response.json();
  },

  saveOrder: async (customerName: string, distanceKm: number, items: any[]) => {
    const response = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customerName,
        distance_km: distanceKm,
        items: items
      }),
    });
    if (!response.ok) throw new Error('Hiba a rendelés mentésekor');
    return response.json();
  },
  approveOrder: async (orderId: number, aircraftTypeId: string) => {
    const response = await fetch(`${BASE_URL}/orders/${orderId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aircraft_type_id: aircraftTypeId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Hiba a jóváhagyás során');
    }
    return response.json();
  },
  getInTransitFleet: async () => {
    const response = await fetch(`${BASE_URL}/fleet/intransit`);
    if (!response.ok) throw new Error('Hiba az úton lévő gépek lekérésekor');
    return response.json();
  },

  arriveFleet: async (fleetId: number) => {
    const response = await fetch(`${BASE_URL}/fleet/${fleetId}/arrive`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Hiba a gép megérkeztetésekor');
    return response.json();
  },
};
