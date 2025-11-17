import clientPromise from '@/lib/mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from './auth/[...nextauth]';
const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");

// ... (Clarifai setup code - no changes) ...
const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key " + process.env.CLARIFAI_PAT);

function callClarifaiModel(authorUserID, authorAppID, modelId, imageUrl) {
  return new Promise((resolve, reject) => {
    stub.PostModelOutputs(
      {
        user_app_id: { "user_id": authorUserID, "app_id": authorAppID },
        model_id: modelId,
        inputs: [ { data: { image: { url: imageUrl } } } ]
      },
      metadata,
      (err, response) => {
        if (err) {
          reject("gRPC Error: " + err.details);
        } else if (response.status.code !== 10000) {
          reject("Clarifai API failed: " + response.status.description);
        } else {
          resolve(response.outputs[0].data.concepts || []);
        }
      }
    );
  });
}

// --- Main API Handler ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // --- UPDATED: Get new fields from the body ---
    const { 
      description, 
      latitude, 
      longitude, 
      imageUrl,
      incidentTime, // <-- NEW
      duration      // <-- NEW
    } = req.body;

    // --- (AI ANALYSIS - no changes) ---
    console.log(`[Clarifai] Analyzing image: ${imageUrl}`);
    const moderationConcepts = await callClarifaiModel('clarifai', 'main', 'moderation-recognition', imageUrl);
    const unsafeConcept = moderationConcepts.find(concept => 
      ['explicit', 'gore', 'suggestive', 'violence', 'drug'].includes(concept.name) && 
      concept.value > 0.5
    );
    if (unsafeConcept) {
      console.warn(`[Clarifai] Unsafe image detected (${unsafeConcept.name}). Rejecting.`);
      return res.status(400).json({ message: 'Image rejected: Unsafe content detected.' });
    }
    const labelConcepts = await callClarifaiModel('clarifai', 'main', 'general-image-recognition', imageUrl);
    const labels = labelConcepts.map(concept => concept.name);
    console.log(`[Clarifai] Labels found: ${labels.join(', ')}`);

    // --- (DATABASE LOGIC - NO BUMPING) ---
    // We are back to a simple "create" logic.
    // The old "bumping" logic is removed.
    const newReport = {
      description,
      imageUrl,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      status: 'pending', // All new reports are pending
      
      // --- NEW: Save new fields ---
      incidentTime: new Date(incidentTime),
      duration: duration,

      aiVerification: {
        safe: true,
        labels: labels.slice(0, 5), 
        rawModeration: moderationConcepts.slice(0, 5), 
      },
      submittedBy: session.user.email,
      createdAt: new Date(),
    };
    
    const client = await clientPromise;
    const db = client.db('AuraDB');
    
    const insertResult = await db.collection('reports').insertOne(newReport);
    const insertedReport = await db.collection('reports').findOne({ _id: insertResult.insertedId });

    res.status(201).json({ message: 'Report submitted successfully!', report: insertedReport });

  } catch (error) {
    console.error('Failed to submit report:', error);
    res.status(500).json({ message: 'Error submitting report', error: error.message });
  }
}