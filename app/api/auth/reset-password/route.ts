import { NextResponse } from 'next/server';
import prisma from '@/lib/primsa';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { email: string };

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: decoded.email },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ message: 'Password reset successful' });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}