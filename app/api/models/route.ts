import { NextResponse } from 'next/server';
import prisma from '@/lib/primsa';

export async function GET() {
  try {
    // Fetch all models from the database
    const models = await prisma.aIModel.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      }
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}