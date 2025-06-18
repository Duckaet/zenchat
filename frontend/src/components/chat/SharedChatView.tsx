import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChatStore } from '@/store/chat';
import { ChatMessage } from './ChatMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function SharedChatView() {
  const { token } = useParams<{ token: string }>();
  const { loadSharedChat, currentChat, messages } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChat = async () => {
      if (!token) {
        setError('Invalid share link');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('Loading shared chat with token:', token);
        
        const sharedChat = await loadSharedChat(token);
        
        if (!sharedChat) {
          setError('Chat not found or no longer shared');
          setIsLoading(false);
          return;
        }

        console.log('Shared chat loaded successfully');
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load shared chat:', error);
        setError('Failed to load shared chat');
        setIsLoading(false);
      }
    };

    loadChat();
  }, [token, loadSharedChat]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Share link copied to clipboard",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading shared chat...</p>
        </div>
      </div>
    );
  }

  if (error || !currentChat) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <h2 className="text-xl font-semibold">Chat Not Found</h2>
          <p className="text-muted-foreground">
            {error || 'This chat may have been deleted or is no longer shared.'}
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">{currentChat.title}</h1>
          <p className="text-sm text-muted-foreground">
            Shared conversation • Read-only
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>

      
      <ScrollArea className="flex-1">
        <div className="space-y-0">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8">
              <p className="text-muted-foreground">No messages in this chat</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
              />
            ))
          )}
        </div>
      </ScrollArea>

     
      <div className="border-t p-4 text-center text-sm text-muted-foreground">
        This is a read-only shared conversation
      </div>
    </div>
  );
}
