'use client';
import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { ModeToggle } from '../elements/toggle-mode';
import { simulateLLMStreaming } from '@/lib/generator';
import { CircleSlash, RotateCcw, LogOut, MessageSquare } from 'lucide-react';
import { Input } from '../ui/input';
import { ModelOptions } from '../elements/model-options';
import Markdown from "react-markdown";
import { useLLMStore } from '@/store/llm-store';
import { simulatedResponse } from '@/helper/helper';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '../ui/dropdown-menu';

interface Message {
  content: string;
  answer: string;
}

interface MessageContainer {
  id: number;
  name: string;
  messages: Message[];
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

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const streamingOptions = useRef<{ stop: boolean }>({ stop: false });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [messageContainers, setMessageContainers] = useState<MessageContainer[]>([]);
  const [activeContainer, setActiveContainer] = useState<MessageContainer | null>(null);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0);

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
    const currentInput = input; // Store input value before clearing
    setInput('');

    // Create new container if none is selected
    let currentContainer = activeContainer;
    if (!currentContainer) {
      const newContainer: MessageContainer = {
        id: messageContainers.length + 1,
        name: currentInput.substring(0, 30) + '...',
        messages: []
      };
      setMessageContainers(prev => [...prev, newContainer]);
      currentContainer = newContainer;
      setActiveContainer(newContainer);
    }

    let fullResponse = '';
    for await (const chunk of simulateLLMStreaming(simulatedResponse, { delayMs: 200, chunkSize: 12, stop: streamingOptions.current.stop })) {
      if (streamingOptions.current.stop) break;
      fullResponse += chunk;
      setCurrentResponse(fullResponse);
      scrollToBottom();
    }

    const userMessage: Message = { content: currentInput, answer: fullResponse };

    // Update messages in the container
    if (currentContainer) {
      const updatedContainer = {
        ...currentContainer,
        messages: [...currentContainer.messages, userMessage]
      };

      // Calculate the new prompt index
      const newPromptIndex = updatedContainer.messages.length - 1;

      setMessageContainers(prev =>
        prev.map(container =>
          container.id === currentContainer.id ? updatedContainer : container
        )
      );

      setActiveContainer(updatedContainer);
      setSelectedPromptIndex(newPromptIndex);
    }

    setLoading(false);
    scrollToBottom();
  };

  const handleStop = () => {
    streamingOptions.current.stop = true;
    setLoading(false);
  };

  const createNewContainer = () => {
    const newContainer: MessageContainer = {
      id: messageContainers.length + 1,
      name: `New Chat ${messageContainers.length + 1}`,
      messages: []
    };
    setMessageContainers(prev => [...prev, newContainer]);
    setActiveContainer(newContainer);
    setInput('');
    setCurrentResponse('');
  };

  // Group messages into conversations (user prompt + AI response)
  const conversations = messages.reduce((acc: { prompt: Message, response: Message }[], message, index) => {
    acc.push({ prompt: message, response: messages[index + 1] || { content: '', answer: '' } });
    return acc;
  }, []);

  // Function to get the selected conversation
  const getSelectedConversation = () => {
    if (!activeContainer) return null;
    
    // Get the selected message and its response
    const selectedMessage = activeContainer.messages[selectedPromptIndex];
    if (!selectedMessage) return null;

    // Get the next message (which should be the response)
    const response = activeContainer.messages[selectedPromptIndex + 1];

    return { 
      prompt: selectedMessage, 
      response: response 
    };
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-7xl relative mx-auto h-[100dvh] flex flex-col justify-between p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MessageSquare className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={createNewContainer}
              className="flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" />
              New Chat
            </DropdownMenuItem>
            {messageContainers.length > 0 && (
              <div className="h-px bg-border my-1" /> // Separator
            )}
            {messageContainers.map((container) => (
              <DropdownMenuItem
                key={container.id}
                onClick={() => setActiveContainer(container)}
                className={`flex items-center gap-2 ${activeContainer?.id === container.id ? 'bg-accent' : ''}`}
              >
                {container.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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

      <h1 className="font-bold text-2xl text-center mt-4">
        {activeContainer ? activeContainer.name : 'New Chat'} - {model.length ? model : 'Chat with me'}
      </h1>

      <div className="flex-1 mt-16 overflow-hidden flex">
        {/* Left sidebar with tabs */}
        <div className="w-1/4 border-r pr-4 overflow-y-auto">
          {activeContainer && activeContainer.messages.length > 0 && (
            <div className="flex flex-col w-full gap-2">
              {activeContainer.messages.map((msg, index) => (
                <button
                  key={`message-${activeContainer.id}-${index}`}
                  onClick={() => setSelectedPromptIndex(index)}
                  className={`w-full text-left p-2 rounded transition-colors
                    ${selectedPromptIndex === index
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">#{index + 1}</span>
                    <span className="truncate">{msg.content}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="flex-1 pl-4 overflow-y-auto" ref={chatContainerRef}>
          {currentResponse ? (
            // Show only the current response while streaming
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-4">
              <Markdown className='prose dark:prose-invert prose-sm max-w-none'>
                {currentResponse}
              </Markdown>
            </div>
          ) : (
            // Show selected conversation when not streaming
            getSelectedConversation() && (
              <>
                <div className="bg-blue-500 text-white p-4 rounded-lg mt-4">
                  <Markdown className='prose dark:prose-invert prose-sm max-w-none'>
                    {getSelectedConversation()?.prompt.content}
                  </Markdown>
                </div>
                {getSelectedConversation()?.response && (
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-4">
                    <Markdown className='prose dark:prose-invert prose-sm max-w-none'>
                      {getSelectedConversation()?.response.content}
                    </Markdown>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto mb-4">
        <div className="flex justify-end mb-2 gap-2">
          {loading && (
            <Button onClick={handleStop} variant="outline" size="sm">
              <CircleSlash className="mr-2 h-4 w-4" />
              Stop
            </Button>
          )}
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

export default HomePage;