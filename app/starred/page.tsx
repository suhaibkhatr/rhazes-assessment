'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Star, ArrowLeft, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from 'next/navigation';

interface StarredPrompt {
  id: string;
  prompt: string;
  response: string;
  chatId: number;
  modelName: string;
  createdAt: string;
  starredAt: string;
}

export default function StarredPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [starredPrompts, setStarredPrompts] = useState<StarredPrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<StarredPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const { toast } = useToast();

  // Get unique models from prompts
  const uniqueModels = Array.from(new Set(starredPrompts.map(prompt => prompt.modelName)));

  useEffect(() => {
    const fetchStarredPrompts = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/starred');
          const data = await response.json();
          setStarredPrompts(data);
          setFilteredPrompts(data);
        } catch (error) {
          console.error('Error fetching starred prompts:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (status === "unauthenticated") {
      router.push("/login");
    }
    
    fetchStarredPrompts();
  }, [session, status, router]);

  // Filter prompts when model selection changes
  useEffect(() => {
    if (selectedModel === 'all') {
      setFilteredPrompts(starredPrompts);
    } else {
      setFilteredPrompts(starredPrompts.filter(prompt => prompt.modelName === selectedModel));
    }
  }, [selectedModel, starredPrompts]);

  const togglePrompt = (promptId: string) => {
    setExpandedPrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  const unstarPrompt = async (promptId: string) => {
    try {
      const response = await fetch(`/api/prompt/${promptId}/star`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isStarred: false
        })
      });

      if (!response.ok) throw new Error('Failed to unstar prompt');

      // Remove the prompt from the local state
      setStarredPrompts(prev => prev.filter(p => p.id !== promptId));

      // Show success toast
      toast({
        title: "Prompt unstarred",
        description: "The prompt has been removed from your starred collection",
        variant: "default",
        duration: 3000,
      });

    } catch (error) {
      console.error('Error unstarring prompt:', error);
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to unstar the prompt. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Starred Prompts</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {uniqueModels.map(model => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-500">
              {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt' : 'prompts'} starred
            </div>
          </div>
        </div>

        {filteredPrompts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Star className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {selectedModel === 'all' 
                ? 'No starred prompts yet'
                : `No starred prompts for ${selectedModel}`
              }
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {selectedModel === 'all'
                ? 'Star your favorite prompts to access them quickly here'
                : 'Try selecting a different model or view all prompts'
              }
            </p>
            {selectedModel === 'all' ? (
              <Link href="/">
                <Button variant="outline">
                  Return to Chat
                </Button>
              </Link>
            ) : (
              <Button 
                variant="outline"
                onClick={() => setSelectedModel('all')}
              >
                View All Prompts
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrompts.map((prompt) => {
              const isExpanded = expandedPrompts.has(prompt.id);
              return (
                <div 
                  key={prompt.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
                >
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unstarPrompt(prompt.id);
                      }}
                      className="absolute right-4 top-4 p-2 rounded-full 
                        hover:bg-gray-100 dark:hover:bg-gray-700 
                        opacity-0 group-hover:opacity-100 transition-opacity z-10
                        border-2 border-yellow-400 hover:border-red-400
                        bg-white dark:bg-gray-800
                        shadow-sm hover:shadow-md
                        transform hover:scale-105 transition-all duration-200"
                      title="Unstar prompt"
                    >
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 
                        hover:text-red-400 hover:fill-red-400 transition-colors" 
                      />
                    </button>

                    <button
                      onClick={() => togglePrompt(prompt.id)}
                      className="w-full text-left p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                          {prompt.modelName}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">
                            {new Date(prompt.starredAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Input</h3>
                          <p className="text-gray-900 dark:text-gray-100">
                            {isExpanded ? prompt.prompt : truncateText(prompt.prompt)}
                          </p>
                        </div>
                        {isExpanded && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Response</h3>
                            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                              {prompt.response}
                            </p>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 