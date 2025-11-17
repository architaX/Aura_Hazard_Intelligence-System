import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.status === 409) {
        throw new Error('A user with this email already exists.');
      }
      if (!response.ok) {
        throw new Error('Registration failed. Please try again.');
      }

      // Success!
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000); // Wait 2 seconds and redirect

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-slate-800 rounded-lg shadow-lg w-96"
      >
        <h1 className="mb-6 text-2xl font-semibold text-center text-white">
          Create Your Account
        </h1>
        
        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md">
            {success}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-slate-300">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white"
            placeholder="Your Name"
          />
        </div>
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
            placeholder="user@example.com"
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
            placeholder="Min. 6 characters"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          disabled={!!success} // Disable button on success
        >
          {success ? 'Registered!' : 'Create Account'}
        </button>
        <p className="mt-4 text-sm text-center text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            Log In
          </Link>
        </p>
      </form>
    </div>
  );
}