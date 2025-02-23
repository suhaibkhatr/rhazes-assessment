import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/primsa';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string };
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email: decoded.email }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Return success with user email
      return NextResponse.json({
        message: 'Token is valid',
        email: user.email
      });

    } catch (jwtError) {
      // Handle JWT verification errors
      if (jwtError instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: 'Reset token has expired' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}