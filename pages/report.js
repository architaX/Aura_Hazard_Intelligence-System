import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function ReportHazard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [file, setFile] = useState(null);
  const [incidentTime, setIncidentTime] = useState(new Date().toISOString().slice(0, 16)); // <-- NEW
  const [duration, setDuration] = useState('unknown'); // <-- NEW
  
  // UI state
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    setIsFetchingLocation(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setIsFetchingLocation(false);
        setMessage({ type: 'success', text: 'Location fetched successfully!' });
      },
      () => {
        setMessage({ type: 'error', text: 'Unable to retrieve your location. Please enter it manually.' });
        setIsFetchingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Please select an image to upload.' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    let signature, timestamp;
    try {
      // ... (PART 1: GET SIGNATURE - no changes) ...
      const sigResponse = await fetch('/api/sign-upload');
      if (!sigResponse.ok) { throw new Error('Failed to get upload signature.'); }
      const sigData = await sigResponse.json();
      signature = sigData.signature;
      timestamp = sigData.timestamp;
    } catch (error) {
      setIsSubmitting(false);
      setMessage({ type: 'error', text: `Step 1 Error: ${error.message}` });
      return;
    }
    try {
      // ... (PART 2: UPLOAD TO CLOUDINARY - no changes) ...
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY);
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Error from Cloudinary:", errorText);
        throw new Error('Failed to upload image. Check credentials.');
      }
      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.secure_url;

      // --- (PART 3: SUBMIT TO OUR BACKEND - UPDATED) ---
      const reportResponse = await fetch('/api/submitReport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          imageUrl,
          incidentTime: new Date(incidentTime), // <-- NEW
          duration, // <-- NEW
        }),
      });
      if (!reportResponse.ok) {
        throw new Error('Failed to submit report. Check server logs.');
      }
      
      setIsSubmitting(false);
      setMessage({ type: 'success', text: 'Report submitted successfully!' });
      setDescription('');
      setLatitude('');
      setLongitude('');
      setFile(null);
      setDuration('unknown');
      e.target.reset();

    } catch (error) {
      setIsSubmitting(false);
      setMessage({ type: 'error', text: `Step 2/3 Error: ${error.message}` });
    }
  };

  // --- Session Check (no change) ---
  if (status === 'loading') {
    return <p className="text-center p-10 text-white">Loading...</p>;
  }
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="p-10 text-center bg-slate-800 rounded-lg shadow-md">
          <p className="text-white">You must be logged in to submit a report.</p>
          <button 
            onClick={() => signIn()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // --- Render the form ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-slate-800 rounded-lg shadow-lg w-full max-w-md"
      >
        <h1 className="mb-6 text-2xl font-semibold text-center text-white">
          Submit New Hazard Report
        </h1>

        {message && (
          <div 
            className={`p-3 mb-4 text-sm rounded-md ${
              message.type === 'success' 
                ? 'text-green-700 bg-green-100' 
                : 'text-red-700 bg-red-100'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-slate-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white"
            placeholder="e.g., Heavy flooding at Main St intersection"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-slate-300">
            Upload Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
            className="w-full text-sm text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-700 file:text-white
              hover:file:bg-blue-600"
          />
        </div>

        {/* --- NEW FIELDS: Incident Time & Duration --- */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Incident Time
            </label>
            <input
              type="datetime-local"
              value={incidentTime}
              onChange={(e) => setIncidentTime(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Est. Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white"
            >
              <option value="unknown">Unknown</option>
              <option value="hours">A few hours</option>
              <option value="days">A few days</option>
              <option value="long-term">Long-term</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-slate-300">
            Location
          </label>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isFetchingLocation}
            className="w-full py-2 px-4 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
          >
            {isFetchingLocation ? 'Fetching...' : 'Get My Current Location'}
          </button>
        </div>
        
        <div className="flex gap-4 mb-6">
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white"
            placeholder="Latitude"
          />
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white"
            placeholder="Longitude"
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}