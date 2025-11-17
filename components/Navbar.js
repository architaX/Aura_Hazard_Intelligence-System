import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="p-4 bg-slate-700 rounded-lg shadow-md">
      <ul className="space-y-2">
        
        {/* --- Guest Links (Not Logged In) --- */}
        {status !== 'loading' && !session && (
          <>
            <li>
              <Link href="/login" className="block w-full py-2 px-3 text-center text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Login
              </Link>
            </li>
            <li>
              <Link href="/register" className="block w-full py-2 px-3 text-center text-white bg-green-600 rounded-md hover:bg-green-700">
                Register
              </Link>
            </li>
          </>
        )}
        
        {/* --- User/Admin Links (Logged In) --- */}
        {session && (
          <>
            <li className="text-white text-sm px-1">
              Welcome, {session.user.name}!
            </li>
            
            {/* Show Admin or User button */}
            {session.user.role === 'admin' ? (
              <li>
                <Link href="/admin" className="block w-full py-2 px-3 text-center text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                  Admin Dashboard
                </Link>
              </li>
            ) : (
              <li>
                <Link href="/report" className="block w-full py-2 px-3 text-center text-white bg-green-600 rounded-md hover:bg-green-700">
                  Submit Report
                </Link>
              </li>
            )}
            
            <li>
              <button
                onClick={handleSignOut}
                className="w-full py-2 px-3 text-center text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Sign Out
              </button>
            </li>
          </>
        )}

        {/* --- General Links (Always Show) --- */}
        <hr className="border-slate-600 my-2" />
        {/* "Home (Map)" link has been removed */}
        <li>
          <Link href="/about" className="block py-2 px-3 text-slate-300 hover:bg-slate-600 rounded-md">
            About Aura
          </Link>
        </li>
        
      </ul>
    </nav>
  );
}