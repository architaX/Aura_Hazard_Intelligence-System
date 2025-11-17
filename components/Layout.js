import Navbar from './Navbar';
import OfficialAlerts from './OfficialAlerts';
import EmergencyResources from './EmergencyResources'; // <-- RE-IMPORT THIS

export default function Layout({ children }) {
  return (
    // Main layout is a full-height column
    <div className="flex flex-col h-screen">
      
      {/* Top Bar - a simple header */}
      <header className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <h1 className="text-3xl font-bold text-white">Aura</h1>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* --- SIDEBAR --- */}
        {/* We use space-y-6 to add spacing between our panels */}
        <div className="w-full md:w-1/4 lg:w-1/5 h-full overflow-y-auto p-4 bg-slate-800 border-r border-slate-700 space-y-6">
          
          {/* Panel 1: Login/Nav links */}
          <Navbar />

          {/* Panel 2: Official Alerts (IMD) */}
          <OfficialAlerts />

          {/* Panel 3: Static Emergency Helplines */}
          <EmergencyResources />

        </div>

        {/* --- MAIN CONTENT (The Map) --- */}
        <div className="flex-1 h-full bg-slate-900">
          {children} {/* This is where the map will go */}
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="p-2 bg-slate-900 border-t border-slate-700 text-center">
        <p className="text-xs text-slate-400">
          © 2025 Aura Hazard Intelligence. All rights reserved.
        </p>
      </footer>
    </div>
  );
}