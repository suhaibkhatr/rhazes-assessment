import prisma from '@/lib/primsa';
import { getServerSession } from 'next-auth';
import { simulateLLMStreaming } from '@/lib/generator';
import { simulatedResponse } from '@/helper/helper';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(
    request: Request,
    context: { params: Promise<{ chatId: string; promptId: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return new Response('Unauthorized', { status: 401 });
        }

        const params = await context.params;
        const { chatId, promptId } = params;

        const prompt = await prisma.prompt.findUnique({
            where: { 
                id: parseInt(promptId),
                chatId: parseInt(chatId)
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
                if (prompt.modelName === 'Gemini Pro') {
                    // Use Gemini's streaming capability
                    const result = await geminiModel.generateContentStream(prompt.prompt);
                    let fullResponse = '';

                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        fullResponse += chunkText;
                        await writer.write(encoder.encode(chunkText));
                    }

                    // Update the prompt with the complete response
                    await prisma.prompt.update({
                        where: { id: prompt.id },
                        data: { response: fullResponse }
                    });
                } else {
                    // Use simulated streaming for other models
                    let fullResponse = '';
                    for await (const chunk of simulateLLMStreaming(simulatedResponse, {
                        delayMs: 100,
                        chunkSize: 10,
                    })) {
                        fullResponse += chunk;
                        await writer.write(encoder.encode(chunk));
                    }
                    
                    // Update the prompt with the full response
                    await prisma.prompt.update({
                        where: { id: prompt.id },
                        data: { response: fullResponse }
                    });
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