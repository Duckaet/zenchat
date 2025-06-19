import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/store/chat';
import { useAuthStore } from '@/store/auth';
import {

  MessageSquare,
  MoreHorizontal,
  Trash2,
  Edit,
  Share,
  LogOut,

  Search,
  Pin,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Chat } from '@/types/chat';

const groupChatsByTime = (chats: Chat[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const groups = {
    today: chats.filter(chat => {
      const chatDate = new Date(chat.updatedAt);
      return chatDate >= today;
    }),
    lastWeek: chats.filter(chat => {
      const chatDate = new Date(chat.updatedAt);
      return chatDate >= sevenDaysAgo && chatDate < today;
    }),
    lastMonth: chats.filter(chat => {
      const chatDate = new Date(chat.updatedAt);
      return chatDate >= thirtyDaysAgo && chatDate < sevenDaysAgo;
    }),
  };

  return groups;
};

export function ChatSidebar() {
  const { user, signOut } = useAuthStore();
  const {
    chats,
    currentChat,
    createChat,
    selectChat,
    deleteChat,
    updateChatTitle,
    shareChat,
    selectedModel,
  } = useChatStore();
  
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateChat = useCallback(async () => {
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      await createChat('New Chat', selectedModel.id);
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsCreating(false);
    }
  }, [createChat, selectedModel.id, isCreating]);

  const handleDeleteChat = useCallback(async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChat(chatId);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  }, [deleteChat]);

  const handleEditTitle = useCallback((chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChat(chat.id);
    setEditTitle(chat.title);
  }, []);

  const handleSaveTitle = useCallback(async () => {
    if (editingChat && editTitle.trim()) {
      try {
        await updateChatTitle(editingChat, editTitle.trim());
        setEditingChat(null);
      } catch (error) {
        console.error('Failed to update chat title:', error);
      }
    }
  }, [editingChat, editTitle, updateChatTitle]);

  const handleShareChat = useCallback(async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const shareToken = await shareChat(chatId);
      const shareUrl = `${window.location.origin}/share/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error('Failed to share chat:', error);
    }
  }, [shareChat]);


  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedChats = groupChatsByTime(filteredChats);

  const ChatItem = ({ chat }: { chat: Chat }) => (
  <div
    className={cn(
      "group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors rounded-lg mx-2",
      currentChat?.id === chat.id 
        ? "bg-primary/10 border border-primary/20 text-foreground" 
        : "hover:bg-accent/50 text-foreground"
    )}
    onClick={() => selectChat(chat.id)}
  >

    
    {editingChat === chat.id ? (
      <Input
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') handleSaveTitle();
          if (e.key === 'Escape') setEditingChat(null);
        }}
        className="h-6 text-sm bg-background border-border flex-1"
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
    ) : (
      <>
        <span className={cn(
          "flex-1 truncate text-sm font-medium",
          currentChat?.id === chat.id ? "text-foreground font-semibold" : "text-foreground"
        )}>
          {chat.title}
        </span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => handleEditTitle(chat, e)}>
              <Edit className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleShareChat(chat.id, e)}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => handleDeleteChat(chat.id, e)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    )}
  </div>
);


  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {title === 'Pinned' && <Pin className="w-3 h-3" />}
      {title}
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
 
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold text-primary text-center mb-4">__zenchat</h1>

        <Button
          onClick={handleCreateChat}
          disabled={isCreating}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
        >
          {isCreating ? 'Creating...' : 'one last thread please'}
        </Button>
      </div>


      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="lost? find asap.."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/30 border-0 focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2">

          
          {groupedChats.today.length > 0 && (
            <div className="mb-4">
              <SectionHeader title="Today" />
              <div className="space-y-1">
                {groupedChats.today.map((chat) => (
                  <ChatItem key={chat.id} chat={chat} />
                ))}
              </div>
            </div>
          )}

      
          {groupedChats.lastWeek.length > 0 && (
            <div className="mb-4">
              <SectionHeader title="Last 7 Days" />
              <div className="space-y-1">
                {groupedChats.lastWeek.map((chat) => (
                  <ChatItem key={chat.id} chat={chat} />
                ))}
              </div>
            </div>
          )}

   
          {groupedChats.lastMonth.length > 0 && (
            <div className="mb-4">
              <SectionHeader title="Last 30 Days" />
              <div className="space-y-1">
                {groupedChats.lastMonth.map((chat) => (
                  <ChatItem key={chat.id} chat={chat} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {chats.length === 0 && (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No chats yet. Create your first chat to get started!
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 p-3 hover:bg-muted rounded-lg">
              <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                  {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">Free</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}