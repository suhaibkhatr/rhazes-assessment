'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/elements/toggle-mode";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password strength validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Add success toast
      toast({
        title: "Registration successful!",
        description: "Please check your email for verification instructions.",
        duration: 5000,
      });

      // Optional: Redirect to login page after a delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error) {
      setError('An error occurred during registration');
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
          <h1 className="mb-8 text-3xl font-bold text-center text-gray-900 dark:text-white transition-colors">
            Create Account
          </h1>

          <div className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 transition-all duration-200">
                {error}
              </div>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="transition-all duration-200 hover:border-blue-400 focus:border-blue-500"
                disabled={isLoading}
              />
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="transition-all duration-200 hover:border-blue-400 focus:border-blue-500"
                disabled={isLoading}
              />
              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="transition-all duration-200 hover:border-blue-400 focus:border-blue-500"
                disabled={isLoading}
              />
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm mt-6">
              <span className="text-gray-500 dark:text-gray-400">Already have an account? </span>
              <a href="/login" className="text-blue-500 hover:text-blue-600 transition-colors duration-200 dark:text-blue-400 dark:hover:text-blue-300">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}