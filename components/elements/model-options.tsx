'use client'
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLLMStore } from "@/store/llm-store"

interface ModelOption {
  name: string;
  description: string;
}

const modelOptions: Record<string, ModelOption[]> = {
  'GPT Models': [
    { name: 'GPT-4', description: 'Most capable model, best for complex tasks' },
    { name: 'GPT-3.5 Turbo', description: 'Fast and efficient for most tasks' },
  ],
  'Open Source Models': [
    { name: 'Llama 2', description: 'Meta\'s open source LLM' },
    { name: 'Claude 2', description: 'Anthropic\'s latest model' },
    { name: 'Mistral', description: 'Efficient open source model' },
  ],
  'Specialized Models': [
    { name: 'Code-Llama', description: 'Optimized for code generation' },
    { name: 'PaLM 2', description: 'Google\'s language model' },
  ]
}

interface ModelOptionsProps {
  className?: string;
}

export function ModelOptions({ className }: ModelOptionsProps) {
  const { selectedModel, setSelectedModel } = useLLMStore()

  // Set default model if none is selected
  React.useEffect(() => {
    if (!selectedModel) {
      setSelectedModel('GPT-3.5 Turbo')
    }
  }, [])

  const handleSelectModel = (model: string) => {
    setSelectedModel(model)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[140px]">
          {selectedModel || 'Select Model'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Select LLM Model</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(modelOptions).map(([category, models]) => (
          <React.Fragment key={category}>
            <DropdownMenuLabel className="text-sm text-muted-foreground px-2 py-1.5">
              {category}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {models.map((model) => (
                <DropdownMenuItem
                  key={model.name}
                  onSelect={() => handleSelectModel(model.name)}
                  className="flex flex-col items-start"
                >
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}