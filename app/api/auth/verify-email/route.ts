import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/primsa';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string };

      // Update user's email verification status
      await prisma.user.update({
        where: { email: decoded.email },
        data: { emailVerified: new Date() },
      });

      // Redirect to success page
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_URL}/auth/email-verified`);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: 'Verification link has expired' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 