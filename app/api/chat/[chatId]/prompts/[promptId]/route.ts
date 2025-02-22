import { NextResponse } from 'next/server';
import prisma from '@/lib/primsa';
import { getServerSession } from 'next-auth';

export async function PATCH(request: Request, context: { params: Promise<{ chatId: string; promptId: string }> }) {
  try {
    // Await the params promise
    const params = await context.params;
    const { chatId, promptId } = params;

    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { response, isStarred } = await request.json();

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: {
        id: parseInt(chatId), // assuming chatId is a string and matches your schema type
        userId: user.id,
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    // Update the prompt
    const updatedPrompt = await prisma.prompt.update({
      where: {
        id: parseInt(promptId), // assuming promptId is a string
        chatId: chat.id,
      },
      data: {
        ...(response !== undefined && { response }),
        ...(isStarred !== undefined && { isStarred }),
      },
    });

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
