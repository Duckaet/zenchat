import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useChatStore } from '@/store/chat';
import { useAuthStore } from '@/store/auth';
import {

  Search,
  Code,
  BookOpen,
  PenTool,

  Clock,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

const EXAMPLES = [
  {
    id: 'robot-story',
    title: 'Write a short story about a robot discovering emotions',
    category: 'Create',
  },
  {
    id: 'sci-fi-outline',
    title: 'Help me outline a sci-fi novel set in a post-apocalyptic world',
    category: 'Create',
  },
  {
    id: 'villain-profile',
    title: 'Create a character profile for a complex villain with sympathetic motives',
    category: 'Create',
  },
  {
    id: 'writing-prompts',
    title: 'Give me 5 creative writing prompts for flash fiction',
    category: 'Create',
  },
  {
    id: 'typescript-guide',
    title: "Beginner's guide to TypeScript",
    category: 'Learn',
  },
  {
    id: 'cap-theorem',
    title: 'Explain the CAP theorem in distributed systems',
    category: 'Learn',
  },
  {
    id: 'ai-expensive',
    title: 'Why is AI so expensive?',
    category: 'Learn',
  },
  {
    id: 'black-holes',
    title: 'Are black holes real?',
    category: 'Learn',
  },
] as const;

const CATEGORIES = [
  { id: 'create', label: 'Create', icon: PenTool, active: true },
  { id: 'explore', label: 'Explore', icon: Search, active: false },
  { id: 'code', label: 'Code', icon: Code, active: false },
  { id: 'learn', label: 'Learn', icon: BookOpen, active: false },
] as const;


const ExampleCard = memo(({ example, onClick }: { 
  example: typeof EXAMPLES[0]; 
  onClick: (prompt: string) => void; 
}) => {
  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:shadow-sm border-border/50 group"
      onClick={() => onClick(example.title)}
    >
      <CardContent className="p-4">
        <p className="text-sm text-foreground leading-relaxed group-hover:text-primary transition-colors">
          {example.title}
        </p>
      </CardContent>
    </Card>
  );
});

ExampleCard.displayName = 'ExampleCard';

export const EmptyState = memo(() => {
  const { createChat, selectedModel, sendMessage } = useChatStore();
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('create');


  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';


  const handlePromptClick = useCallback(async (prompt: string) => {
    try {
  
      const chat = await createChat('New Chat', selectedModel.id);
      if (chat) {
      
        await sendMessage(prompt, []);
      }
    } catch (error) {
      console.error('Failed to start chat with prompt:', error);
    }
  }, [createChat, selectedModel.id, sendMessage]);

  const filteredExamples = useMemo(() => {
    if (activeCategory === 'create') {
      return EXAMPLES.filter(example => example.category === 'Create');
    } else if (activeCategory === 'learn') {
      return EXAMPLES.filter(example => example.category === 'Learn');
    }
    return EXAMPLES; 
  }, [activeCategory]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-3xl w-full space-y-8">
       
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            How can I help you, {userName}?
          </h1>
          
         
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-2 border border-border/50">
            <Clock className="w-4 h-4" />
            <span>
              Note: The app might take some time to respond as render has limitations on cold start
            </span>
          </div>
        </div>

        
        <div className="flex justify-center gap-2">
          {CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "outline"}
                className={`gap-2 ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <IconComponent className="w-4 h-4" />
                {category.label}
              </Button>
            );
          })}
        </div>

        {/* Example Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredExamples.map((example) => (
            <ExampleCard
              key={example.id}
              example={example}
              onClick={handlePromptClick}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Your conversations are private and secure
          </p>
        </div>
      </div>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
