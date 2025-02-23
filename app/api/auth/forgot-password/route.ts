import { NextResponse } from 'next/server';
import prisma from '@/lib/primsa';
import jwt from 'jsonwebtoken';
import { sendEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if(!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'JWT_SECRET is not set' },
        { status: 500 }
      );
    }

    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    if(!process.env.NEXTAUTH_URL) {
      return NextResponse.json(
        { error: 'NEXTAUTH_URL is not set' },
        { status: 500 }
      );
    }

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Password Reset',
      html: `Click <a href="${resetLink}">here</a> to reset your password.`
    });

    return NextResponse.json({ message: 'Reset link sent to email' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 