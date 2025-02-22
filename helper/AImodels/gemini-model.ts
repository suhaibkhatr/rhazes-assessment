import { GoogleGenerativeAI } from "@google/generative-ai";
import { StreamingModel } from './model-interface';

export class GeminiModel implements StreamingModel {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    async *generateStream(prompt: string) {
        try {
            const result = await this.model.generateContentStream(prompt);
            let fullResponse = '';

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullResponse += chunkText;
                yield { text: chunkText, fullResponse };
            }
        } catch (error) {
            console.error('Error in Gemini streaming:', error);
            throw error;
        }
    }
} 