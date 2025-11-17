import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Prevent caching so the list is always fresh
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const client = await clientPromise;
    const db = client.db('AuraDB');
    
    // Find the 10 newest reports from our official source
    const reports = await db
      .collection('reports')
      .find({ 
        source: 'IMD_NOWCAST',
        status: 'verified' // Ensure we only show verified alerts
      })
      .sort({ createdAt: -1 }) // Newest first
      .limit(10) // Only get the top 10
      .toArray();

    res.status(200).json(reports);

  } catch (error) {
    console.error('Failed to fetch official alerts:', error);
    res.status(500).json({ message: 'Error fetching official alerts' });
  }
}