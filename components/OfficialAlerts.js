import { useState, useEffect } from 'react';
import Link from 'next/link';

// Set the refresh interval: 5 minutes in milliseconds
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function OfficialAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- THIS useEffect hook is now UPGRADED ---
  useEffect(() => {
    // 1. Define the function to fetch data
    const fetchAlerts = () => {
      console.log('Fetching new official alerts...');
      // We set isLoading to true only on the *first* load
      // Subsequent refreshes will happen silently in the background
      
      fetch('/api/getOfficialAlerts')
        .then(res => res.json())
        .then(data => {
          setAlerts(data);
          setIsLoading(false); // Stop loading spinner
        })
        .catch(err => {
          console.error("Failed to fetch official alerts:", err);
          setIsLoading(false); // Stop loading spinner even on error
        });
    };

    // 2. Fetch data immediately when the component loads
    fetchAlerts();

    // 3. Set up an interval to re-fetch data every 5 minutes
    const intervalId = setInterval(fetchAlerts, REFRESH_INTERVAL_MS);

    // 4. This is the "cleanup" function.
    // It runs when the component is unmounted (e.g., user leaves the page)
    // This prevents memory leaks.
    return () => clearInterval(intervalId);

  }, []); // The empty array means this setup runs only once

  return (
    <div className="p-4 bg-slate-700 rounded-lg shadow-md mb-6">
      <p className="px-4 mb-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Official Alerts 
      </p>
      
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {/* We only show the "Loading..." text on the very first load */}
        {isLoading && alerts.length === 0 && (
          <p className="text-slate-300 px-4">Loading alerts...</p>
        )}
        {!isLoading && alerts.length === 0 && (
          <p className="text-slate-300 text-sm px-4">No active official alerts.</p>
        )}
        {!isLoading && alerts.map(alert => (
          <div key={alert._id} className="px-4 pb-2 border-b border-slate-600 last:border-b-0">
            <p className="text-sm font-semibold text-white">
              {alert.locationName}
            </p>
            <p className="text-xs text-slate-300">
              {alert.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}