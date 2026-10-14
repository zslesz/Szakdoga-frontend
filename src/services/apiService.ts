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
  }
};