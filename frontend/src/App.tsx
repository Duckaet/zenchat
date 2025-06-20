import { useEffect, useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { SharedChatView } from '@/components/chat/SharedChatView';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useChatStore } from '@/store/chat';
import { useAuthStore } from '@/store/auth';
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

function MainAppLayout() {
  const { loadFromLocal, syncData } = useChatStore();
  const { initialize } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initialize();
        await loadFromLocal();
        
        if (navigator.onLine) {
          await syncData();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initApp();
  }, [initialize, loadFromLocal, syncData]);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  return (
    <AuthGuard>
      <div className="h-screen flex bg-background overflow-hidden relative">
        
        {/* Fixed floating controls */}
        <div className={cn(
          "fixed top-4 z-50 flex flex-col gap-2 transition-all duration-150 ease-out",
          // On desktop: move right when sidebar is open
          // On mobile: also move right when sidebar is open (since it overlays)
          isSidebarOpen ? "left-[336px]" : "left-4"
        )}>
         
          <div className="bg-background/20 backdrop-blur-[2px] border border-border/20 rounded-xl p-2 shadow-sm hover:bg-background/30 hover:shadow-md transition-all duration-200 flex flex-row items-center justify-center gap-2">
          
            <button
              onClick={toggleSidebar}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-background/30 group"
              )}
              title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <div className="relative w-5 h-5">
                <Menu 
                  className={cn(
                    "absolute inset-0 transition-all duration-200 ease-out",
                    isSidebarOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                  )} 
                  size={20} 
                />
                <X 
                  className={cn(
                    "absolute inset-0 transition-all duration-200 ease-out",
                    isSidebarOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"
                  )} 
                  size={20} 
                />
              </div>
            </button>
            
            {/* Separator */}
            <div className="w-px h-6 bg-border/30" />
           
            <ThemeToggle />
          </div>
        </div>

        {/* Sidebar */}
        <div className={cn(
          "relative flex-shrink-0 transition-all duration-150 ease-out",
          isSidebarOpen ? "w-80" : "w-0"
        )}>
          <div className={cn(
            "absolute top-0 left-0 h-full w-80 bg-muted border-r border-border transition-transform duration-150 ease-out z-30",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <ChatSidebar />
          </div>
        </div>

        {/* Main content */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 relative",
          // On desktop, adjust width based on sidebar
          !isMobile && isSidebarOpen ? "w-[calc(100vw-320px)]" : "w-full"
        )}>
          <div className="flex-1 overflow-hidden relative">
            <ChatWindow />
          </div>
        </div>

        {/* Mobile overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-20 transition-opacity duration-150 ease-out"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </AuthGuard>
  );
}

function App() {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange={true}
      storageKey="zen-chat-theme"
      themes={['light', 'dark', 'system']}
    >
      <Routes>
        <Route path="/share/:token" element={<SharedChatView />} />
        <Route path="/*" element={<MainAppLayout />} />
      </Routes>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 2000,
          className: "bg-background border border-border text-foreground",
        }}
      />
    </ThemeProvider>
  );
}

export default App;