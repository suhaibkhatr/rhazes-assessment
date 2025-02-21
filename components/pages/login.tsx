// filepath: /Users/suhaibkhater/Downloads/tech-assessment-main/pages/login.tsx
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h1 className="mb-4 text-2xl font-bold text-center text-gray-900 dark:text-white">
          Sign in to your account
        </h1>
        <button
          onClick={() => signIn("google")}
          className="w-full px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}