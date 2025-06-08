import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message } from '@/types/chat';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import {
  Copy,
  MoreHorizontal,
  Edit,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  GitBranch,
  User,
  Bot,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MessageRenderer } from './MessageRenderer';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
}

export function ChatMessage({ message, isLast }: ChatMessageProps) {
  const { user } = useAuthStore();
  const { forkChat } = useChatStore();
  const [isHovered, setIsHovered] = useState(false);

  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    // TODO: Show success toast
  };

  const handleFork = async () => {
    try {
      await forkChat(message.id);
      // TODO: Show success toast and navigate to forked chat
    } catch (error) {
      console.error('Failed to fork chat:', error);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex gap-4 p-6 transition-colors hover:bg-accent/50",
        isUser && "bg-muted/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className="w-8 h-8 flex-shrink-0">
        {isUser ? (
          <>
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">
            {isUser ? (user?.user_metadata?.full_name || 'You') : 'Assistant'}
          </span>
          <time dateTime={message.createdAt}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </time>
          {message.tokenCount && (
            <span className="text-xs">
              {message.tokenCount} tokens
            </span>
          )}
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <MessageRenderer
            content={message.content}
            attachments={message.attachments}
            isStreaming={isStreaming}
          />
        </div>

        {/* Message Actions */}
        {(isHovered || isLast) && !isStreaming && (
          <div className="flex items-center gap-1 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2"
            >
              <Copy className="w-4 h-4" />
            </Button>

            {!isUser && (
              <>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleFork}>
                  <GitBranch className="w-4 h-4 mr-2" />
                  Fork from here
                </DropdownMenuItem>
                {isUser && (
                  <>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit message
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete message
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}