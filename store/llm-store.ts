import { create } from 'zustand'

interface AIModel {
    id: number
    model: string
}
interface LLMStore {
    selectedModel: {
        id: number
        model: string
    }
    setSelectedModel: (model: AIModel) => void
}

export const useLLMStore = create<LLMStore>((set) => ({
    selectedModel: {
        id: 0,
        model: '',
    },
    setSelectedModel: (model) => set({ selectedModel: model }),
}))