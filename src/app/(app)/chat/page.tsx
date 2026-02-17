'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      const assistantMessageId = (Date.now() + 1).toString();

      if (reader) {
        // Add the assistant message placeholder
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          
          // Parse the text stream - AI SDK returns text chunks directly or in data: format
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            // Handle data: prefix format (Server-Sent Events)
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') continue;
              assistantMessage += data;
            } 
            // Handle direct text chunks with numeric prefix
            else if (line.match(/^\d+:/)) {
              const data = line.substring(line.indexOf(':') + 1);
              assistantMessage += data;
            }
            // Handle plain text
            else {
              assistantMessage += line;
            }
            
            // Update the message in real-time
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: assistantMessage }
                  : m
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-surface via-background to-surface">
      {/* Header */}
      <header className="bg-surface/80 backdrop-glass border-b border-border px-8 py-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-5xl animate-pulse-soft">🌿</div>
          <div>
            <h1 className="font-display text-4xl font-bold text-primary">Garden Chat</h1>
            <p className="text-sm text-text-secondary mt-1">Get expert plant care guidance powered by AI</p>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 space-y-6">
        {messages.length === 0 && (
          <div className="max-w-3xl mx-auto text-center mt-16 animate-fade-in">
            <div className="text-7xl mb-8 animate-float">🌱</div>
            <h2 className="font-display text-4xl font-bold text-primary mb-5">
              How can I help your garden today?
            </h2>
            <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
              Get instant answers about plant care, identification, and growing conditions. 
              Ask any question or share a photo for personalized guidance.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <button
                onClick={() => setInput("What should I plant this season?")}
                className="card-interactive text-left group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🌸</div>
                <p className="text-sm font-semibold text-primary">What should I plant this season?</p>
              </button>
              <button
                onClick={() => setInput("How do I care for my plants?")}
                className="card-interactive text-left group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">💧</div>
                <p className="text-sm font-semibold text-primary">How do I care for my plants?</p>
              </button>
              <button
                onClick={() => setInput("What's the weather forecast?")}
                className="card-interactive text-left group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">☀️</div>
                <p className="text-sm font-semibold text-primary">What&apos;s the weather forecast?</p>
              </button>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div
              className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-6 py-4 shadow-sm ${
                message.role === 'user'
                  ? 'gradient-forest text-white ml-auto'
                  : 'card-elevated'
              }`}
            >
              <p className={`whitespace-pre-wrap leading-relaxed ${
                message.role === 'user' ? 'text-white' : 'text-text-primary'
              }`}>
                {message.content}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="card-elevated rounded-2xl px-6 py-4 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-surface/80 backdrop-glass border-t border-border px-6 sm:px-8 py-6 shadow-sm">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
          <div className="flex gap-3 sm:gap-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your plants, share a photo, or get care advice..."
              className="flex-1 input"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-primary px-10 sm:px-12 whitespace-nowrap"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Sending
                </span>
              ) : (
                'Send'
              )}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-3 text-center">
            Powered by AI • Upload photos for instant plant identification and health analysis
          </p>
        </form>
      </div>
    </div>
  );
}
