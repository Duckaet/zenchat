import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatStore } from '@/store/chat';
import { Send, Search, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatInputProps {
  followUpText?: string;
  onFollowUpUsed?: () => void;
}

export function ChatInput({ followUpText, onFollowUpUsed }: ChatInputProps) {
  const { selectedModel, availableModels, setSelectedModel, sendMessage, isLoading, currentChat } = useChatStore();
  
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (followUpText) {
      setMessage(followUpText);
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(followUpText.length, followUpText.length);
      }
      adjustTextareaHeight();
    }
  }, [followUpText]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && attachments.length === 0) return;
    if (!currentChat) return;

    const messageToSend = message.trim();
    const filesToSend = [...attachments];
    
    setMessage('');
    setAttachments([]);
    
    setTimeout(() => {
      adjustTextareaHeight();
      }, 0);
  
    if (onFollowUpUsed) {
      onFollowUpUsed();
    }

    try {
      if (isSearchMode) {
        setIsSearching(true);
      }
      
      await sendMessage(messageToSend, filesToSend, {
        needsSearch: isSearchMode,
        searchQuery: isSearchMode ? messageToSend : undefined
      });
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(messageToSend);
      setAttachments(filesToSend);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSearchMode(false);
      setIsSearching(false);
    }
  }, [message, attachments, currentChat, sendMessage, isSearchMode, onFollowUpUsed]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };


  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleWebSearch = useCallback(() => {
    if (isSearching) return;
    setIsSearchMode(true);
    toast.info('Web search mode activated');
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [isSearching]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  if (!currentChat) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        
       
        <div className="mb-3">
          <Select value={selectedModel.id} onValueChange={(value) => {
            const model = availableModels.find(m => m.id === value);
            if (model) setSelectedModel(model);
          }}>
            <SelectTrigger 
              className="w-48 h-8 text-xs bg-muted/50 border-border/50"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              side="bottom"
              align="start"
              sideOffset={4}
              >
              {availableModels.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.provider}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

       
        {isSearchMode && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
            <Search className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">
              Web search mode active
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-auto text-primary hover:text-primary/80"
              onClick={() => setIsSearchMode(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

      
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50 text-sm">
                <FileText className="w-3 h-3 text-muted-foreground" />
                <span className="max-w-32 truncate text-foreground">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

       
        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-3 p-3 bg-muted/30 rounded-2xl focus-within:border-primary/50 transition-all duration-200 shadow-sm">
            
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="min-h-[20px] max-h-[120px] resize-none border-0 bg-transparent p-0 text-foreground placeholder-muted-foreground focus:ring-0 focus:outline-none text-base leading-6"
                disabled={isLoading || isSearching}
                rows={1}
              />
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              
            
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all duration-200",
                  isSearchMode 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={handleWebSearch}
                disabled={isSearching}
              >
                <Search className="w-4 h-4" />
              </Button>

           
              <Button
                type="submit"
                disabled={isLoading || isSearching || !message.trim()}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-all duration-200",
                  message.trim() && !isLoading && !isSearching
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isLoading || isSearching ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
