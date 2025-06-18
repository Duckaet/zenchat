import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/store/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';

export function ChatWindow() {
  const { currentChat, messages } = useChatStore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [followUpText, setFollowUpText] = useState('');

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleAddToFollowUp = (text: string) => {
    setFollowUpText(`Regarding "${text}", can you elaborate on this?`);
  };

  if (!currentChat) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area - Centered like Perplexity */}
      <ScrollArea className="flex-1 pb-32" ref={scrollAreaRef}>
        <div className="min-h-full">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">
                  Start a conversation
                </h3>
                <p className="text-muted-foreground">
                  Ask me anything! I can help with writing, analysis, coding, and much more.
                </p>
              </div>
            </div>
          ) : (
            /* Centered container like Perplexity */
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="space-y-8">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLast={index === messages.length - 1}
                    onAddToFollowUp={handleAddToFollowUp}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Floating Input */}
      <ChatInput 
        followUpText={followUpText} 
        onFollowUpUsed={() => setFollowUpText('')} 
      />
    </div>
  );
}
