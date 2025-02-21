'use client';

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ModeToggle } from "@/components/elements/toggle-mode";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn("credentials", {
        username: formData.username,
        password: formData.password,
        redirect: true,
        callbackUrl: "/"
      });
    } catch (error) {
      console.error("Login error:", error);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h1 className="mb-6 text-2xl font-bold text-center text-gray-900 dark:text-white">
            Sign in to your account
          </h1>

          <div className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-md">
                {error}
              </div>
            )}
            
            {/* Test Account Login */}
            <form onSubmit={handleTestLogin} className="space-y-3">
              <Input
                type="text"
                name="username"
                placeholder="Username (test)"
                value={formData.username}
                onChange={handleInputChange}
                autoComplete="username"
                required
              />
              <Input
                type="password"
                name="password"
                placeholder="Password (test)"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="current-password"
                required
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in with Test Account"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white dark:bg-gray-800">Or continue with</span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full bg-blue-500 hover:bg-blue-600"
              disabled={isLoading}
            >
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}