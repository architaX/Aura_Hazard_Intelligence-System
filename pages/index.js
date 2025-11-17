import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import Layout from '@/components/Layout'; // <-- Import our new Layout

export default function Home() {
  
  // 1. Dynamically import the Map
  const Map = useMemo(() => dynamic(
    () => import('@/components/Map'), // This is the path to your map component
    { 
      // Updated loading text color for the dark theme
      loading: () => <p className="flex items-center justify-center h-full text-white">Loading map...</p>,
      ssr: false // No Server-Side Rendering
    }
  ), []);

  // 2. Render the page
  return (
    // Wrap the Map component with our new Layout
    <Layout>
      <Map />
    </Layout>
  );
}