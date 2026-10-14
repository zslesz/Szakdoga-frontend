import { useState } from 'react';

interface ManualBoxFormProps {
  onAdd: (box: { w: number; h: number; d: number; weight: number; count: number }) => void;
}

export default function ManualBoxForm({ onAdd }: ManualBoxFormProps) {
  const [form, setForm] = useState({ w: 50, h: 50, d: 50, weight: 15, count: 1 });

  return (
    <div className="bg-slate-800 p-3 border-b border-slate-700 flex flex-wrap gap-3 items-end text-sm">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Szélesség (cm)</label>
        <input type="number" value={form.w} onChange={e => setForm({ ...form, w: Number(e.target.value) })} className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-center" />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Magasság (cm)</label>
        <input type="number" value={form.h} onChange={e => setForm({ ...form, h: Number(e.target.value) })} className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-center" />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Mélység (cm)</label>
        <input type="number" value={form.d} onChange={e => setForm({ ...form, d: Number(e.target.value) })} className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-center" />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Súly (kg)</label>
        <input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} className="w-16 bg-slate-900 border border-emerald-600/50 rounded px-2 py-1 text-emerald-400 font-bold text-center" />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Darab</label>
        <input type="number" min="1" max="100" value={form.count} onChange={e => setForm({ ...form, count: Number(e.target.value) })} className="w-16 bg-slate-900 border border-blue-600/50 rounded px-2 py-1 text-blue-400 font-bold text-center" />
      </div>
      <button onClick={() => onAdd(form)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-medium transition-colors h-[34px]">
        + Kézi hozzáadás
      </button>
    </div>
  );
}