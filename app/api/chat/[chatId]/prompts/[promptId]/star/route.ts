import { NextResponse } from 'next/server';
import prisma  from '@/lib/primsa';

export async function PATCH(request: Request, context: { params: Promise<{ chatId: string; promptId: string }> }) {
  try {
    // Await the params promise
    const params = await context.params;
    const { chatId, promptId } = params;
    const { isStarred } = await request.json();

    // Toggle the isStarred status
    const updatedPrompt = await prisma.prompt.update({
      where: {
        id: parseInt(promptId),
        chatId: parseInt(chatId)
      },
      data: {
        isStarred: isStarred,
        starredAt: isStarred ? new Date() : null
      }
    });

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error('Error updating prompt star status:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt star status' },
      { status: 500 }
    );
  }
}