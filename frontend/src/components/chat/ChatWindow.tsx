import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/store/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

export function ChatWindow() {
  const { currentChat, messages } = useChatStore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [followUpText, setFollowUpText] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();


  const isNearBottom = () => {
    if (!scrollAreaRef.current) return false;
    
    const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollElement) return false;
    
    const { scrollTop, clientHeight, scrollHeight } = scrollElement;
    const scrollDiff = (scrollHeight - scrollTop) - clientHeight;
    

    return scrollDiff < 100;
  };


  const handleScroll = () => {
    const nearBottom = isNearBottom();
    setShowScrollButton(!nearBottom && messages.length > 0);
    
   
    setIsUserScrolling(true);
    
  
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
 
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);
  };

 
  useEffect(() => {
    
    if (isUserScrolling) return;
    
  
    if (isNearBottom()) {
      setTimeout(() => {
        if (scrollAreaRef.current && !isUserScrolling) {
          const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
          if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }
        }
      }, 50); 
    }
  }, [messages.length]); 

  
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, []);

  
  useEffect(() => {
    if (currentChat && messages.length > 0) {
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
          if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }
        }
        setShowScrollButton(false);
      }, 100);
    }
  }, [currentChat?.id]);

 
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'auto'
        });
      }
    }
    setShowScrollButton(false);
  };

  const handleAddToFollowUp = (text: string) => {
    setFollowUpText(`Regarding "${text}", can you elaborate on this?`);
  };

  if (!currentChat) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      
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
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </ScrollArea>

     
      {showScrollButton && (
        <div className="absolute bottom-32 right-4 z-10">
          <Button
            onClick={scrollToBottom}
            className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 p-0 hover:scale-105 transition-all duration-200"
            size="sm"
            title="Scroll to bottom"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      )}

      <ChatInput 
        followUpText={followUpText} 
        onFollowUpUsed={() => setFollowUpText('')} 
      />
    </div>
  );
}
