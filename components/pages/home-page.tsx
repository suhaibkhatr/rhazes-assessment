'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { ModeToggle } from '../elements/toggle-mode';
import { CircleSlash, LogOut, MessageSquare, Send, Bot, Star } from 'lucide-react';
import { Input } from '../ui/input';
import { ModelOptions } from '../elements/model-options';
import Markdown from "react-markdown";
import { useLLMStore } from '@/store/llm-store';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import Link from 'next/link';


interface Prompt {
  id: number;
  prompt: string;
  response: string;
  isStarred: boolean;
  model: string;
  modelId: number;
  chatId: number;
  modelName: string;
}

interface Chat {
  id: number;
  title: string;
  prompts: Prompt[];
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

  // Fetch chat history when component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await fetch('/api/chat');
        if (!response.ok) throw new Error('Failed to fetch chat history');

        const data = await response.json();
        const formattedChats: Chat[] = data.map((container: Chat) => ({
          id: container.id,
          title: container.title,
          prompts: container.prompts.map((msg: Prompt) => ({
            id: msg.id,
            prompt: msg.prompt,
            response: msg.response,
            isStarred: msg.isStarred,
            model: msg.model,
            modelId: msg.modelId,
            modelName: msg.modelName
          }))
        }));

        setChats(formattedChats);
        if (formattedChats.length > 0) {
          setActiveChat(formattedChats[0]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    if (status === "authenticated") {
      fetchChatHistory();
    }
  }, [status]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    let currentChat = activeChat;
    if (!currentChat) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: 'New Chat ' + (chats.length + 1)
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create new chat');
        }

        const newChatData = await response.json();
        const newChat: Chat = {
          id: newChatData.id,
          title: newChatData.title,
          prompts: []
        };

        setChats(prev => [...prev, newChat]);
        currentChat = newChat; // Use local variable instead of state
      } catch (error) {
        console.error('Error creating new chat:', error);
        return;
      }
    }

    streamingOptions.current.stop = false;
    const currentInput = input;
    setInput('');

    try {
      // Create a new prompt in the database
      const promptResponse = await fetch(`/api/chat/${currentChat.id}/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_input: currentInput,
          model: model
        })
      });

      if (!promptResponse.ok) {
        throw new Error('Failed to create prompt');
      }

      const promptData = await promptResponse.json();
      
      // Update the messages with the prompt ID immediately
      const updatedMessages = [...currentChat.prompts, promptData];
      updateChat(currentChat.id, { ...currentChat, prompts: updatedMessages });
      
      // Ensure scroll after adding user message
      scrollToBottom();

      // Start streaming the response
      const streamResponse = await fetch(
        `/api/chat/${currentChat.id}/prompts/${promptData.id}/stream`,
        { method: 'POST' }
      );

      if (!streamResponse.ok) throw new Error('Failed to stream response');

      const reader = streamResponse.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (reader && !streamingOptions.current.stop) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullResponse += chunk;
        
        // Update the messages with the current chunk
        const finalMessages = updatedMessages.map((msg, idx) =>
          idx === updatedMessages.length - 1 
            ? { ...msg, response: fullResponse } 
            : msg
        );
        updateChat(currentChat.id, { ...currentChat, prompts: finalMessages });
        
        // Ensure scroll after each chunk
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }

    } catch (error) {
      console.error('Error handling message:', error);
      // Handle error in UI
    } finally {
      setLoading(false);
      // Final scroll to ensure everything is visible
      scrollToBottom();
    }
  };

  const updateChat = (chatId: number, updatedChat: Chat) => {
    setChats(prev => prev.map(chat => chat.id === chatId ? updatedChat : chat));
    setActiveChat(updatedChat);
  };

  const toggleStar = async (chatId: number, messageIndex: number) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      const prompt = chat.prompts[messageIndex];
      try {
        const response = await fetch(`/api/chat/${chatId}/prompts/${prompt.id}/star`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            isStarred: !prompt.isStarred
          })
        });

        if (!response.ok) throw new Error('Failed to toggle star status');

        const updatedPrompt = await response.json();
        const updatedMessages = chat.prompts.map((msg, idx) =>
          idx === messageIndex ? { ...msg, isStarred: updatedPrompt.isStarred } : msg
        );
        updateChat(chatId, { ...chat, prompts: updatedMessages });
      } catch (error) {
        console.error('Error toggling star status:', error);
      }
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'New Chat ' + (chats.length + 1)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create new chat');
      }

      const newChatData = await response.json();
      const newChat: Chat = {
        id: newChatData.id,
        title: newChatData.title,
        prompts: []
      };

      setChats(prev => [...prev, newChat]);
      setActiveChat(newChat);
      setInput('');
      setCurrentResponse('');
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleStop = () => {
    streamingOptions.current.stop = true;
    setLoading(false);
  };

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return null;

  return (
    <div className="flex flex-col h-screen">
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
                <div className="truncate text-sm">{chat.title}</div>
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
          <div className="border-b border-gray-200 dark:border-gray-700/50 p-2 flex justify-end gap-2 items-center bg-white dark:bg-gray-800">
            <Link 
              href="/starred" 
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Star className="h-4 w-4" />
              <span className="text-sm">Starred Prompts</span>
            </Link>
            <ModeToggle />
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800" ref={chatContainerRef}>
            <div className="max-w-3xl mx-auto">
              {(!activeChat || activeChat.prompts.length === 0) && (
                <div className="flex flex-col items-center justify-center h-full py-12 space-y-6 text-center">
                  <Bot className="w-16 h-16 text-blue-500 animate-bounce" />
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome to Rhazes AI</h2>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    Start a conversation and explore the possibilities of AI-powered chat.
                  </p>
                </div>
              )}
              {activeChat?.prompts.map((message, index) => (
                <div key={index} className="space-y-6 py-6 animate-fadeIn">
                  {/* User message - Right side */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] flex gap-4 items-start">
                      <div className="min-w-0 group relative">
                        <div className="bg-blue-500 text-white px-6 py-4 rounded-2xl shadow-sm transform transition-all duration-300 hover:shadow-md hover:scale-[1.01] group-hover:bg-blue-600">
                          <Markdown className="prose dark:prose-invert prose-sm max-w-none break-words">
                            {message.prompt}
                          </Markdown>
                          {message.modelId && (
                            <div className="mt-2 text-xs opacity-70 border-t border-white/20 pt-2">
                              Using: {message.modelName || `Model ${message.modelId}`}
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
                            className={`h-4 w-4 ${message.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'} transition-all duration-300 hover:scale-125`}
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
                          {loading && index === activeChat.prompts.length - 1 && (
                            <div className="absolute -bottom-6 left-0 flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                              <span className="animate-bounce">●</span>
                              <span className="animate-bounce delay-100">●</span>
                              <span className="animate-bounce delay-200">●</span>
                            </div>
                          )}
                          <Markdown className="prose dark:prose-invert prose-sm max-w-none break-words">
                            {message.response || (index === activeChat.prompts.length - 1 ? currentResponse : '')}
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
                <ModelOptions />
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
    </div>
  );
}

export default HomePage;