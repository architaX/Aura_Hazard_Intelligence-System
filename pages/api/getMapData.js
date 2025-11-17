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
    
    // --- THIS IS THE FINAL LOGIC ---
    // We now ONLY fetch reports that are:
    // 1. 'verified'
    // 2. AND their 'expiresAt' date is in the future
    const reportsFromDb = await db
      .collection('reports')
      .find({ 
        status: 'verified',
        expiresAt: { $gt: new Date() } // $gt means "greater than"
      })
      .sort({ createdAt: -1 })
      .limit(50) 
      .toArray();
    // --- END OF FINAL LOGIC ---

    const reportsForMap = reportsFromDb.map(report => {
      let hazardType = 'Unknown'; 
      if (report.aiVerification && Array.isArray(report.aiVerification.labels) && report.aiVerification.labels.length > 0) {
        hazardType = report.aiVerification.labels[0];
        hazardType = hazardType.charAt(0).toUpperCase() + hazardType.slice(1); 
      } else if (report.source === 'IMD_NOWCAST') {
        hazardType = 'Weather Alert';
      }
      
      if (!report.location) return null;

      return {
        _id: report._id,
        description: report.description,
        location: report.location,
        hazardType: hazardType,
      };
    }).filter(report => report !== null);

    res.status(200).json(reportsForMap);

  } catch (error) {
    console.error('Failed to fetch map data:', error);
    res.status(500).json({ message: 'Error fetching map data' });
  }
}