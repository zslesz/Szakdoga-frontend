import { useState, useEffect } from 'react'
import './App.css'
import Scene from './Scene'

interface Item {
  id: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
  can_rotate: boolean;
}

interface Container {
  id: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  max_weight: number;
  base_width: number | null;
  contour_height: number;
  cog_target_x: number;
  cog_target_y: number;
  cog_target_z: number;
  cog_tolerance_x: number;
  cog_tolerance_y: number;
  cog_tolerance_z: number;
}

interface PlacedItem {
  item: Item;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

interface OptimizeResponse {
  placed_items: PlacedItem[];
  unpacked_items: Item[];
  utilization_pct: number;
  cog_metrics: any;
  is_cog_valid: boolean;
}

function App() {
  const [result, setResult] = useState<OptimizeResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const [dbContainers, setDbContainers] = useState<Container[]>([])
  const [selectedContainerId, setSelectedContainerId] = useState<string>("")

  const [isPackingListOpen, setIsPackingListOpen] = useState(false);
  const [isPlacedListOpen, setIsPlacedListOpen] = useState(false);

  // Dinamikus doboz lista állapot (3 alap dobozzal indulunk)
  const [items, setItems] = useState<Item[]>([
    { id: "BOX-001", width: 50.0, height: 40.0, depth: 30.0, weight: 25.0, can_rotate: true },
    { id: "BOX-002", width: 60.0, height: 50.0, depth: 40.0, weight: 35.0, can_rotate: true },
    { id: "BOX-003", width: 80.0, height: 45.0, depth: 45.0, weight: 60.0, can_rotate: true }
  ])

  // Új doboz űrlap állapotai
  const [newBox, setNewBox] = useState({ width: '', height: '', depth: '', weight: '' })

  // ÚJ: Random doboz generáló állapota (alapértelmezetten 10 db)
  const [randomCount, setRandomCount] = useState<number | string>(10)

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/containers')
      .then(res => res.json())
      .then((data: Container[]) => {
        setDbContainers(data)
        if (data.length > 0) {
          setSelectedContainerId(data[0].id)
        }
      })
      .catch(err => console.error("Hiba a konténerek betöltésekor:", err))
  }, [])

  // Új doboz hozzáadása a listához
  const handleAddBox = () => {
    if (!newBox.width || !newBox.height || !newBox.depth || !newBox.weight) {
      alert("Kérlek töltsd ki az összes méretet és a súlyt!");
      return;
    }
    const newId = `BOX-${String(items.length + 1).padStart(3, '0')}`;
    const boxToAdd: Item = {
      id: newId,
      width: parseFloat(newBox.width),
      height: parseFloat(newBox.height),
      depth: parseFloat(newBox.depth),
      weight: parseFloat(newBox.weight),
      can_rotate: true
    };
    setItems([...items, boxToAdd]);
    setNewBox({ width: '', height: '', depth: '', weight: '' }); // Űrlap törlése
  }

  // Doboz törlése a listából
  const handleRemoveBox = (idToRemove: string) => {
    setItems(items.filter(item => item.id !== idToRemove));
  }

  // Szabványosított random dobozok generálása
  const handleGenerateRandomBoxes = () => {
    const count = parseInt(randomCount as string);
    if (isNaN(count) || count <= 0) {
      alert("Kérlek, adj meg egy érvényes darabszámot!");
      return;
    }

    const newRandomBoxes: Item[] = [];
    const currentLength = items.length;

    // Ipari standard dobozméretek (Egymás többszörösei, hogy jól épüljenek)
    const STANDARD_SIZES = [
      { w: 60, h: 40, d: 40, maxWeight: 35 }, // L-es doboz
      { w: 40, h: 30, d: 30, maxWeight: 20 }, // M-es doboz
      { w: 30, h: 20, d: 20, maxWeight: 10 }, // S-es doboz
      { w: 40, h: 40, d: 40, maxWeight: 25 }, // Kocka
      { w: 80, h: 40, d: 20, maxWeight: 30 }, // Lapos/Hosszú doboz
      { w: 60, h: 20, d: 40, maxWeight: 20 }, // Fél-magas L-es doboz
    ];

    for (let i = 0; i < count; i++) {
      // Véletlenszerűen kiválasztunk egy szabvány méretet
      const size = STANDARD_SIZES[Math.floor(Math.random() * STANDARD_SIZES.length)];

      // A súlyt a mérethez igazítjuk (5 kg és a doboz max súlya között)
      const weight = Math.floor(Math.random() * (size.maxWeight - 5 + 1)) + 5;

      newRandomBoxes.push({
        id: `RND-${String(currentLength + i + 1).padStart(3, '0')}`,
        width: size.w,
        height: size.h,
        depth: size.d,
        weight: weight,
        can_rotate: true
      });
    }

    setItems([...items, ...newRandomBoxes]);
  }


  const handleOptimize = async () => {
    if (items.length === 0) {
      alert("Nincs mit bepakolni! Adj hozzá legalább egy dobozt.");
      return;
    }

    const selectedContainer = dbContainers.find(c => c.id === selectedContainerId);
    if (!selectedContainer) return;

    setLoading(true)
    try {
      const payload = {
        container: selectedContainer,
        items: items // Itt már a dinamikus listát küldjük
      }

      const response = await fetch('http://localhost:8000/api/v1/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data: OptimizeResponse = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Hiba történt:", error)
      alert("Nem sikerült kapcsolódni az API-hoz!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', padding: '20px', fontFamily: 'sans-serif', gap: '40px', color: '#333' }}>

      {/* Bal oszlop: Vezérlő */}
      <div style={{ flex: 1, backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', minWidth: '400px' }}>
        <h2>ULD Pakolás Vezérlő</h2>

        {/* Konténer választó */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
            Válassz konténert az adatbázisból:
          </label>
          <select
            value={selectedContainerId}
            onChange={(e) => setSelectedContainerId(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {dbContainers.map(c => (
              <option key={c.id} value={c.id}>
                {c.id} - {c.name} (Max: {c.max_weight} kg)
              </option>
            ))}
          </select>
        </div>

        {/* Új doboz hozzáadása */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>Új doboz felvétele</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input type="number" placeholder="Szél (cm)" value={newBox.width} onChange={e => setNewBox({...newBox, width: e.target.value})} style={{ width: '25%', padding: '8px' }} />
            <input type="number" placeholder="Mag (cm)" value={newBox.height} onChange={e => setNewBox({...newBox, height: e.target.value})} style={{ width: '25%', padding: '8px' }} />
            <input type="number" placeholder="Mély (cm)" value={newBox.depth} onChange={e => setNewBox({...newBox, depth: e.target.value})} style={{ width: '25%', padding: '8px' }} />
            <input type="number" placeholder="Súly (kg)" value={newBox.weight} onChange={e => setNewBox({...newBox, weight: e.target.value})} style={{ width: '25%', padding: '8px' }} />
          </div>
          <button onClick={handleAddBox} style={{ width: '100%', padding: '8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            + Hozzáadás a listához
          </button>

          {/* ÚJ: Random generáló szekció */}
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ccc', display: 'flex', gap: '10px' }}>
            <input
              type="number"
              min="1"
              value={randomCount}
              onChange={e => setRandomCount(e.target.value)}
              style={{ width: '30%', padding: '8px', backgroundColor: 'white', color: 'black', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button
              onClick={handleGenerateRandomBoxes}
              style={{ flex: 1, padding: '8px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🎲 {randomCount} db Random Doboz Generálása
            </button>
          </div>
        </div>

        {/* --- LENYITHATÓ FÜL: Pakolandó dobozok --- */}
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => setIsPackingListOpen(!isPackingListOpen)}
              style={{
                width: '100%', padding: '12px', backgroundColor: '#e2e8f0', color: '#1a202c',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px'
              }}
            >
              <span>📦 Pakolandó dobozok ({items.length} db)</span>
              <span>{isPackingListOpen ? '▲' : '▼'}</span>
            </button>

            {isPackingListOpen && (
              <div style={{
                marginTop: '10px', maxHeight: '300px', overflowY: 'auto',
                padding: '10px', backgroundColor: '#f7fafc', borderRadius: '6px', border: '1px solid #e2e8f0'
              }}>
                {items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #edf2f7' }}>
                    <span>{item.id} - {item.width}x{item.height}x{item.depth} cm ({item.weight} kg)</span>
                    <button onClick={() => handleRemoveBox(item.id)} style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}>
                      Törlés
                    </button>
                  </div>
                ))}
                {items.length === 0 && <div style={{ textAlign: 'center', color: '#a0aec0' }}>Nincs doboz a listában.</div>}
              </div>
            )}
          </div>
          {/* ----------------------------------------- */}

        <button
          onClick={handleOptimize}
          disabled={loading || dbContainers.length === 0}
          style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {loading ? 'Számolás...' : 'Optimalizálás Indítása'}
        </button>
      </div>

      {/* Jobb oszlop: Eredmények */}
      <div style={{ flex: 2 , color: 'white'}}>
        <h2>Eredmények</h2>
        {!result ? (
          <p>Válassz konténert, adj meg dobozokat és kattints az optimalizálás indítása gombra.</p>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div style={{ padding: '15px', backgroundColor: '#e6ffe6', border: '1px solid #b3ffb3', borderRadius: '8px', color: '#000' }}>
                <strong>Kihasználtság:</strong> {result.utilization_pct}%
              </div>
              <div style={{ padding: '15px', backgroundColor: result.is_cog_valid ? '#e6ffe6' : '#ffe6e6', border: '1px solid', borderColor: result.is_cog_valid ? '#b3ffb3' : '#ffb3b3', borderRadius: '8px', color: '#000' }}>
                <strong>Súlypont (CoG):</strong> {result.is_cog_valid ? 'Megfelelő ✅' : 'Kritikus ❌'}
              </div>
              <div style={{ padding: '15px', backgroundColor: result.unpacked_items.length === 0 ? '#e6ffe6' : '#ffe6e6', border: '1px solid', borderColor: result.unpacked_items.length === 0 ? '#b3ffb3' : '#ffb3b3', borderRadius: '8px', color: '#000' }}>
                <strong>Kimaradt dobozok:</strong> {result.unpacked_items.length} db
              </div>
            </div>

            <h3>Elhelyezett dobozok koordinátái:</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'white' }}>
              {/* --- LENYITHATÓ FÜL: Elhelyezett koordináták --- */}
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <button
            onClick={() => setIsPlacedListOpen(!isPlacedListOpen)}
            style={{
              width: '100%', padding: '12px', backgroundColor: '#2d3748', color: 'white',
              border: '1px solid #4a5568', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px'
            }}
          >
            <span>📍 Elhelyezett dobozok koordinátái ({result?.placed_items?.length || 0} db)</span>
            <span>{isPlacedListOpen ? '▲' : '▼'}</span>
          </button>

          {isPlacedListOpen && result && result.placed_items && (
            <div style={{
              marginTop: '10px', maxHeight: '400px', overflowY: 'auto',
              backgroundColor: '#1a202c', border: '1px solid #2d3748', borderRadius: '6px'
            }}>
              <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#2d3748' }}>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '8px' }}>ID</th>
                    <th style={{ padding: '8px' }}>X</th>
                    <th style={{ padding: '8px' }}>Y</th>
                    <th style={{ padding: '8px' }}>Z</th>
                    <th style={{ padding: '8px' }}>Rotált Méret (W x H x D)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.placed_items.map((pi: any, index: number) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{pi.item.id}</td>
                      <td style={{ padding: '8px' }}>{pi.x}</td>
                      <td style={{ padding: '8px' }}>{pi.y}</td>
                      <td style={{ padding: '8px' }}>{pi.z}</td>
                      <td style={{ padding: '8px' }}>{pi.w} x {pi.h} x {pi.d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
              {/* 3D Vizualizáció - Ide kerül a doboz! */}
            <div style={{ marginTop: '30px' }}>
              <h3>3D Vizualizáció</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Használd a bal egeret a forgatáshoz, a görgőt a nagyításhoz.
              </p>
              <div style={{ height: '500px', backgroundColor: '#222', borderRadius: '8px', overflow: 'hidden' }}>
                <Scene
                  container={dbContainers.find(c => c.id === selectedContainerId)!}
                  placedItems={result.placed_items}
                />
              </div>
            </div>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

export default App