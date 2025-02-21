'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { ModeToggle } from '../elements/toggle-mode';
import { simulateLLMStreaming } from '@/lib/generator';
import { CircleSlash, LogOut, MessageSquare, Smile, Send, Bot, Star } from 'lucide-react';
import { Input } from '../ui/input';
import { ModelOptions } from '../elements/model-options';
import Markdown from "react-markdown";
import { useLLMStore } from '@/store/llm-store';
import { simulatedResponse } from '@/helper/helper';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";

interface Chat {
  id: number;
  name: string;
  messages: {
    user_input: string;
    answer: string;
    is_starred?: boolean;
    model?: string;
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
  const [isTyping, setIsTyping] = useState<boolean>(false);
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

    // Add user message immediately with model information
    const updatedMessages = [...currentChat.messages, { 
      user_input: currentInput, 
      answer: '', 
      is_starred: false,
      model: model // Include the selected model
    }];
    updateChat(currentChat.id, { ...currentChat, messages: updatedMessages });

    let fullResponse = '';
    for await (const chunk of simulateLLMStreaming(simulatedResponse, { 
      delayMs: 200, 
      chunkSize: 12, 
      stop: streamingOptions.current.stop,
    })) {
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

  const toggleStar = (chatId: number, messageIndex: number) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      const updatedMessages = chat.messages.map((msg, idx) => 
        idx === messageIndex ? { ...msg, is_starred: !msg.is_starred } : msg
      );
      updateChat(chatId, { ...chat, messages: updatedMessages });
    }
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
            {(!activeChat || activeChat.messages.length === 0) && (
              <div className="flex flex-col items-center justify-center h-full py-12 space-y-6 text-center">
                <Bot className="w-16 h-16 text-blue-500 animate-bounce" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome to Rhazes AI</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Start a conversation and explore the possibilities of AI-powered chat.
                </p>
              </div>
            )}
            {activeChat?.messages.map((message, index) => (
              <div key={index} className="space-y-6 py-6 animate-fadeIn">
                {/* User message - Right side */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] flex gap-4 items-start">
                    <div className="min-w-0 group relative">
                      <div className="bg-blue-500 text-white px-6 py-4 rounded-2xl shadow-sm transform transition-all duration-300 hover:shadow-md hover:scale-[1.01] group-hover:bg-blue-600">
                        <Markdown className="prose dark:prose-invert prose-sm max-w-none break-words">
                          {message.user_input}
                        </Markdown>
                        {message.model && (
                          <div className="mt-2 text-xs opacity-70 border-t border-white/20 pt-2">
                            Using: {message.model}
                          </div>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-right pr-2">
                        You
                      </div>
                      <button
                        onClick={() => toggleStar(activeChat.id, index)}
                        className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <Star
                          className={`h-4 w-4 ${message.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'} transition-all duration-300 hover:scale-125`}
                        />
                      </button>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 shadow-sm border-2 border-white dark:border-gray-800" />
                  </div>
                </div>

                {/* AI message - Left side */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex-shrink-0 shadow-sm border-2 border-white dark:border-gray-800" />
                    <div className="min-w-0 group">
                      <div className="bg-gray-100 dark:bg-gray-700/80 px-6 py-4 rounded-2xl shadow-sm backdrop-blur-sm transform transition-all duration-300 hover:shadow-md hover:scale-[1.01] relative">
                        {isTyping && index === activeChat.messages.length - 1 && (
                          <div className="absolute -bottom-6 left-0 flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="animate-bounce">●</span>
                            <span className="animate-bounce delay-100">●</span>
                            <span className="animate-bounce delay-200">●</span>
                          </div>
                        )}
                        <Markdown className="prose dark:prose-invert prose-sm max-w-none break-words">
                          {message.answer || (index === activeChat.messages.length - 1 ? currentResponse : '')}
                        </Markdown>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pl-2">
                        Assistant
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
                  className="absolute right-2 bottom-2 h-8 w-8 bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transform transition-all duration-200 hover:scale-110"
                >
                  <Send className="h-4 w-4" />
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