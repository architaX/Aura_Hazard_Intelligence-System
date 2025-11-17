// @ts-check
import clientPromise from '../../lib/mongodb';

/**
 * @typedef {import('next').NextApiRequest} NextApiRequest
 * @typedef {import('next').NextApiResponse} NextApiResponse
 * @typedef {import('mongodb').MongoClient} MongoClient
 */

/**
 * @param {NextApiRequest} req
 * @param {NextApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // --- Add cache-busting headers ---
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  console.log('--- [getNearbyResources] API CALLED (v2: $geoWithin) ---');

  try {
    const { lat, lng } = req.query;
    console.log(`[Debug] Received query: lat=${lat}, lng=${lng}`);

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Missing lat or lng parameters' });
    }

    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lng));

    if (isNaN(latitude) || isNaN(longitude)) {
      console.error('[Debug] Failed to parse coordinates.');
      return res.status(400).json({ message: 'Invalid lat or lng parameters' });
    }
    console.log(`[Debug] Parsed coordinates: [${longitude}, ${latitude}]`);

    /** @type {MongoClient} */
    const client = await clientPromise;
    const db = client.db('AuraDB');
    
    // --- THIS IS THE NEW QUERY ---
    // We will use $geoWithin with a $centerSphere
    // This finds all documents within a 20km circle.
    // $centerSphere: [ [lng, lat], radius_in_radians ]
    
    const earthRadiusKm = 6378.1; // Standard Earth radius in km
    const radiusInRadians = 20 / earthRadiusKm; // 20km radius converted to radians
    
    const query = {
      location: {
        $geoWithin: {
          $centerSphere: [ [longitude, latitude], radiusInRadians ]
        }
      }
    };
    
    console.log('[Debug] Sending $geoWithin query to MongoDB:', JSON.stringify(query, null, 2));

    // We can use .find() with this query, as it's not an aggregate operator
    const resources = await db.collection('resources').find(query).limit(3).toArray();
    // --- END OF FIX ---
    
    console.log(`[Debug] MongoDB returned ${resources.length} results:`, resources);

    res.status(200).json(resources);

  } catch (error) {
    console.error('Failed to fetch nearby resources:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error fetching resources', error: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}