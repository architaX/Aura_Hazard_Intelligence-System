import clientPromise from '@/lib/mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from './auth/[...nextauth]';
import { ObjectId } from 'mongodb';

const VOTES_TO_RESOLVE = 4; // 4 user votes will resolve an issue

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

  const userId = session.user.id;

  try {
    const client = await clientPromise;
    const db = client.db('AuraDB');
    const reportsCollection = db.collection('reports');
    
    const reportOID = new ObjectId(reportId);

    // Add the user's vote to the 'resolvedBy' array
    const updateResult = await reportsCollection.updateOne(
      { _id: reportOID },
      { $addToSet: { resolvedBy: new ObjectId(userId) } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    if (updateResult.modifiedCount === 0) {
      return res.status(200).json({ message: 'You have already voted on this report.' });
    }

    // Check if the vote count has reached the threshold
    const updatedReport = await reportsCollection.findOne({ _id: reportOID });
    
    if (updatedReport.resolvedBy && updatedReport.resolvedBy.length >= VOTES_TO_RESOLVE) {
      // Resolve the report
      await reportsCollection.updateOne(
        { _id: reportOID },
        { 
          $set: { 
            status: 'resolved',
            resolvedAt: new Date()
          } 
        }
      );
      return res.status(200).json({ message: 'Vote recorded. Report has been resolved!' });
    }

    res.status(200).json({ 
      message: `Vote recorded. ${VOTES_TO_RESOLVE - updatedReport.resolvedBy.length} more votes needed.` 
    });

  } catch (error) {
    console.error('Failed to cast resolve vote:', error);
    res.status(500).json({ message: 'Error casting vote', error: error.message });
  }
}