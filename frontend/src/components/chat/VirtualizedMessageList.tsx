import { memo, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ChatMessage } from './ChatMessage';
import { Message } from '@/types/chat';

interface VirtualizedMessageListProps {
  messages: Message[];
  height: number;
}

const ITEM_HEIGHT = 120; 


const MessageItem = memo(({ index, style, data }: any) => {
  const { messages } = data;
  const message = messages[index];
  const isLast = index === messages.length - 1;

  return (
    <div style={style}>
      <ChatMessage message={message} isLast={isLast} />
    </div>
  );
});

export const VirtualizedMessageList = memo(function VirtualizedMessageList({
  messages,
  height,
}: VirtualizedMessageListProps) {
  
  const itemData = useMemo(() => ({ messages }), [messages]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <h3 className="text-lg font-medium">Start a conversation</h3>
          <p className="text-muted-foreground">
            Ask me anything! I can help with writing, analysis, coding, and much more.
          </p>
        </div>
      </div>
    );
  }

   return (
    <List
      height={height}
      width="100%"
      itemCount={messages.length}
      itemSize={ITEM_HEIGHT}
      itemData={itemData}
      overscanCount={5} 
    >
      {MessageItem}
    </List>
  );
});
