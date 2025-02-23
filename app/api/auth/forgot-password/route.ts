import { NextResponse } from 'next/server';
import prisma from '@/lib/primsa';
import jwt from 'jsonwebtoken';
import { sendEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

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