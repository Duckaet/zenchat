import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useChatStore } from '@/store/chat';
import { useAuthStore } from '@/store/auth';
import {
  Code,
  PenTool,
  Clock,
  Brain,
  Globe,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

type Example = {
  readonly id: string;
  readonly title: string;
  readonly category: string;
};

type Category = {
  readonly id: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
};

const EXAMPLES: readonly Example[] = [

  {
    id: 'create-1',
    title: 'Write a short story about a robot discovering emotions',
    category: 'Create',
  },
  {
    id: 'create-2',
    title: 'Help me outline a sci-fi novel set in a post-apocalyptic world',
    category: 'Create',
  },
  {
    id: 'create-3',
    title: 'Create a character profile for a complex villain with sympathetic motives',
    category: 'Create',
  },
  {
    id: 'create-4',
    title: 'Give me 5 creative writing prompts for flash fiction',
    category: 'Create',
  },

  {
    id: 'learn-1',
    title: "Beginner's guide to TypeScript",
    category: 'Learn',
  },
  {
    id: 'learn-2',
    title: 'Explain the CAP theorem in distributed systems',
    category: 'Learn',
  },
  {
    id: 'learn-3',
    title: 'Why is AI so expensive?',
    category: 'Learn',
  },
  {
    id: 'learn-4',
    title: 'Are black holes real?',
    category: 'Learn',
  },

  {
    id: 'explore-1',
    title: 'Find the latest information about AI developments',
    category: 'Explore',
  },
  {
    id: 'explore-2',
    title: 'Summarize recent breakthroughs in quantum computing',
    category: 'Explore',
  },
  {
    id: 'explore-3',
    title: 'Explain the impact of climate change on global economies',
    category: 'Explore',
  },
  {
    id: 'explore-4',
    title: 'Discover new trends in renewable energy',
    category: 'Explore',
  },

  {
    id: 'code-1',
    title: 'Help me build a React component with TypeScript',
    category: 'Code',
  },
  {
    id: 'code-2',
    title: 'Debug this JavaScript error in my code',
    category: 'Code',
  },
  {
    id: 'code-3',
    title: 'Optimize SQL queries for better performance',
    category: 'Code',
  },
  {
    id: 'code-4',
    title: 'Explain how to use Docker for containerization',
    category: 'Code',
  },
] as const;


const CATEGORIES: readonly Category[] = [
  { id: 'create', label: 'Create', icon: PenTool },
  { id: 'explore', label: 'Explore', icon: Globe },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'learn', label: 'Learn', icon: Brain },
] as const;

// Memoized and optimized ExampleCard
const ExampleCard = memo(({ example, onClick }: { 
  example: Example; 
  onClick: (prompt: string) => void; 
}) => {
  const handleClick = useCallback(() => {
    onClick(example.title);
  }, [example.title, onClick]);

  return (
    <Card
      className="cursor-pointer transition-all duration-150 hover:bg-accent/30 hover:border-primary/20 border-border/30 group"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <p className="text-sm text-foreground leading-relaxed group-hover:text-primary transition-colors duration-150">
          {example.title}
        </p>
      </CardContent>
    </Card>
  );
});

ExampleCard.displayName = 'ExampleCard';


const CategoryButton = memo(({ category, isActive, onClick }: {
  category: Category;
  isActive: boolean;
  onClick: () => void;
}) => {
  const IconComponent = category.icon;
  
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      className={`gap-2 transition-all duration-150 ${
        isActive 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'hover:bg-accent/50 hover:border-primary/30'
      }`}
      onClick={onClick}
    >
      <IconComponent className="w-4 h-4" />
      {category.label}
    </Button>
  );
});

CategoryButton.displayName = 'CategoryButton';

export const EmptyState = memo(() => {
  const { createChat, selectedModel, sendMessage } = useChatStore();
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('create');


  const userName = useMemo(() => 
    user?.user_metadata?.full_name?.split(' ')[0] || 'there',
    [user?.user_metadata?.full_name]
  );


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

 
  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, []);

  
  const filteredExamples = useMemo(() => {
    return EXAMPLES.filter(example => 
      example.category.toLowerCase() === activeCategory
    );
  }, [activeCategory]);

  
  const categoryButtons = useMemo(() => (
    <div className="flex justify-center gap-2 flex-wrap">
      {CATEGORIES.map((category) => (
        <CategoryButton
          key={category.id}
          category={category}
          isActive={activeCategory === category.id}
          onClick={() => handleCategoryChange(category.id)}
        />
      ))}
    </div>
  ), [activeCategory, handleCategoryChange]);

 
  const exampleGrid = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {filteredExamples.map((example) => (
        <ExampleCard
          key={example.id}
          example={example}
          onClick={handlePromptClick}
        />
      ))}
    </div>
  ), [filteredExamples, handlePromptClick]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            How can I help you, {userName}?
          </h1>
          
          
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 rounded-lg px-4 py-2 border border-border/30">
            <Clock className="w-4 h-4 text-primary" />
            <span>
              App might take a moment to respond due to cold start
            </span>
          </div>
        </div>

        
        {categoryButtons}

        
        {exampleGrid}

       
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Your conversations are not deletable now, dont share sensitive information.
          </p>
        </div>
      </div>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';