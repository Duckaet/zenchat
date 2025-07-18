import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageRenderer } from './MessageRenderer';
import { electronicsEducationPipeline, ElectronicsResponse } from '@/services/electronics-pipeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Zap, Calculator, Eye, BookOpen, Play, Pause, RotateCcw } from 'lucide-react';

interface ElectronicsMessageRendererProps {
  content: string;
  isElectronicsQuery?: boolean;
  onElectronicsResponse?: (response: ElectronicsResponse) => void;
}

export function ElectronicsMessageRenderer({ 
  content, 
  isElectronicsQuery = false,
  onElectronicsResponse 
}: ElectronicsMessageRendererProps) {
  const [electronicsResponse, setElectronicsResponse] = useState<ElectronicsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const circuitCanvasRef = useRef<HTMLDivElement>(null);

  // Detect if this is an electronics query
  const detectElectronicsQuery = (text: string): boolean => {
    const electronicsKeywords = [
      'circuit', 'voltage', 'current', 'resistance', 'capacitor', 'inductor',
      'transistor', 'diode', 'kcl', 'kvl', 'ohm', 'amplifier', 'filter',
      'oscillator', 'power', 'frequency', 'impedance', 'reactance'
    ];
    
    return electronicsKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  };

  const shouldProcessElectronics = isElectronicsQuery || detectElectronicsQuery(content);

  const processElectronicsQuery = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await electronicsEducationPipeline.processQuery(query);
      setElectronicsResponse(response);
      
      if (onElectronicsResponse) {
        onElectronicsResponse(response);
      }
    } catch (err) {
      console.error('Electronics processing error:', err);
      setError('Failed to process electronics query');
    } finally {
      setLoading(false);
    }
  }, [onElectronicsResponse]);

  useEffect(() => {
    if (shouldProcessElectronics && content.trim()) {
      processElectronicsQuery(content);
    }
  }, [content, shouldProcessElectronics, processElectronicsQuery]);

  const runSimulation = async () => {
    if (!electronicsResponse?.circuit?.netlist) return;
    
    try {
      setSimulationRunning(true);
      // Simulate running the SPICE simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would run the actual simulation
      console.log('Running simulation with netlist:', electronicsResponse.circuit.netlist);
      
      setSimulationRunning(false);
    } catch (err) {
      console.error('Simulation error:', err);
      setSimulationRunning(false);
    }
  };

  const renderCircuitVisualization = () => {
    if (!electronicsResponse?.circuit?.visualization) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Circuit Diagram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={circuitCanvasRef}
            className="circuit-container min-h-[300px] bg-white border rounded-lg p-4"
            style={{ width: '100%', height: '400px' }}
          >
            {/* Circuit visualization would be rendered here */}
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Eye className="w-8 h-8 mx-auto mb-2" />
                <p>Circuit visualization would appear here</p>
                <p className="text-sm mt-1">Components: {electronicsResponse.circuit.components?.length || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSimulationControls = () => {
    if (!electronicsResponse?.simulation) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Simulation Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={runSimulation}
                disabled={simulationRunning}
                className="flex items-center gap-2"
              >
                {simulationRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Simulation
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setElectronicsResponse(null)}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Simulation Analysis</h4>
                <div className="p-3 bg-muted/20 rounded-lg text-sm">
                  {electronicsResponse.simulation.analysis}
                </div>
              </div>
              
              {electronicsResponse.simulation.results && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Results</h4>
                  <div className="p-3 bg-muted/20 rounded-lg text-sm font-mono">
                    {typeof electronicsResponse.simulation.results === 'string' 
                      ? electronicsResponse.simulation.results 
                      : JSON.stringify(electronicsResponse.simulation.results, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMathSolutions = () => {
    if (!electronicsResponse?.mathematics) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Mathematical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="math-solution p-4 bg-muted/20 rounded-lg">
              <div dangerouslySetInnerHTML={{ __html: electronicsResponse.mathematics }} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderKnowledgeBase = () => {
    if (!electronicsResponse?.explanation && !electronicsResponse?.relatedTopics) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Knowledge Base
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {electronicsResponse.relatedTopics && (
              <div>
                <h4 className="font-medium text-sm mb-2">Related Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {electronicsResponse.relatedTopics.map((topic: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {electronicsResponse.explanation && (
              <div>
                <h4 className="font-medium text-sm mb-2">Explanation</h4>
                <div className="text-sm text-muted-foreground">
                  {electronicsResponse.explanation}
                </div>
              </div>
            )}
            
            {electronicsResponse.learningPath && (
              <div>
                <h4 className="font-medium text-sm mb-2">Learning Path</h4>
                <div className="space-y-2">
                  {electronicsResponse.learningPath.map((step: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!shouldProcessElectronics) {
    return <MessageRenderer content={content} />;
  }

  return (
    <div className="w-full space-y-4">
      {/* Original content */}
      <MessageRenderer content={content} />

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 animate-pulse" />
              <span>Processing electronics query...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="text-red-700 text-sm">
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Electronics response */}
      {electronicsResponse && (
        <div className="electronics-response">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="circuit">Circuit</TabsTrigger>
              <TabsTrigger value="simulation">Simulation</TabsTrigger>
              <TabsTrigger value="math">Mathematics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              {renderKnowledgeBase()}
            </TabsContent>
            
            <TabsContent value="circuit" className="space-y-4">
              {renderCircuitVisualization()}
            </TabsContent>
            
            <TabsContent value="simulation" className="space-y-4">
              {renderSimulationControls()}
            </TabsContent>
            
            <TabsContent value="math" className="space-y-4">
              {renderMathSolutions()}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
