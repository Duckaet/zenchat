import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/store/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';

// Main chat window component
export function ChatWindow() {
  // Get current chat and messages from the chat store
  const { currentChat, messages } = useChatStore();
  // Ref for the scroll area to enable auto-scrolling
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Find the scrollable viewport inside the ScrollArea
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        // Scroll to the bottom
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // If no chat is selected, show the empty state
  if (!currentChat) {
    return <EmptyState />;
  }

  return (
    // Main container: vertical flex layout, fills available height
    <div className="flex flex-col h-full">
      {/* Scrollable area for chat messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="min-h-full">
          {/* Show prompt if there are no messages */}
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <h3 className="text-lg font-medium">Start a conversation</h3>
                <p className="text-muted-foreground">
                  Ask me anything! I can help with writing, analysis, coding, and much more.
                </p>
              </div>
            </div>
          ) : (
            // Render each chat message
            <div className="space-y-0">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLast={index === messages.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Chat input at the bottom */}
      <ChatInput />
    </div>
  );
}