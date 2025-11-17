import clientPromise from '@/lib/mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from './auth/[...nextauth]';
import { ObjectId } from 'mongodb';

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
    
    const result = await db.collection('reports').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'resolved',
          resolvedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.status(200).json({ message: 'Report resolved successfully' });

  } catch (error) {
    console.error('Failed to resolve report:', error);
    res.status(500).json({ message: 'Error resolving report', error: error.message });
  }
}