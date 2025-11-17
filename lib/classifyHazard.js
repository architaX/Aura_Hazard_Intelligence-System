// This is our "Simple NLP" keyword classifier.
// It's fast, effective, and runs on our server.

const classifications = {
  FLOOD: ['flood', 'flooding', 'water', 'drown', 'inundation', 'deluge', 'submerged', 'rain'],
  FIRE: ['fire', 'smoke', 'flame', 'burning', 'wildfire'],
  EARTHQUAKE: ['earthquake', 'quake', 'tremor', 'seismic', 'aftershock'],
  ACCIDENT: ['accident', 'crash', 'collision', 'pileup', 'vehicle'],
  WEATHER: ['thunderstorm', 'cyclone', 'hail', 'storm', 'gusty'],
  // A "catch-all" for other user reports
  OTHER: ['hazard', 'danger', 'pothole', 'tree', 'downed', 'spill']
};

export function classifyHazard(text) {
  if (!text) return 'OTHER';
  
  const lowerText = text.toLowerCase();
  
  // Find the first category that has a matching keyword
  for (const [category, keywords] of Object.entries(classifications)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  
  return 'OTHER';
}