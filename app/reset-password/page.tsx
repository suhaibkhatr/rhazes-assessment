'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/elements/toggle-mode';
import { Loader2, Lock } from 'lucide-react';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('No reset token provided');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error);
        }

        setIsValidToken(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid or expired reset token');
        // Redirect to forgot password page after a delay
        setTimeout(() => {
          router.push('/forgot-password');
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.password !== passwords.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwords.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: searchParams.get('token'), password: passwords.password })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setMessage('Password reset successful');
      setError('');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  if (isLoading) {
    return <div>Verifying reset token...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <p>Redirecting to forgot password page...</p>
      </div>
    );
  }

  if (!isValidToken) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg dark:bg-gray-800 transition-all duration-200 hover:shadow-xl">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your new password
            </p>
          </div>

          {message && <div className="mt-4 p-4 text-sm text-green-500 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 transition-all duration-200">{message}</div>}
          {error && <div className="mt-4 p-4 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 transition-all duration-200">{error}</div>}

          <div className="mt-6 space-y-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  type="password"
                  name="password"
                  placeholder="New password"
                  value={passwords.password}
                  onChange={handleInputChange}
                  required
                  className="transition-all duration-200 hover:border-blue-400 focus:border-blue-500"
                  disabled={isLoading}
                />
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={passwords.confirmPassword}
                  onChange={handleInputChange}
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
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Reset Password
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