import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Prevent caching so the map is always fresh
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const client = await clientPromise;
    const db = client.db('AuraDB');
    
    // --- STEP 1: Find all reports that are... ---
    // 1. 'verified'
    // 2. AND their 'expiresAt' date is in the future
    const reportsFromDb = await db
      .collection('reports')
      .find({ 
        status: 'verified',
        expiresAt: { $gt: new Date() } // $gt means "greater than"
      })
      .sort({ createdAt: -1 })
      .limit(100) // Get up to 100 active reports
      .toArray();

    // --- STEP 2: Format the data for the map ---
    // We only send the data the map *needs*
    const reportsForMap = reportsFromDb
      .filter(report => report.location && report.location.coordinates) // Only include reports that HAVE a location
      .map(report => {
        return {
          _id: report._id,
          description: report.description,
          location: report.location, // e.g., { type: 'Point', coordinates: [lng, lat] }
          hazardType: report.hazardType || 'OTHER', // The type from our NLP
        };
      });

    // --- STEP 3: Send the clean data ---
    res.status(200).json(reportsForMap);

  } catch (error) {
    console.error('Failed to fetch map data:', error);
    res.status(500).json({ message: 'Error fetching map data' });
  }
}