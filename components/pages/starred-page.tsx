'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/elements/toggle-mode";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';

type StarredPrompt = {
  id: string;
  createdAt: Date;
  message: {
    content: string;
    model: string;
    role: string;
  };
};

export default function StarredPage() {
  const [starredPrompts, setStarredPrompts] = useState<StarredPrompt[]>([]);

  useEffect(() => {
    // In a real application, this would fetch from your API
    // For now, we'll use mock data
    const mockData: StarredPrompt[] = [
      {
        id: '1',
        createdAt: new Date(),
        message: {
          content: 'This is a sample starred prompt',
          model: 'Model 1',
          role: 'assistant'
        }
      }
    ];
    setStarredPrompts(mockData);
  }, []);

  return (
    <div className="max-w-7xl relative mx-auto min-h-[100dvh] p-8">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <h1 className="text-3xl font-bold mb-8">Starred Prompts</h1>

      <div className="grid gap-6">
        {starredPrompts.map((prompt) => (
          <div key={prompt.id} className="border rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {new Date(prompt.createdAt).toLocaleDateString()}
              </span>
              <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                {prompt.message.model}
              </span>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <Markdown 
                className='prose dark:prose-invert max-w-none' 
                remarkPlugins={[remarkGfm]}
              >
                {prompt.message.content}
              </Markdown>
            </div>
          </div>
        ))}

        {starredPrompts.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No starred prompts yet.
          </div>
        )}
      </div>
    </div>
  );
}