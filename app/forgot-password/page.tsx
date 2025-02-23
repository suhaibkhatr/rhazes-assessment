'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/elements/toggle-mode';
import { Loader2, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setMessage('Check your email for reset instructions');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg dark:bg-gray-800 transition-all duration-200 hover:shadow-xl">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email to receive reset instructions
            </p>
          </div>

          {message && <div className="mt-4 p-4 text-sm text-green-500 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 transition-all duration-200">{message}</div>}
          {error && <div className="mt-4 p-4 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 transition-all duration-200">{error}</div>}

          <div className="mt-6 space-y-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-200 hover:border-blue-400 focus:border-blue-500"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  className="w-full relative"
                  disabled={isLoading}
                  variant="default"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="text-center">
              <Link 
                href="/login" 
                className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors duration-200 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}