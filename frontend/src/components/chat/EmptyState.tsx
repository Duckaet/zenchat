import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useChatStore } from '@/store/chat';
import {
  MessageSquare,
  Sparkles,
  FileText,
  Search,
  Mic,
  Image,
  Code,
  BookOpen,
} from 'lucide-react';

const examples = [
  {
    icon: Code,
    title: 'Write code',
    description: 'Help me build a React component with TypeScript',
  },
  {
    icon: FileText,
    title: 'Analyze documents',
    description: 'Summarize this PDF and extract key insights',
  },
  {
    icon: Search,
    title: 'Research topics',
    description: 'Find the latest information about AI developments',
  },
  {
    icon: BookOpen,
    title: 'Explain concepts',
    description: 'Break down complex topics in simple terms',
  },
  {
    icon: Image,
    title: 'Generate images',
    description: 'Create a modern logo for my startup',
  },
  {
    icon: Mic,
    title: 'Voice chat',
    description: 'Have a natural conversation with voice input',
  },
];

export function EmptyState() {
  const { createChat, selectedModel } = useChatStore();

  const handleCreateChat = async () => {
    try {
      await createChat('New Chat', selectedModel.id);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-4 bg-primary text-primary-foreground rounded-2xl">
              <MessageSquare className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Welcome to AI Chat</h1>
          <p className="text-lg text-muted-foreground">
            Start a conversation with powerful AI models from OpenAI, Anthropic, Google, and Mistral
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {examples.map((example, index) => (
            <Card
              key={index}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={handleCreateChat}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <example.icon className="w-5 h-5 text-primary" />
                  <h3 className="font-medium">{example.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground text-left">
                  {example.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Button onClick={handleCreateChat} size="lg" className="gap-2">
            <Sparkles className="w-5 h-5" />
            Start New Chat
          </Button>
          <p className="text-sm text-muted-foreground">
            Your conversations are saved and synced across devices
          </p>
        </div>
      </div>
    </div>
  );
}