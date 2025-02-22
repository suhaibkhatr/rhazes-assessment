import { NextResponse } from 'next/server';
import prisma from '@/lib/primsa';
import { getServerSession } from 'next-auth';

export async function GET() {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user ID from email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Fetch all prompts containers with their prompts and AI model info
        const chatHistory = await prisma.chat.findMany({
            where: { userId: user.id },
            include: {
                prompts: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(chatHistory);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(req : Request) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user ID from email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // get the title from request
        const { title } = await req.json();

        // Create a new chat container
        const newChat = await prisma.chat.create({
            data: {
                title: title ,
                userId: user.id
            }
        });

        return NextResponse.json(newChat);
    } catch (error) {
        console.error('Error creating new chat:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
