/**
 * Electronics Learning Chat Component
 * 
 * This component extends the existing chat interface with electronics-specific
 * features including circuit visualization, mathematical rendering, and simulation.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  Calculator, 
  Eye, 
  BookOpen, 
  Lightbulb, 
  TrendingUp,
  CircuitBoard,
  Cpu,
  Activity,
  FileText,
  Play,
  Settings,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

import { electronicsEducationPipeline, ElectronicsResponse } from '@/services/electronics-pipeline';
import { mathRenderer } from '@/services/math/katex-renderer';
import { cn } from '@/lib/utils';

export interface ElectronicsMessage {
  id: string;
  type: 'user' | 'assistant' | 'electronics';
  content: string;
  electronicsResponse?: ElectronicsResponse;
  timestamp: Date;
}

interface ElectronicsLearningChatProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ElectronicsLearningChat({ 
  onSendMessage, 
  isLoading, 
  className 
}: ElectronicsLearningChatProps) {
  const [messages, setMessages] = useState<ElectronicsMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVisualization, setShowVisualization] = useState(true);
  const [showMath, setShowMath] = useState(true);
  const [userLevel, setUserLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const circuitCanvasRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Handle electronics-specific message processing
   */
  const handleElectronicsMessage = useCallback(async (message: string) => {
    setIsProcessing(true);
    
    try {
      // Process the message through the electronics pipeline
      const electronicsResponse = await electronicsEducationPipeline.processQuery(message, {
        userLevel,
        previousQueries: messages.map(m => m.content),
        preferences: {
          includeSimulation: true,
          includeVisualization: showVisualization,
          includeMath: showMath,
          mathDetail: userLevel === 'BEGINNER' ? 'BASIC' : 'DETAILED',
        },
      });

      // Create electronics message
      const electronicsMessage: ElectronicsMessage = {
        id: Date.now().toString(),
        type: 'electronics',
        content: message,
        electronicsResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, electronicsMessage]);
      
      // Also send to regular chat if requested
      if (onSendMessage) {
        onSendMessage(message);
      }
    } catch (error) {
      console.error('Error processing electronics message:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [userLevel, messages, showVisualization, showMath, onSendMessage]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: ElectronicsMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Check if message is electronics-related
    const electronicsKeywords = [
      'circuit', 'ohm', 'kcl', 'kvl', 'voltage', 'current', 'resistance',
      'capacitor', 'inductor', 'transistor', 'bjt', 'mosfet', 'amplifier',
      'filter', 'simulate', 'analyze', 'explain', 'calculate',
    ];
    
    const isElectronicsQuery = electronicsKeywords.some(keyword => 
      inputMessage.toLowerCase().includes(keyword)
    );

    if (isElectronicsQuery) {
      handleElectronicsMessage(inputMessage);
    } else if (onSendMessage) {
      onSendMessage(inputMessage);
    }

    setInputMessage('');
  }, [inputMessage, isProcessing, handleElectronicsMessage, onSendMessage]);

  /**
   * Render circuit visualization
   */
  const renderCircuitVisualization = useCallback((response: ElectronicsResponse) => {
    if (!response.circuit || !showVisualization) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircuitBoard className="w-5 h-5" />
            Circuit Diagram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={circuitCanvasRef}
            className="w-full h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
          >
            <div className="text-center text-gray-500">
              <CircuitBoard className="w-8 h-8 mx-auto mb-2" />
              <p>Circuit visualization will appear here</p>
              <p className="text-sm">Integration with GoJS pending</p>
            </div>
          </div>
          
          {response.circuit.components && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Components:</h4>
              <div className="flex flex-wrap gap-2">
                {response.circuit.components.map((component: any, index: number) => (
                  <Badge key={index} variant="secondary">
                    {component.name}: {component.value}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }, [showVisualization]);

  /**
   * Render simulation results
   */
  const renderSimulationResults = useCallback((response: ElectronicsResponse) => {
    if (!response.simulation) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Simulation Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {response.simulation.analysis}
              </pre>
            </div>
            
            {response.simulation.results.nodes && (
              <div>
                <h4 className="font-semibold mb-2">Node Voltages:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {response.simulation.results.nodes.map((node: any, index: number) => (
                    <div key={index} className="bg-blue-50 p-2 rounded">
                      <span className="font-medium">{node.name}:</span> {node.voltage.toFixed(3)}V
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {response.simulation.results.branches && (
              <div>
                <h4 className="font-semibold mb-2">Branch Currents:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {response.simulation.results.branches.map((branch: any, index: number) => (
                    <div key={index} className="bg-green-50 p-2 rounded">
                      <span className="font-medium">{branch.name}:</span> {(branch.current * 1000).toFixed(3)}mA
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }, []);

  /**
   * Render mathematics
   */
  const renderMathematics = useCallback((response: ElectronicsResponse) => {
    if (!response.mathematics || !showMath) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Mathematical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="math-content"
            dangerouslySetInnerHTML={{ __html: response.mathematics }}
          />
        </CardContent>
      </Card>
    );
  }, [showMath]);

  /**
   * Render learning recommendations
   */
  const renderLearningRecommendations = useCallback((response: ElectronicsResponse) => {
    if (!response.relatedTopics && !response.learningPath) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Learning Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="related" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="related">Related Topics</TabsTrigger>
              <TabsTrigger value="path">Learning Path</TabsTrigger>
            </TabsList>
            
            <TabsContent value="related" className="space-y-2">
              {response.relatedTopics?.map((topic, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleElectronicsMessage(`explain ${topic}`)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {topic}
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              ))}
            </TabsContent>
            
            <TabsContent value="path" className="space-y-2">
              {response.learningPath?.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </div>
                  <Button
                    variant="ghost"
                    className="flex-1 justify-start"
                    onClick={() => handleElectronicsMessage(`show example ${step}`)}
                  >
                    {step}
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }, [handleElectronicsMessage]);

  /**
   * Render electronics message
   */
  const renderElectronicsMessage = useCallback((message: ElectronicsMessage) => {
    const { electronicsResponse } = message;
    if (!electronicsResponse) return null;

    return (
      <div className="space-y-4">
        {/* Main explanation */}
        {electronicsResponse.explanation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Explanation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{electronicsResponse.explanation}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Circuit visualization */}
        {renderCircuitVisualization(electronicsResponse)}

        {/* Mathematics */}
        {renderMathematics(electronicsResponse)}

        {/* Simulation results */}
        {renderSimulationResults(electronicsResponse)}

        {/* Learning recommendations */}
        {renderLearningRecommendations(electronicsResponse)}
      </div>
    );
  }, [renderCircuitVisualization, renderMathematics, renderSimulationResults, renderLearningRecommendations]);

  /**
   * Render message
   */
  const renderMessage = useCallback((message: ElectronicsMessage) => {
    const isUser = message.type === 'user';
    
    return (
      <div
        key={message.id}
        className={cn(
          'flex gap-3 mb-6',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        <div className={cn(
          'max-w-3xl',
          isUser ? 'order-2' : 'order-1'
        )}>
          {/* Message avatar */}
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center mb-2',
            isUser ? 'bg-primary text-primary-foreground ml-auto' : 'bg-secondary text-secondary-foreground'
          )}>
            {isUser ? 'U' : (message.type === 'electronics' ? <Zap className="w-4 h-4" /> : 'A')}
          </div>
          
          {/* Message content */}
          <div className={cn(
            'rounded-lg p-4',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          )}>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          
          {/* Electronics response */}
          {message.type === 'electronics' && message.electronicsResponse && (
            <div className="mt-4">
              {renderElectronicsMessage(message)}
            </div>
          )}
        </div>
      </div>
    );
  }, [renderElectronicsMessage]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Electronics Learning Assistant</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVisualization(!showVisualization)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showVisualization ? 'Hide' : 'Show'} Circuits
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMath(!showMath)}
          >
            <Calculator className="w-4 h-4 mr-2" />
            {showMath ? 'Hide' : 'Show'} Math
          </Button>
          
          <select
            value={userLevel}
            onChange={(e) => setUserLevel(e.target.value as any)}
            className="px-3 py-1 rounded border bg-background"
          >
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Cpu className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Ready to Learn Electronics!</h3>
            <p className="text-muted-foreground mb-6">
              Ask me anything about circuits, components, or electrical engineering concepts.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Button
                variant="outline"
                className="h-auto p-4 text-left"
                onClick={() => handleElectronicsMessage('explain KCL with a 9V battery')}
              >
                <div>
                  <div className="font-semibold">Explain KCL</div>
                  <div className="text-sm text-muted-foreground">
                    Learn Kirchhoff's Current Law with examples
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto p-4 text-left"
                onClick={() => handleElectronicsMessage('simulate a common emitter amplifier')}
              >
                <div>
                  <div className="font-semibold">Simulate BJT Amplifier</div>
                  <div className="text-sm text-muted-foreground">
                    Analyze transistor amplifier circuits
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto p-4 text-left"
                onClick={() => handleElectronicsMessage('show voltage divider example')}
              >
                <div>
                  <div className="font-semibold">Voltage Divider</div>
                  <div className="text-sm text-muted-foreground">
                    Understand basic resistor networks
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto p-4 text-left"
                onClick={() => handleElectronicsMessage('calculate RC filter frequency response')}
              >
                <div>
                  <div className="font-semibold">RC Filter Analysis</div>
                  <div className="text-sm text-muted-foreground">
                    Analyze frequency response of filters
                  </div>
                </div>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {messages.map(renderMessage)}
            {isProcessing && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin">
                  <Settings className="w-4 h-4" />
                </div>
                <span>Processing electronics query...</span>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about electronics: circuits, components, analysis..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isProcessing}
          />
          <Button type="submit" disabled={isProcessing || !inputMessage.trim()}>
            <Play className="w-4 h-4" />
          </Button>
        </form>
      </div>
      
      {/* Add KaTeX styles */}
      <style jsx global>{`
        ${mathRenderer.getMathStyles()}
      `}</style>
    </div>
  );
}

export default ElectronicsLearningChat;
