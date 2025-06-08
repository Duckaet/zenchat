import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/store/chat';
import {
  BarChart3,
  Clock,
  MessageSquare,
  Zap,
  TrendingUp,
  Brain,
  DollarSign,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';

interface TokenUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

interface ChatStats {
  totalChats: number;
  totalMessages: number;
  averageLength: number;
  mostUsedModel: string;
  timeSpent: number;
}

export function InsightsPanel() {
  const { chats, messages, currentChat } = useChatStore();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Mock data - in a real app, this would come from your analytics service
  const tokenUsage: TokenUsage[] = [
    { model: 'GPT-4 Turbo', inputTokens: 15420, outputTokens: 8934, totalTokens: 24354, cost: 4.87 },
    { model: 'Claude 3 Sonnet', inputTokens: 12890, outputTokens: 7645, totalTokens: 20535, cost: 3.28 },
    { model: 'GPT-3.5 Turbo', inputTokens: 8760, outputTokens: 5234, totalTokens: 13994, cost: 0.42 },
    { model: 'Gemini Pro', inputTokens: 6543, outputTokens: 4321, totalTokens: 10864, cost: 0.76 },
  ];

  const chatStats: ChatStats = {
    totalChats: chats.length,
    totalMessages: messages.length,
    averageLength: messages.length > 0 ? messages.reduce((sum, msg) => sum + msg.content.length, 0) / messages.length : 0,
    mostUsedModel: 'GPT-4 Turbo',
    timeSpent: 847, // minutes
  };

  const totalCost = tokenUsage.reduce((sum, usage) => sum + usage.cost, 0);
  const totalTokens = tokenUsage.reduce((sum, usage) => sum + usage.totalTokens, 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="w-4 h-4" />
          Insights
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Chat Insights & Analytics
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Token Usage</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{chatStats.totalChats}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{chatStats.totalMessages}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    -5% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.floor(chatStats.timeSpent / 60)}h {chatStats.timeSpent % 60}m
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +15% from last week
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Most Used Models</CardTitle>
                  <CardDescription>
                    Your AI model preferences this week
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tokenUsage.map((usage, index) => (
                    <div key={usage.model} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium">{usage.model}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {((usage.totalTokens / totalTokens) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {usage.totalTokens.toLocaleString()} tokens
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chat Statistics</CardTitle>
                  <CardDescription>
                    Your conversation patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average message length</span>
                    <span className="text-sm font-medium">
                      {Math.round(chatStats.averageLength)} chars
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Most active time</span>
                    <span className="text-sm font-medium">2-4 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Favorite model</span>
                    <Badge variant="secondary">{chatStats.mostUsedModel}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response satisfaction</span>
                    <span className="text-sm font-medium">94%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Token Usage by Model</CardTitle>
                <CardDescription>
                  Detailed breakdown of your AI usage and costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tokenUsage.map((usage) => (
                    <div key={usage.model} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{usage.model}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">${usage.cost.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            {usage.totalTokens.toLocaleString()} tokens
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Input: {usage.inputTokens.toLocaleString()}</span>
                          <span>Output: {usage.outputTokens.toLocaleString()}</span>
                        </div>
                        <Progress value={(usage.totalTokens / totalTokens) * 100} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tokenUsage.map((usage) => (
                <Card key={usage.model}>
                  <CardHeader>
                    <CardTitle className="text-base">{usage.model}</CardTitle>
                    <CardDescription>Performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total tokens</span>
                      <span className="font-medium">{usage.totalTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total cost</span>
                      <span className="font-medium">${usage.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cost per token</span>
                      <span className="font-medium">
                        ${(usage.cost / usage.totalTokens * 1000).toFixed(4)}/1K
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Usage share</span>
                      <span className="font-medium">
                        {((usage.totalTokens / totalTokens) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Timeline</CardTitle>
                <CardDescription>
                  Your chat activity over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chats.slice(0, 10).map((chat) => (
                    <div key={chat.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{chat.title}</h4>
                          <time className="text-xs text-muted-foreground">
                            {format(new Date(chat.createdAt), 'MMM d, HH:mm')}
                          </time>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {chat.model}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Last updated {format(new Date(chat.updatedAt), 'MMM d')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}