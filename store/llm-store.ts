import { create } from 'zustand'

interface LLMStore {
    selectedModel: string
    setSelectedModel: (model: string) => void
}

export const useLLMStore = create<LLMStore>((set) => ({
    selectedModel: "GPT-4",
    setSelectedModel: (model) => set({ selectedModel: model }),
}))