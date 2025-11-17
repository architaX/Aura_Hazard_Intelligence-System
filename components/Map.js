import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useSession } from 'next-auth/react'; // Import useSession to check login status

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- NEW COMPONENT TO RENDER MARKERS ---
function ShowMarkers({ reports }) {
  const map = useMap();
  const { data: session } = useSession(); // Get user session
  const [message, setMessage] = useState({}); // To show feedback per-marker

  // --- "Still Here?" button click handler ---
  const handleBump = async (reportId) => {
    setMessage({ ...message, [reportId]: 'Voting...' });
    const response = await fetch('/api/bumpReport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    const data = await response.json();
    setMessage({ ...message, [reportId]: data.message });
    setTimeout(() => setMessage({ ...message, [reportId]: null }), 3000);
  };

  // --- "Issue Cleared?" button click handler ---
  const handleResolve = async (reportId) => {
    setMessage({ ...message, [reportId]: 'Voting...' });
    const response = await fetch('/api/communityResolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    const data = await response.json();
    setMessage({ ...message, [reportId]: data.message });
    // No need to hide, the pin will disappear on next refresh if resolved
  };

  return (
    <>
      {reports.map((report) => {
        if (!report.location || !report.location.coordinates) {
          return null;
        }

        return (
          <Marker 
            key={report._id} 
            position={[
              report.location.coordinates[1], // Lat
              report.location.coordinates[0]  // Lng
            ]}
          >
            <Popup>
              <div className="w-48">
                <strong className="text-lg">{report.hazardType || 'Hazard'}:</strong>
                <p className="my-1">{report.description}</p>
                
                {/* --- Community Voting Buttons --- */}
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-gray-600 mb-2">
                    Is this hazard still here?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBump(report._id)}
                      disabled={!session} // Disable if not logged in
                      className="flex-1 px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      Still Here?
                    </button>
                    <button
                      onClick={() => handleResolve(report._id)}
                      disabled={!session} // Disable if not logged in
                      className="flex-1 px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600 disabled:bg-gray-400"
                    >
                      Issue Cleared?
                    </button>
                  </div>
                  {!session && (
                    <p className="text-xs text-red-500 mt-1">
                      Please log in to vote.
                    </p>
                  )}
                  {message[report._id] && (
                    <p className="text-xs text-green-600 mt-1">
                      {message[report._id]}
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

// --- MAIN MAP COMPONENT (no changes) ---
export default function Map() {
  const [reports, setReports] = useState([]);
  const position = [12.9716, 77.5946]; // Default: Bengaluru

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/getMapData');
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error('Error fetching map data:', error);
      }
    }
    // Auto-refresh the map every 30 seconds
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (typeof window === 'undefined') {
    return <p>Loading map...</p>;
  }

  return (
    <MapContainer 
      center={position} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      <ShowMarkers reports={reports} />
      
    </MapContainer>
  );
}