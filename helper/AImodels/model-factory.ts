import { StreamingModel, ModelName } from './model-interface';
import { GeminiModel } from './gemini-model';
import { DefaultModel } from './default-model';

export class ModelFactory {
    static createModel(modelName: ModelName): StreamingModel {
        switch (modelName) {
            case 'Gemini Pro':
                return new GeminiModel();
            default:
                return new DefaultModel();
        }
    }
} 