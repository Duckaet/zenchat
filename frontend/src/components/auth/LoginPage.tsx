import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { MessageSquare, Sparkles, Zap, Shield, Clock } from 'lucide-react';

export function LoginPage() {
  const { signInWithGoogle } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                ZEN-CHAT
              </h1>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Enter zen mode with AI that gets your vibe
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-border/50 backdrop-blur-sm bg-background/80 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Sign in to continue</CardTitle>
            <CardDescription className="text-base">
              Get <span className="font-semibold text-primary">zero free credits hehe</span> to start chatting
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Features */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">no message limits like t3</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">cause only free models are available</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">local first</span>
              </div>
            </div>

            {/* Cold start warning */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
              <Clock className="w-3 h-3" />
              <span>First response may take a moment due to render's cold startups</span>
            </div>

            {/* Google Sign In Button */}
            <Button 
              onClick={signInWithGoogle}
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Alternative sign in hint */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Quick, secure, and no password required
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          
          
        </div>
      </div>
    </div>
  );
}
