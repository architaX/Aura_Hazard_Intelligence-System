import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with the keys from our .env.local file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default async function handler(req, res) {
  // We only allow GET requests for this
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  try {
    // We are creating a signature for an upload.
    // The `timestamp` is used to make sure the signature is fresh.
    const timestamp = Math.round(new Date().getTime() / 1000);

    // This is the function that uses our API Secret to create the signature
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    // 4. --- SEND RESPONSE ---
    // We send the signature and timestamp back to the frontend
    res.status(200).json({ signature, timestamp });

  } catch (error) {
    console.error('Failed to sign upload:', error);
    res.status(500).json({ message: 'Error signing upload', error: error.message });
  }
}