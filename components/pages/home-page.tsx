'use client';
import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { ModeToggle } from '../elements/toggle-mode';
import { simulateLLMStreaming } from '@/lib/generator';
import { CircleSlash, RotateCcw, LogOut } from 'lucide-react';
import { Input } from '../ui/input';
import { ModelOptions } from '../elements/model-options';
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm'
import { useLLMStore } from '@/store/llm-store';
import { simulatedResponse } from '@/helper/helper';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export default function HomePage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const streamingOptions = useRef<{ stop: boolean }>({ stop: false });

  const model = useLLMStore().selectedModel

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  const handleSendMessage = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    streamingOptions.current.stop = false;
    let assistantResponse = '';

    for await (const chunk of simulateLLMStreaming(simulatedResponse, { delayMs: 200, chunkSize: 12, stop: streamingOptions.current.stop })) {
      if (streamingOptions.current.stop) break;
      assistantResponse += chunk;
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === 'assistant') {
          newMessages[newMessages.length - 1].content = assistantResponse;
        } else {
          newMessages.push({ role: 'assistant', content: assistantResponse });
        }
        return newMessages;
      });
    }
    setInput('');

    setLoading(false);
  };

  const handleStop = () => {
    streamingOptions.current.stop = true;
    setLoading(false);
  };


  return (
    <div className="flex h-[100dvh]">
      {/* Left sidebar with AI responses */}
      <div className="w-64 border-r bg-background p-4">
        <div className="flex flex-col space-y-2">
          {messages.filter(m => m.role === 'assistant').map((message, index) => (
            <Button
              key={index}
              variant={activeTab === index ? "secondary" : "ghost"}
              className="justify-start text-left"
              onClick={() => setActiveTab(index)}
            >
              Response {index + 1}
            </Button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top navigation bar */}
        <div className="border-b p-4 flex justify-between items-center">
          <h1 className="font-bold text-2xl">{model.length ? model : 'Chat with me'}</h1>
          <div className="flex items-center gap-4">
            {/* User messages dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">User Messages</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px]">
                <DropdownMenuLabel>Chat History</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {messages.filter(m => m.role === 'user').map((message, index) => (
                  <DropdownMenuItem key={index} className="whitespace-normal">
                    {message.content}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ModeToggle />
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500">No messages yet.</div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.filter(m => m.role === 'assistant')[activeTab] && (
                <div className="p-4 rounded-lg bg-secondary">
                  <Markdown className='prose dark:prose-invert prose-h1:text-xl prose-sm' remarkPlugins={[remarkGfm]}>
                    {messages.filter(m => m.role === 'assistant')[activeTab].content}
                  </Markdown>
                </div>
              )}
            </div>
          )}
        </div>

      <div className="max-w-xl w-full fixed bottom-5 left-1/2 transform -translate-x-1/2">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage() }} className="flex flex-row w-full items-center gap-2">
          <ModelOptions />
          <Input
            placeholder="Type your message here."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type='submit' disabled={loading || !input.length}>
            {loading ? 'Sending...' : 'Send message'}
          </Button>
        </form>
      </div>
    </div>
    </div>
  );
}