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
  id: number;
  name: string;
  description: string;
}


export function ModelOptions() {
  const { selectedModel, setSelectedModel } = useLLMStore()
  const [modelOptions, setModelOptions] = React.useState<ModelOption[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const models = [
    {
      id: 1,
      name: 'GPT-4',
      description: 'Most capable GPT model, particularly good at tasks that require creativity and advanced reasoning'
    },
    {
      id: 2,
      name: 'GPT-3.5 Turbo',
      description: 'Fast and efficient model for most chat and text generation tasks'
    },
    {
      id: 3,
      name: 'Claude 2',
      description: 'Advanced AI model with strong capabilities in analysis and technical content'
    },
    {
      id: 4,
      name: 'DALL-E 3',
      description: 'Specialized in creating and editing images from natural language descriptions'
    },
    {
      id: 5,
      name: 'PaLM 2',
      description: 'Google\'s language model with strong multilingual capabilities'
    },
    {
      id: 6,
      name: 'Gemini Pro',
      description: 'Google\'s advanced language model with real API integration'
    }
  ]
  
  // Fetch models from the database
  React.useEffect(() => {
    const fetchModels = async () => {
      try {
        setModelOptions(models)
        setIsLoading(false)

        // Set default model if none is selected
        if (models.length > 0) {
          setSelectedModel(models[0].name)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch models')
        setIsLoading(false)
      }
    }

    fetchModels()
  }, [setSelectedModel])

  const handleSelectModel = (model: string) => {
    setSelectedModel(model)
  }

  if (error) {
    return (
      <Button variant="outline" className="min-w-[140px]" disabled>
        Error loading models
      </Button>
    )
  }

  if (isLoading) {
    return (
      <Button variant="outline" className="min-w-[140px]" disabled>
        Loading models...
      </Button>
    )
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
        <DropdownMenuGroup>
          {modelOptions.map((model) => (
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}