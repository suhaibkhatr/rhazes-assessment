import { StreamingModel } from './model-interface';
import { simulateLLMStreaming } from '@/lib/generator';
import { simulatedResponse } from '@/helper/helper';

export class DefaultModel implements StreamingModel {
    async *generateStream(prompt: string) {
        let fullResponse = '';
        
        for await (const chunk of simulateLLMStreaming(simulatedResponse, {
            delayMs: 100,
            chunkSize: 10,
        })) {
            fullResponse += chunk;
            yield { text: chunk, fullResponse };
        }
    }
} 