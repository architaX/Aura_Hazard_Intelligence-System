import clientPromise from '@/lib/mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from './auth/[...nextauth]';
import { ObjectId } from 'mongodb';

const BUMP_TIME_MS = 24 * 60 * 60 * 1000; // 24 hours

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'You must be logged in to vote.' });
  }

  const { reportId } = req.body;
  if (!reportId) {
    return res.status(400).json({ message: 'Bad Request: Missing report ID' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('AuraDB');
    
    const result = await db.collection('reports').updateOne(
      { _id: new ObjectId(reportId) },
      { 
        $set: { 
          expiresAt: new Date(Date.now() + BUMP_TIME_MS) 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.status(200).json({ message: 'Report expiry has been extended.' });

  } catch (error) {
    console.error('Failed to bump report:', error);
    res.status(500).json({ message: 'Error bumping report', error: error.message });
  }
}