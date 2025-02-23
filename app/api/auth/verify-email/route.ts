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
      if(!process.env.JWT_SECRET) {
        return NextResponse.json(
          { error: 'JWT_SECRET is not set' },
          { status: 500 }
        );
      }
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string };

      if(!decoded.email) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 400 }
        );
      }
      
      // Update user's email verification status
      await prisma.user.update({
        where: { email: decoded.email },
        data: { emailVerified: new Date() },
      });

      if(!process.env.NEXTAUTH_URL) {
        return NextResponse.json(
          { error: 'NEXTAUTH_URL is not set' },
          { status: 500 }
        );
      }
      // Redirect to success page
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/email-verified`);
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 