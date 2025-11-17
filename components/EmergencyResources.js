import { useState, useEffect } from 'react';

// You can find simple icons from a library like 'lucide-react'
// For now, we'll use emojis
const iconMap = {
  ALL: '🚨',
  FIRE: '🔥',
  ACCIDENT: '🚑',
};

export default function EmergencyResources() {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/getResources')
      .then(res => res.json())
      .then(data => {
        setResources(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch resources:", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="p-4 bg-slate-700 rounded-lg shadow-md">
      <p className="px-4 mb-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Emergency Helplines
      </p>
      
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {isLoading && (
          <p className="text-slate-300 px-4">Loading...</p>
        )}
        {!isLoading && resources.map(res => (
          <div key={res._id} className="px-4 pb-2">
            <p className="text-sm font-semibold text-white flex items-center">
              <span className="mr-2">{iconMap[res.type] || '📞'}</span>
              {res.name}
            </p>
            <p className="text-lg font-bold text-blue-300 ml-6">
              {res.phone}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}