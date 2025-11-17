import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip } from 'react-leaflet'; // <-- Import Tooltip
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Function to get the status color
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'orange';
    case 'verified': return 'green';
    case 'resolved':
    case 'rejected': return 'grey';
    default: return 'blue';
  }
};

export default function AdminMap({ reports }) {
  const position = [12.9716, 77.5946]; // Default center

  return (
    <MapContainer 
      center={position} 
      zoom={10} 
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      {reports.map((report) => {
        if (!report.location || !report.location.coordinates) {
          return null;
        }
        const color = getStatusColor(report.status);

        return (
          <Marker 
            key={report._id} 
            position={[
              report.location.coordinates[1], // Lat
              report.location.coordinates[0]  // Lng
            ]}
            // The 'icon' prop is GONE. We are using the default pin.
          >
            {/* --- NEW: Add a Tooltip for hover --- */}
            <Tooltip>
              <strong>{report.hazardType || 'Hazard'} ({report.status})</strong>
              <br/>
              {report.description}
            </Tooltip>

            {/* --- We keep the Popup for admin actions --- */}
            <Popup>
              <strong>{report.status.toUpperCase()}:</strong>
              <br/>
              {report.description}
              {report.imageUrl && (
                <>
                  <br/>
                  <a href={report.imageUrl} target="_blank" rel="noopener noreferrer">
                    View Image
                  </a>
                </>
              )}
            </Popup>
            <Circle 
              center={[
                report.location.coordinates[1],
                report.location.coordinates[0]
              ]}
              radius={100}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.5 }}
            />
          </Marker>
        );
      })}
    </MapContainer>
  );
}