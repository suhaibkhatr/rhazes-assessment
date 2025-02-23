import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/primsa';
import { sendEmail } from '@/lib/mail';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

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

    // Generate a verification token valid for 1 hour
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
      { message: 'User registered. Check your email to verify your account.' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}