import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useChatStore } from '@/store/chat';
import { useAuthStore } from '@/store/auth';
import {
  Plus,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Edit,
  Share,
  LogOut,
  Settings,
  User,
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

  const handleCreateChat = async () => {
    try {
      await createChat('New Chat', selectedModel.id);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChat(chatId);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleEditTitle = (chat: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChat(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveTitle = async () => {
    if (editingChat && editTitle.trim()) {
      try {
        await updateChatTitle(editingChat, editTitle.trim());
        setEditingChat(null);
      } catch (error) {
        console.error('Failed to update chat title:', error);
      }
    }
  };

  const handleShareChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const shareToken = await shareChat(chatId);
      const shareUrl = `${window.location.origin}/share/${shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to share chat:', error);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      <div className="p-4 space-y-4 flex-shrink-0">
        <Button
          onClick={handleCreateChat}
          className="w-full justify-start gap-3 h-12 text-base"
          variant="outline"
        >
          <Plus className="w-5 h-5" />
          <span className="truncate">New Chat</span>
        </Button>
      </div>

      <Separator className="flex-shrink-0" />

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 py-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-colors hover:bg-accent min-w-0",
                currentChat?.id === chat.id && "bg-accent"
              )}
              onClick={() => selectChat(chat.id)}
            >
              <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              
              {editingChat === chat.id ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setEditingChat(null);
                  }}
                  className="h-6 text-sm border-0 bg-transparent p-0 focus:ring-0 flex-1 min-w-0"
                  autoFocus
                />
              ) : (
                <span className="flex-1 truncate text-sm font-medium min-w-0">
                  {chat.title}
                </span>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 flex-shrink-0"
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
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator className="flex-shrink-0" />

      <div className="p-4 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 min-w-0">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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