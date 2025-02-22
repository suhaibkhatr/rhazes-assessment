import prisma from '@/lib/primsa';
import { getServerSession } from 'next-auth';
import { ModelFactory } from '@/helper/AImodels/model-factory';
import type { ModelName } from '@/helper/AImodels/model-interface';

export async function POST(
    request: Request,
    context: { params: Promise<{ promptId: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return new Response('Unauthorized', { status: 401 });
        }

        const params = await context.params;
        const { promptId } = params;

        const prompt = await prisma.prompt.findUnique({
            where: { 
                id: parseInt(promptId),
            }
        });

        if (!prompt) {
            return new Response('Prompt not found', { status: 404 });
        }

        // Set up streaming response
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Start processing in the background
        (async () => {
            try {
                const model = ModelFactory.createModel(prompt.modelName as ModelName);
                
                for await (const { text, fullResponse } of model.generateStream(prompt.prompt)) {
                    await writer.write(encoder.encode(text));
                    
                    // Update the prompt with the complete response after the last chunk
                    if (fullResponse) {
                        await prisma.prompt.update({
                            where: { id: prompt.id },
                            data: { response: fullResponse }
                        });
                    }
                }
            } catch (error) {
                console.error('Error generating response:', error);
                await writer.write(encoder.encode('Error generating response'));
            } finally {
                await writer.close();
            }
        })();

        return new Response(stream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Error in stream route:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
} 