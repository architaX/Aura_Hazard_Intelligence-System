import clientPromise from '@/lib/mongodb';
import { parseStringPromise } from 'xml2js';
import { classifyHazard } from '@/lib/classifyHazard'; // <-- Import our NLP classifier

// --- Configuration ---
const RSS_FEED_URL = 'https://mausam.imd.gov.in/imd_latest/contents/dist_nowcast_rss.php';
const OFFICIAL_SOURCE_TAG = 'IMD_NOWCAST'; 
// Free, public geocoding API. No key needed.
const GEOCODE_API_URL = 'https://nominatim.openstreetmap.org/search';

// Helper function to prevent hitting the API too fast
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  console.log('[fetchOfficialData] Starting fetch...');

  try {
    const response = await fetch(RSS_FEED_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed (${response.status}): ${response.statusText}`);
    }
    const xmlData = await response.text();
    const parsedData = await parseStringPromise(xmlData, { explicitArray: false, trim: true, ignoreAttrs: true });

    if (!parsedData || !parsedData.rss || !parsedData.rss.channel) {
        throw new Error('Unexpected XML structure in RSS feed.');
    }

    let items = parsedData.rss.channel.item;
    if (!items) items = [];
    if (!Array.isArray(items)) items = [items];
    console.log(`[fetchOfficialData] Found ${items.length} items in the feed.`);

    const client = await clientPromise;
    const db = client.db('AuraDB');
    const reportsCollection = db.collection('reports');
    
    let newReportsCount = 0;

    for (const item of items) {
      const officialId = item.guid && typeof item.guid === 'object' ? item.guid._ : item.guid;
      if (!officialId) continue;

      const existingReport = await reportsCollection.findOne({ officialId: officialId });
      
      if (!existingReport) {
        console.log(`[fetchOfficialData] Processing NEW item: ${item.title}`);
        
        // --- 1. NLP CLASSIFICATION ---
        const hazardDescription = item.description || 'Weather Alert';
        // Classify the hazard type based on the IMD description
        const hazardType = classifyHazard(hazardDescription); 
        
        // --- 2. GEOLOCATION EXTRACTION ---
        const locationName = item.title || 'Unknown location';
        let coordinates = null;
        
        // Call the geocoding API to get lat/lng from the place name
        const geoQuery = encodeURIComponent(`${locationName}, India`);
        const geoResponse = await fetch(
          `${GEOCODE_API_URL}?q=${geoQuery}&format=json&limit=1`, 
          {
            // IMPORTANT: OpenStreetMap requires a valid User-Agent
            headers: { 'User-Agent': 'AuraHazardApp/1.0 (aura-app-user@example.com)' }
          }
        );

        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData && geoData.length > 0) {
            // Save as GeoJSON: [Longitude, Latitude]
            coordinates = [
              parseFloat(geoData[0].lon),
              parseFloat(geoData[0].lat)
            ];
            console.log(`[Geocode] Found ${locationName}: ${coordinates}`);
          }
        }
        
        // --- 3. CREATE NEW REPORT ---
        const newOfficialReport = {
          officialId: officialId,
          source: OFFICIAL_SOURCE_TAG,
          description: hazardDescription,
          locationName: locationName,
          hazardType: hazardType, // <-- NEW NLP FIELD
          link: item.link || null,
          location: coordinates ? { type: 'Point', coordinates: coordinates } : null, // <-- NEW GEO-DATA
          status: 'verified', // Official alerts are auto-verified
          aiVerification: { safe: true, labels: ['official_alert'] }, 
          submittedBy: 'official_feed',
          createdAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          // Add an expiry time to auto-clear this alert
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };

        await reportsCollection.insertOne(newOfficialReport);
        newReportsCount++;
        
        // --- 4. SLOW DOWN ---
        // OpenStreetMap API has a 1 request/second policy.
        await sleep(1000); 
      }
    }

    console.log(`[fetchOfficialData] Finished. Added ${newReportsCount} new reports.`);
    res.status(200).json({ message: `Successfully fetched and processed feed. Added ${newReportsCount} new reports.` });

  } catch (error) {
    console.error('[fetchOfficialData] Failed:', error);
    res.status(500).json({ message: 'Error fetching official data', error: error.message });
  }
}