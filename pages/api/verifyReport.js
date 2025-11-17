import clientPromise from '@/lib/mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from './auth/[...nextauth]';
import { ObjectId } from 'mongodb';

// --- Set the default expiry time: 24 hours from now ---
const EXPIRY_TIME_MS = 24 * 60 * 60 * 1000; // 48 hours in milliseconds

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'Bad Request: Missing report ID' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('AuraDB');
    
    // When we verify, we also set a 'verifiedAt' timestamp and an 'expiresAt' timestamp.
    const result = await db.collection('reports').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'verified',
          verifiedAt: new Date(),
          expiresAt: new Date(Date.now() + EXPIRY_TIME_MS) // Set expiry 48h from now
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.status(200).json({ message: 'Report verified successfully' });

  } catch (error) {
    console.error('Failed to verify report:', error);
    res.status(500).json({ message: 'Error verifying report', error: error.message });
  }
}