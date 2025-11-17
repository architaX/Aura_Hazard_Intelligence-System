import Link from 'next/link';

export default function About() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="p-8 bg-slate-800 rounded-lg shadow-lg w-full max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold text-center text-white">
          About Aura
        </h1>
        
        <p className="mb-4 text-slate-300">
          Aura is a public safety platform designed to empower communities by providing 
          real-time, verified hazard intelligence.
        </p>
        
        <h2 className="text-2xl font-semibold text-white mt-6 mb-3">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2 text-slate-300">
          <li>
            <strong>Report:</strong> Authenticated users can submit new hazard reports, 
            including a description, a photo, and the location of the event.
          </li>
          <li>
            <strong>Analyze:</strong> Every submitted image is instantly analyzed by an 
            advanced AI (Clarifai) to check for unsafe content and to generate 
            descriptive labels (e.g., "Flood", "Tree", "Vehicle").
          </li>
          <li>
            <strong>Verify:</strong> An administrator reviews the user's report and the AI 
            analysis in a secure dashboard. They view the image and can then 
            "Verify" the report, confirming it's a real hazard.
          </li>
          <li>
            <strong>Inform:</strong> As soon as a report is "Verified", it appears on 
            the public-facing map for all users to see, helping everyone 
            stay informed and safe.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold text-white mt-6 mb-3">Our Data</h2>
        <p className="text-slate-300">
          Aura combines two types of data:
        </p>
        <ul className="list-disc list-inside space-y-2 text-slate-300 mt-2">
          <li>
            <strong>User-Submitted Reports:</strong> Crowdsourced, real-time alerts 
            from people on the ground.
          </li>
          <li>
            <strong>Official Alerts:</strong> We automatically pull in the latest 
            weather warnings from the India Meteorological Department (IMD) 
            to provide a complete picture of potential hazards.
          </li>
        </ul>

        <div className="text-center mt-8">
          <Link href="/" className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Back to Map
          </Link>
        </div>
      </div>
    </div>
  );
}