import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

// Frissítettük az interfészt: most az items mellett a rendelés ID-ját is átadjuk!
interface PendingOrdersPanelProps {
  onImportOrder: (items: any[], orderId: number) => void;
}

export default function PendingOrdersPanel({ onImportOrder }: PendingOrdersPanelProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPendingOrders();
      setOrders(data);
    } catch (error) {
      console.error('Hiba a rendelések lekérésekor', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <div className="text-slate-400 p-4">Rendelések betöltése...</div>;
  if (orders.length === 0) return null;

  return (
    <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl mb-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-blue-400">📥</span> Függőben lévő rendelések ({orders.length})
        </h2>
        <button onClick={fetchOrders} className="text-sm text-slate-400 hover:text-white transition-colors">
          🔄 Frissítés
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-emerald-400">#{order.id} - {order.customer_name}</h3>
              <span className="bg-slate-800 text-xs px-2 py-1 rounded text-slate-300">{order.distance_km} km</span>
            </div>

            <p className="text-sm text-slate-400 mb-1">Csomagok: <span className="text-white font-bold">{order.items.length} db</span></p>
            {/* ÚJ: Kiírjuk az összsúlyt, hogy az Agent tudja, milyen gépet válasszon! */}
            <p className="text-sm text-slate-400 mb-4">Összsúly: <span className="text-emerald-400 font-bold">{order.total_weight} kg</span></p>

            <button
              onClick={() => onImportOrder(order.items, order.id)}
              className="mt-auto w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-900/20"
            >
              Rendelés Importálása
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}