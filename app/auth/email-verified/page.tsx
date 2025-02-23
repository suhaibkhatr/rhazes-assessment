export default function EmailVerifiedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Email Verified Successfully!</h1>
        <p className="mb-4">Your email has been verified. You can now log in to your account.</p>
        <a
          href="/login"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
} 