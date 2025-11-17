import { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// --- Set the refresh interval: 30 seconds ---
const REFRESH_INTERVAL_MS = 30 * 1000; // 30 seconds

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // AdminMap component is loaded dynamically
  const AdminMap = useMemo(() => dynamic(
    () => import('@/components/AdminMap'),
    { 
      loading: () => <p className="text-slate-300">Loading map...</p>,
      ssr: false 
    }
  ), []);

  // Function to fetch all reports from our database
  const fetchReports = (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true);
    }
    
    fetch('/api/getReports')
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
        if (isInitialLoad) {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        setError(err.message);
        if (isInitialLoad) {
          setIsLoading(false);
        }
      });
  };

  // --- useEffect hook with polling ---
  useEffect(() => {
    if (status === 'authenticated' && session.user.role === 'admin') {
      // 1. Fetch reports immediately on load
      fetchReports(true);

      // 2. Set up an interval to silently refresh reports every 30 seconds
      // This will automatically pick up new official alerts from the Cron Job
      // and new user-submitted reports.
      const intervalId = setInterval(() => fetchReports(false), REFRESH_INTERVAL_MS);

      // 3. Clean up the interval
      return () => clearInterval(intervalId);
    }
  }, [session, status]);

  // --- API Call Functions for Admin Buttons ---
  const callReportAPI = async (endpoint, id) => {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchReports(); // Refresh the list
  };

  const handleVerify = (id) => callReportAPI('/api/verifyReport', id);
  const handleReject = (id) => callReportAPI('/api/rejectReport', id);
  const handleResolve = (id) => callReportAPI('/api/resolveReport', id);

  // --- Session Check ---
  if (status === 'loading') {
    return <p className="text-center p-10 text-white">Loading...</p>;
  }
  if (status === 'unauthenticated' || (session && session.user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="p-10 text-center bg-slate-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-white">You must be an admin to view this page.</p>
          <button 
            onClick={() => router.push('/login')} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Filter reports that have a location for the map
  const reportsWithLocation = reports.filter(report => 
    report.location && report.location.coordinates
  );

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <button 
          onClick={() => signOut({ callbackUrl: '/' })} 
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Sign Out
        </button>
      </header>
      
      <main>
        
        {/* --- "System Controls" panel is REMOVED --- */}

        {/* --- Report Map --- */}
        <div className="mb-6 bg-slate-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Report Map</h2>
          <AdminMap reports={reportsWithLocation} />
        </div>

        {/* --- All Reports Table --- */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">All Reports (Auto-refreshes every 30s)</h2>
          
          {isLoading && <p className="text-slate-300">Loading reports...</p>}
          {error && <p className="text-red-500">{error}</p>}
          
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Image</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">AI Labels</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {reports.map((report) => (
                    <tr key={report._id}>
                      {/* --- Status Cell --- */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          report.status === 'verified' ? 'bg-green-900 text-green-200' :
                          report.status === 'pending' ? 'bg-yellow-900 text-yellow-200' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      {/* --- Image Cell --- */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {report.imageUrl ? (
                          <a href={report.imageUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                            View
                          </a>
                        ) : (<span className="text-slate-500">N/A</span>)}
                      </td>
                      {/* --- Description Cell --- */}
                      <td className="px-6 py-4 text-sm text-slate-200">{report.description}</td>
                      {/* --- Location (Place Name) Cell --- */}
                      <td className="px-6 py-4 text-sm text-slate-400">{report.locationName || 'N/A'}</td>
                      {/* --- AI LABELS CELL --- */}
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {report.aiVerification && report.aiVerification.labels ? report.aiVerification.labels.join(', ') : 'N/A'}
                      </td>
                      {/* --- Source Cell --- */}
                      <td className="px-6 py-4 text-sm text-slate-400">{report.source || 'user'}</td>
                      
                      {/* --- ACTIONS CELL --- */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {report.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button onClick={() => handleVerify(report._id)} className="text-green-400 hover:text-green-300">
                              Verify
                            </button>
                            <button onClick={() => handleReject(report._id)} className="text-red-400 hover:text-red-300">
                              Reject
                            </button>
                          </div>
                        )}
                        {report.status === 'verified' && (
                          <button onClick={() => handleResolve(report._id)} className="text-gray-400 hover:text-gray-300">
                            Resolve
                          </button>
                        )}
                        {(report.status === 'resolved' || report.status === 'rejected') && (
                          <span className="text-slate-500">{report.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}