import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message } from '@/types/chat';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import {
  Copy,
  GitBranch,
  User,
  Bot,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { MessageRenderer } from './MessageRenderer';
import { TextSelectionTooltip } from './TextSelectionTooltip';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
  onAddToFollowUp?: (text: string) => void;
}

export function ChatMessage({ message, isLast, onAddToFollowUp }: ChatMessageProps) {
  const { user } = useAuthStore();
  const { forkChat, selectChat } = useChatStore();
  const [isHovered, setIsHovered] = useState(false);

  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('Message copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  const handleFork = async () => {
    try {
      const forkedChat = await forkChat(message.id);
      if (forkedChat) {
        await selectChat(forkedChat.id);
        toast.success('Chat forked successfully');
      }
    } catch (error) {
      console.error('Failed to fork chat:', error);
      toast.error('Failed to fork chat');
    }
  };

  const handleAddToFollowUp = (selectedText: string) => {
    if (onAddToFollowUp) {
      onAddToFollowUp(selectedText);
    }
    toast.success('Added to follow-up');
  };

  const handleCheckSources = async (selectedText: string) => {
    try {
      await navigator.clipboard.writeText(selectedText);
      toast.success('Text copied for source checking');
    } catch (error) {
      toast.error('Failed to copy text');
    }
  };

  return (
    <>
      <div
        className={cn(
          "group transition-colors duration-200",
          isUser ? "flex justify-end" : "flex justify-start"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn(
          "flex gap-3 max-w-3xl w-full",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
        
          <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
            {isUser ? (
              <>
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-muted text-foreground">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </>
            ) : (
              <AvatarFallback className="bg-muted text-foreground">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            )}
          </Avatar>

       
          <div className="flex-1 min-w-0">
           
            <div className={cn(
              "flex items-center gap-2 mb-2 text-sm text-muted-foreground",
              isUser ? "justify-end" : "justify-start"
            )}>
              <span className="font-medium text-foreground">
                {isUser ? (user?.user_metadata?.full_name || 'You') : 'Zennie'}
              </span>
              <time dateTime={message.createdAt} className="text-xs">
                {format(new Date(message.createdAt), 'HH:mm')}
              </time>
            </div>

         
            <div className={cn(
              "rounded-2xl px-4 py-3 relative",
              isUser 
                ? "bg-muted text-foreground border border-border/50" 
                : "text-foreground"
            )}>
              <MessageRenderer
                content={message.content}
                attachments={message.attachments}
                isStreaming={isStreaming}
              />
            </div>

     
            {!isUser && (isHovered || isLast) && !isStreaming && (
              <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFork}
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                >
                  <GitBranch className="w-3 h-3 mr-1" />
                  Fork
                </Button>
              </div>
            )}

         
            {isUser && (isHovered || isLast) && !isStreaming && (
              <div className="flex items-center gap-1 mt-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <TextSelectionTooltip
        onAddToFollowUp={handleAddToFollowUp}
        onCheckSources={handleCheckSources}
      />
    </>
  );
}
