import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatStore } from '@/store/chat';
import {
  Send,
  Paperclip,
  Mic,
  Image,
  Search,
  Sparkles,
  X,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Chat input component for sending messages, attachments, and quick actions
export function ChatInput() {
  // Get chat state and actions from the store
  const {
    selectedModel,
    availableModels,
    setSelectedModel,
    sendMessage,
    isLoading,
    currentChat,
  } = useChatStore();

  // Local state for message, attachments, and voice recording
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Refs for textarea and file input
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle sending a message (with optional attachments)
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim() && attachments.length === 0) return;
      if (!currentChat) return;

      const messageToSend = message.trim();
      const filesToSend = [...attachments];
      
      setMessage('');
      setAttachments([]);
      
      try {
        await sendMessage(messageToSend, filesToSend);
      } catch (error) {
        console.error('Failed to send message:', error);
        // Restore message and attachments on error
        setMessage(messageToSend);
        setAttachments(filesToSend);
      }
    },
    [message, attachments, currentChat, sendMessage]
  );

  // Handle Enter key for sending, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle file selection for attachments
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    e.target.value = '';
  };

  // Remove an attachment by index
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Placeholder for image generation action
  const handleImageGeneration = () => {
    // TODO: Open image generation modal
    console.log('Image generation requested');
  };

  // Placeholder for web search action
  const handleWebSearch = () => {
    // TODO: Trigger web search
    console.log('Web search requested');
  };

  // Handle voice input (toggle recording state)
  const handleVoiceInput = () => {
    if (isRecording) {
      // TODO: Stop recording and process speech
      setIsRecording(false);
    } else {
      // TODO: Start recording
      setIsRecording(true);
    }
  };

  // Adjust textarea height to fit content (auto-resize)
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  // Handle textarea input and auto-resize
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  // Show prompt if no chat is selected
  if (!currentChat) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Select a chat or create a new one to start messaging</p>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-background p-4 space-y-4">
      {/* Model Selection Dropdown */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedModel.id}
          onValueChange={(value) => {
            const model = availableModels.find(m => m.id === value);
            if (model) setSelectedModel(model);
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <span>{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({model.provider})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm"
            >
              {/* Show icon based on file type */}
              {file.type.startsWith('image/') ? (
                <Image className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {/* File name (truncated if long) */}
              <span className="max-w-32 truncate">{file.name}</span>
              {/* Remove attachment button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => removeAttachment(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Input container with textarea and action buttons */}
        <div className="flex items-end gap-2">
          {/* Textarea for message input */}
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[50px] max-h-[200px] resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Quick Action Buttons (attachments, image gen, search, voice) */}
          <div className="flex items-end gap-2">
            {/* Attachments Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-[50px] w-12 p-0">
                  <Paperclip className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <FileText className="w-4 h-4 mr-2" />
                  Upload File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  fileInputRef.current?.click();
                  // TODO: Filter for images only
                }}>
                  <Image className="w-4 h-4 mr-2" />
                  Upload Image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Image Generation Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-[50px] w-12 p-0"
              onClick={handleImageGeneration}
            >
              <Sparkles className="w-5 h-5" />
            </Button>

            {/* Web Search Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-[50px] w-12 p-0"
              onClick={handleWebSearch}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Voice Input Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-[50px] w-12 p-0",
                isRecording && "text-red-500 bg-red-50 dark:bg-red-950"
              )}
              onClick={handleVoiceInput}
            >
              <Mic className="w-5 h-5" />
            </Button>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={isLoading || (!message.trim() && attachments.length === 0)}
              className="h-[50px] px-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Hidden file input for attachments */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.doc,.docx,.md"
          onChange={handleFileSelect}
          className="hidden"
        />
      </form>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Thinking...</span>
        </div>
      )}
    </div>
  );
}