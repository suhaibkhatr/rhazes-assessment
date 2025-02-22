import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/primsa';


export async function GET() {

    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }
        // get the chats
        const chats = await prisma.chat.findMany({
            where: {
                userId: user.id
            }
        });

        const starredPrompts = await prisma.prompt.findMany({
            where: {
                isStarred: true,
                chatId: { in: chats.map((chat) => chat.id) }
            },
            orderBy: {
                starredAt: 'desc'
            }
        });

        return NextResponse.json(starredPrompts);
    } catch (error) {
        console.error('Error fetching starred prompts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch starred prompts' },
            { status: 500 }
        );
    }
} 