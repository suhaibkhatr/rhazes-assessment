'use client';
import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { ModeToggle } from '../elements/toggle-mode';
import { simulateLLMStreaming } from '@/lib/generator';
import { CircleSlash, LogOut, MessageSquare } from 'lucide-react';
import { Input } from '../ui/input';
import { ModelOptions } from '../elements/model-options';
import Markdown from "react-markdown";
import { useLLMStore } from '@/store/llm-store';
import { simulatedResponse } from '@/helper/helper';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '../ui/dropdown-menu';

interface Chat {
  id: number;
  name: string;
  messages: {
    user_input: string;
    answer: string;
  }[];
}

function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Add session check
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
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
    streamingOptions.current.stop = false;
    const currentInput = input;
    setInput('');

    // Create new chat if none is selected
    let currentChat = activeChat;
    if (!currentChat) {
      const newChat: Chat = {
        id: chats.length + 1,
        name: currentInput.substring(0, 30) + '...',
        messages: []
      };
      setChats(prev => [...prev, newChat]);
      currentChat = newChat;
      setActiveChat(newChat);
    }

    // Add user message immediately
    const updatedMessages = [...currentChat.messages, { user_input: currentInput, answer: '' }];
    updateChat(currentChat.id, { ...currentChat, messages: updatedMessages });

    let fullResponse = '';
    for await (const chunk of simulateLLMStreaming(simulatedResponse, { delayMs: 200, chunkSize: 12, stop: streamingOptions.current.stop })) {
      if (streamingOptions.current.stop) break;
      fullResponse += chunk;
      setCurrentResponse(fullResponse);
      scrollToBottom();
    }

    // Update the last message with the AI response
    const finalMessages = updatedMessages.map((msg, idx) => 
      idx === updatedMessages.length - 1 ? { ...msg, answer: fullResponse } : msg
    );
    updateChat(currentChat.id, { ...currentChat, messages: finalMessages });

    setCurrentResponse('');
    setLoading(false);
    scrollToBottom();
  };

  const updateChat = (chatId: number, updatedChat: Chat) => {
    setChats(prev => prev.map(chat => chat.id === chatId ? updatedChat : chat));
    setActiveChat(updatedChat);
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: chats.length + 1,
      name: `New Chat ${chats.length + 1}`,
      messages: []
    };
    setChats(prev => [...prev, newChat]);
    setActiveChat(newChat);
    setInput('');
    setCurrentResponse('');
  };

  const handleStop = () => {
    streamingOptions.current.stop = true;
    setLoading(false);
  };

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return null;

  return (
    <div className="flex h-[100dvh]">
      {/* Left sidebar - always dark */}
      <div className="flex-none w-[260px] bg-[#202123] text-white p-2">
        <Button
          onClick={createNewChat}
          className="w-full mb-4 flex items-center gap-3 border border-white/20 hover:bg-[#2A2B32]"
          variant="ghost"
        >
          <MessageSquare className="h-4 w-4" />
          New Chat
        </Button>
        
        <div className="space-y-2 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`w-full text-left p-3 rounded transition-colors flex items-center gap-3
                ${activeChat?.id === chat.id
                  ? 'bg-[#343541] hover:bg-[#343541]'
                  : 'hover:bg-[#2A2B32]'}`}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <div className="truncate text-sm">{chat.name}</div>
            </button>
          ))}
        </div>

        {/* Bottom section with user info */}
        <div className="absolute bottom-0 left-0 w-[260px] p-2 border-t border-white/20">
          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            variant="ghost"
            className="w-full justify-start text-sm text-white hover:bg-[#2A2B32]"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Header - only dark mode toggle */}
        <div className="border-b border-gray-200 dark:border-gray-700/50 p-2 flex justify-end bg-white dark:bg-gray-800">
          <ModeToggle />
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800" ref={chatContainerRef}>
          <div className="max-w-3xl mx-auto">
            {activeChat?.messages.map((message, index) => (
              <div key={index} className="space-y-4 py-4">
                {/* User message - Right side */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] flex gap-6 items-start">
                    <div className="min-w-0">
                      <div className="bg-blue-500 text-white p-6 rounded-2xl">
                        <Markdown className="prose dark:prose-invert prose-sm max-w-none">
                          {message.user_input}
                        </Markdown>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0" />
                  </div>
                </div>

                {/* AI message - Left side */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] flex gap-6 items-start">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-2xl">
                        <Markdown className="prose dark:prose-invert prose-sm max-w-none">
                          {message.answer || (index === activeChat.messages.length - 1 ? currentResponse : '')}
                        </Markdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800">
          <div className="max-w-3xl mx-auto p-6">
            <div className="flex justify-end mb-2">
              {loading && (
                <Button onClick={handleStop} variant="outline" size="sm">
                  <CircleSlash className="mr-2 h-4 w-4" />
                  Stop generating
                </Button>
              )}
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
              className="flex items-end gap-3 relative"
            >
              <ModelOptions className="flex-none" />
              <div className="relative flex-1">
                <Input
                  placeholder="Message ChatGPT..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="pr-12 py-6 resize-none bg-white dark:bg-gray-700 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button 
                  type='submit' 
                  disabled={loading || !input.trim()}
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8 bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className="h-4 w-4 m-1">
                    <path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z" fill="currentColor"></path>
                  </svg>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;