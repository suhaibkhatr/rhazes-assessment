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
import withAuth from "./withAuth";
import { signOut } from "next-auth/react";

interface Message {
  role: 'ai' | 'user';
  content: string;
}

function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const streamingOptions = useRef<{ stop: boolean }>({ stop: false });
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const model = useLLMStore().selectedModel;

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setCurrentResponse('');
    streamingOptions.current.stop = false;

    // Add user message immediately
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Start streaming AI response
    let fullResponse = '';
    for await (const chunk of simulateLLMStreaming(simulatedResponse, { delayMs: 200, chunkSize: 12, stop: streamingOptions.current.stop })) {
      if (streamingOptions.current.stop) break;
      fullResponse += chunk;
      setCurrentResponse(fullResponse);
      scrollToBottom();
    }

    // Add AI response to messages
    if (fullResponse) {
      const aiMessage: Message = { role: 'ai', content: fullResponse };
      setMessages(prev => [...prev, aiMessage]);
      setCurrentResponse('');
    }

    setLoading(false);
    scrollToBottom();
  };

  const handleStop = () => {
    streamingOptions.current.stop = true;
    setLoading(false);
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentResponse('');
  };

  return (
    <div className="max-w-7xl relative mx-auto h-[100dvh] flex flex-col justify-between p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          onClick={() => signOut({ callbackUrl: "/login" })}
          variant="outline"
          size="icon"
          className="mr-2"
        >
          <LogOut className="h-[1.2rem] w-[1.2rem]" />
        </Button>
        <ModeToggle />
      </div>

      <h1 className="font-bold text-2xl text-center mt-4">{model.length ? model : 'Chat with me'}</h1>

      <div 
        ref={chatContainerRef}
        className="flex-1 w-full max-w-3xl mx-auto my-8 p-4 border rounded-lg overflow-y-auto space-y-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white ml-auto'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Markdown 
                className='prose dark:prose-invert prose-sm max-w-none'
                remarkPlugins={[remarkGfm]}
              >
                {message.content}
              </Markdown>
            </div>
          </div>
        ))}
        
        {currentResponse && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Markdown 
                className='prose dark:prose-invert prose-sm max-w-none'
                remarkPlugins={[remarkGfm]}
              >
                {currentResponse}
              </Markdown>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-3xl mx-auto mb-4">
        <div className="flex justify-end mb-2 gap-2">
          {loading && (
            <Button onClick={handleStop} variant="outline" size="sm">
              <CircleSlash className="mr-2 h-4 w-4" />
              Stop
            </Button>
          )}
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            disabled={loading || (!messages.length && !currentResponse)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex flex-row w-full items-end gap-2">
          <ModelOptions />
          <Input
            placeholder="Type your message here."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type='submit' disabled={loading || !input.trim()}>
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default withAuth(HomePage);