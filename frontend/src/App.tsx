import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useChatStore } from '@/store/chat';
import { supabase } from '@/lib/supabase';
import { Menu, X } from 'lucide-react';

function App() {
  const { loadChats } = useChatStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadChats();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('chat_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats',
      }, () => {
        loadChats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadChats]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthGuard>
        <div className="h-screen flex bg-background">
          {/* Sidebar with integrated toggle */}
          <div className={`
            transition-all duration-300 ease-in-out
            ${isSidebarOpen 
              ? (isMobile ? 'w-[90%]' : 'w-[30%]')
              : 'w-12'
            }
            flex-shrink-0 border-r border-border
          `}>
            {/* Toggle button - always visible */}
            <div className="h-full flex flex-col">
              <div className="flex p-2 items-center border-b border-border" style={{ height: '60px' }}>
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-accent rounded-md transition-colors flex justify-center items-center"
                  style={{ width: '32px', height: '32px' }}
                >
                  {isSidebarOpen ? <X size={16} /> : <Menu size={16} />}
                </button>
              </div>
              
              {/* Sidebar content - only show when open */}
              {isSidebarOpen && (
                <div className="flex-1 overflow-hidden">
                  <ChatSidebar />
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Chat Window */}
          <div className={`
            flex-1 transition-all duration-300 ease-in-out
            ${isSidebarOpen 
              ? (isMobile ? 'w-[10%]' : 'w-[70%]')
              : 'w-full'
            }
          `}>
            <ChatWindow />
          </div>
        </div>
        <Toaster />
      </AuthGuard>
    </ThemeProvider>
  );
}

export default App;