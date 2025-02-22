export interface StreamingModel {
    generateStream(prompt: string): AsyncGenerator<{ text: string; fullResponse: string }>;
}

export type ModelName = 'Gemini Pro' | 'Default'; 