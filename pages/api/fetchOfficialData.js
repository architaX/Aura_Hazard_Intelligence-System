import clientPromise from '@/lib/mongodb';
import { parseStringPromise } from 'xml2js';

// --- Configuration ---
// CORRECTED URL: Removed the extra dot from 'https.://'
const RSS_FEED_URL = 'https://mausam.imd.gov.in/imd_latest/contents/dist_nowcast_rss.php';
const OFFICIAL_SOURCE_TAG = 'IMD_NOWCAST'; 

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  console.log('[fetchOfficialData] Starting fetch...');

  try {
    // --- Step 1: Fetch ---
    const response = await fetch(RSS_FEED_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed (${response.status}): ${response.statusText}`);
    }
    const xmlData = await response.text();
    console.log('[fetchOfficialData] Fetched RSS feed XML.');

    // --- Step 2: Parse ---
    const parsedData = await parseStringPromise(xmlData, {
      explicitArray: false,
      trim: true,
      ignoreAttrs: true, 
    });
    console.log('[fetchOfficialData] Parsed XML data.');

    // --- Step 3: Extract Items ---
    if (!parsedData || !parsedData.rss || !parsedData.rss.channel) {
        throw new Error('Unexpected XML structure in RSS feed.');
    }
    let items = parsedData.rss.channel.item;
    if (!items) {
        items = [];
    } else if (!Array.isArray(items)) {
        items = [items];
    }
    console.log(`[fetchOfficialData] Found ${items.length} items in the feed.`);

    // --- Step 4: Connect DB ---
    const client = await clientPromise;
    const db = client.db('AuraDB');
    const reportsCollection = db.collection('reports');
    
    let newReportsCount = 0;

    // --- Step 5: Loop and Save New ---
    for (const item of items) {
      const officialId = item.guid && typeof item.guid === 'object' ? item.guid._ : item.guid;
      if (!officialId) {
        console.warn('[fetchOfficialData] Skipping item without a GUID:', item.title);
        continue;
      }

      const existingReport = await reportsCollection.findOne({ officialId: officialId });
      
      if (!existingReport) {
        console.log(`[fetchOfficialData] Processing NEW item: ${item.title}`);
        
        // --- THIS IS THE FIX ---
        const newOfficialReport = {
          officialId: officialId,
          source: OFFICIAL_SOURCE_TAG,
          description: item.description || 'No details provided', // The DISASTER TYPE
          locationName: item.title || 'Unknown location', // The PLACE NAME
          link: item.link || null,
          location: null, 
          status: 'verified',
          aiVerification: { safe: true, labels: ['official_alert'] }, 
          submittedBy: 'official_feed',
          createdAt: item.pubDate ? new Date(item.pubDate) : new Date(), 
        };
        // --- END OF FIX ---

        await reportsCollection.insertOne(newOfficialReport);
        newReportsCount++;
      }
    }

    // --- Step 6: Send Response ---
    console.log(`[fetchOfficialData] Finished processing. Added ${newReportsCount} new official reports.`);
    res.status(200).json({ message: `Successfully fetched and processed feed. Added ${newReportsCount} new reports.` });

  } catch (error) {
    console.error('[fetchOfficialData] Failed:', error);
    res.status(500).json({ message: 'Error fetching official data', error: error.message });
  }
}