// This API provides a static list of emergency resources.
// In the future, this could be powered by a database.

const resources = [
  { 
    _id: 1, 
    name: 'National Emergency', 
    phone: '112',
    type: 'ALL'
  },
  { 
    _id: 2, 
    name: 'Police', 
    phone: '100',
    type: 'ACCIDENT'
  },
  { 
    _id: 3, 
    name: 'Fire Department', 
    phone: '101',
    type: 'FIRE'
  },
  { 
    _id: 4, 
    name: 'Ambulance', 
    phone: '102',
    type: 'ACCIDENT'
  },
  { 
    _id: 5, 
    name: 'Disaster Management', 
    phone: '1077',
    type: 'ALL'
  },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Prevent caching
  res.setHeader('Cache-Control', 'no-store');
  
  try {
    // Just return our static list
    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resources' });
  }
}