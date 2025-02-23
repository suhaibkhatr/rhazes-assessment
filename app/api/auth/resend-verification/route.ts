import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/primsa';
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
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    if(!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'JWT_SECRET is not set' },
        { status: 500 }
      );
    }
    
    if(!process.env.NEXTAUTH_URL) {
      return NextResponse.json(
        { error: 'NEXTAUTH_URL is not set' },
        { status: 500 }
      );
    }

    // Generate a new verification token
    const token = jwt.sign({ email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    const verifyLink = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Verify Your Email',
      html: `<p>Please verify your email by clicking the link below:</p>
              <a href="${verifyLink}">Verify Email</a>`,
    });

    return NextResponse.json(
      { message: 'Verification email sent' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 