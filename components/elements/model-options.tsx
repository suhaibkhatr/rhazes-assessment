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

interface ModelOptionsResponse {
  id: number;
  name: string;
  description: string;
}


interface AIModel {
  id: number
  model: string
}

export function ModelOptions() {
  const { selectedModel, setSelectedModel } = useLLMStore()
  const [modelOptions, setModelOptions] = React.useState<ModelOption[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch models from the database
  React.useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models')
        if (!response.ok) throw new Error('Failed to fetch models')

        const data: ModelOptionsResponse[] = await response.json()

        // Transform the data into ModelOption array
        const models = data.map(model => ({
          id: model.id,
          name: model.name,
          description: model.description,
        }))

        setModelOptions(models)
        setIsLoading(false)

        // Set default model if none is selected
        if (models.length > 0) {
          setSelectedModel({
            id: models[0].id,
            model: models[0].name,
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch models')
        setIsLoading(false)
      }
    }

    fetchModels()
  }, [setSelectedModel])

  const handleSelectModel = (model: AIModel) => {
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
          {selectedModel.model || 'Select Model'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Select LLM Model</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {modelOptions.map((model) => (
            <DropdownMenuItem
              key={model.name}
              onSelect={() => handleSelectModel({ id: model.id, model: model.name })}
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