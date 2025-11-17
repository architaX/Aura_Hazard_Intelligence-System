import clientPromise from '@/lib/mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 1. --- AUTHENTICATION & AUTHORIZATION ---
  // Get the session
  const session = await getServerSession(req, res, authOptions);

  // Check if a user is logged in
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Check if the user is an 'admin'
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Access restricted to admins' });
  }

  // 2. --- DATABASE ---
  // If we are here, the user is an admin.
  try {
    const client = await clientPromise;
    const db = client.db('AuraDB');
    
    // Find all reports and sort them by newest first
    const reports = await db
      .collection('reports')
      .find({})
      .sort({ createdAt: -1 }) // Newest reports on top
      .toArray();

    // 3. --- SEND RESPONSE ---
    res.status(200).json(reports);

  } catch (error) {
    console.error('Failed to fetch reports:', error);
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
}