import FlightConfigurator from './components/FlightConfigurator'

function App() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Fejléc */}
      <header className="py-6 text-center shadow-md bg-slate-900 border-b border-slate-800">
        <h1 className="text-3xl font-extrabold text-blue-400 tracking-wide">
          ULD Cargo Optimalizáló
        </h1>
        <p className="text-slate-400 mt-1">Budapesti Gazdasági Egyetem - Szakdolgozat</p>
      </header>

      {/* Fő tartalom (A most létrehozott rácsos komponens) */}
      <main className="pt-6">
        <FlightConfigurator />
      </main>
    </div>
  )
}

export default App