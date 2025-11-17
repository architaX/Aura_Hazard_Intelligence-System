import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); 

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      const session = await getSession(); 
      if (session && session.user) {
        if (session.user.role === 'admin') {
          router.push('/admin'); // Admin goes to dashboard
        } else {
          router.push('/report'); // User goes to submission form
        }
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-slate-800 rounded-lg shadow-lg w-96"
      >
        <h1 className="mb-6 text-2xl font-semibold text-center text-white">
          Aura Login
        </h1>
        
        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white"
            placeholder="admin@test.com"
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-slate-300">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white"
            placeholder="password123"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}