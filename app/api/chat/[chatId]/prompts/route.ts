import { NextResponse } from 'next/server';
import prisma from '@/lib/primsa';
import { getServerSession } from 'next-auth';

//Promise<{ chatId: number; promptId: number }>
//context: { params: Promise<{ chatId: stringr }> }
export async function POST(request: Request, context: { params: Promise<{ chatId: string }> }) {
    try {
        const params = await context.params;
        const { chatId } = params;

        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { user_input, modelName } = await request.json();

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

        // Verify chat ownership
        const chat = await prisma.chat.findFirst({
            where: {
                id: parseInt(chatId),
                userId: user.id
            }
        });

        if (!chat) {
            return NextResponse.json(
                { error: 'Chat not found or unauthorized' },
                { status: 404 }
            );
        }

        // Create a new prompt
        const newPrompt = await prisma.prompt.create({
            data: {
                prompt: user_input,
                response: '',
                isStarred: false,
                chatId: chat.id,
                modelName: modelName
            }
        });

        return NextResponse.json(newPrompt);
    } catch (error) {
        console.error('Error creating prompt:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}