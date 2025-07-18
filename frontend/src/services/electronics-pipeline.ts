/**
 * Enhanced Electronics NLP Pipeline
 * 
 * This service orchestrates the entire electronics learning pipeline by
 * integrating NLP processing, knowledge base retrieval, simulation, and visualization.
 */

import { ElectronicsNLP } from './electronicsNLP';
import { knowledgeBase } from './knowledge/knowledge-base';
import { ngSpiceEngine } from './simulation/ngspice';
import { mathRenderer } from './math/katex-renderer';
import { ElectronicsQuery, QueryIntent } from '@/types/electronics';

export interface ElectronicsResponse {
  success: boolean;
  intent: QueryIntent;
  explanation?: string;
  mathematics?: string;
  circuit?: {
    netlist: string;
    visualization: unknown;
    components: unknown[];
  };
  simulation?: {
    results: unknown;
    analysis: string;
  };
  relatedTopics?: string[];
  learningPath?: string[];
  error?: string;
}

export interface ProcessingContext {
  userLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  previousQueries: string[];
  currentTopic?: string;
  preferences: {
    includeSimulation: boolean;
    includeVisualization: boolean;
    includeMath: boolean;
    mathDetail: 'BASIC' | 'DETAILED' | 'ADVANCED';
  };
}

export class ElectronicsEducationPipeline {
  private nlpProcessor: ElectronicsNLP;
  private initialized = false;

  constructor() {
    this.nlpProcessor = new ElectronicsNLP();
  }

  /**
   * Initialize the pipeline
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize all services
      await Promise.all([
        // this.nlpProcessor.initialize?.(), // Remove this line as ElectronicsNLP doesn't have initialize method
        // Knowledge base initializes automatically
        // NgSpice engine initializes automatically
        // Math renderer initializes automatically
      ]);

      this.initialized = true;
      console.log('Electronics Education Pipeline initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Electronics Education Pipeline:', error);
      throw error;
    }
  }

  /**
   * Process a natural language query about electronics
   */
  async processQuery(
    query: string,
    context: ProcessingContext = {
      userLevel: 'BEGINNER',
      previousQueries: [],
      preferences: {
        includeSimulation: true,
        includeVisualization: true,
        includeMath: true,
        mathDetail: 'BASIC',
      },
    }
  ): Promise<ElectronicsResponse> {
    try {
      // Ensure pipeline is initialized
      await this.initialize();

      // Step 1: Process natural language query
      const electronicsQuery = await this.nlpProcessor.processQuery(query);
      
      // Step 2: Generate response based on intent
      const response = await this.generateResponse(electronicsQuery, context);
      
      // Step 3: Add learning recommendations
      response.relatedTopics = this.getRelatedTopics(electronicsQuery, context);
      response.learningPath = this.generateLearningPath(electronicsQuery, context);
      
      return response;
    } catch (error) {
      console.error('Error processing electronics query:', error);
      return {
        success: false,
        intent: 'GET_EXPLANATION',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate response based on query intent
   */
  private async generateResponse(
    query: ElectronicsQuery,
    context: ProcessingContext
  ): Promise<ElectronicsResponse> {
    switch (query.intent) {
      case 'GET_EXPLANATION':
        return await this.generateExplanationResponse(query, context);
      
      case 'RUN_SIMULATION':
        return await this.generateSimulationResponse(query, context);
      
      case 'ANALYZE_CIRCUIT':
        return await this.generateAnalysisResponse(query, context);
      
      case 'SHOW_EXAMPLE':
        return await this.generateExampleResponse(query, context);
      
      case 'CALCULATE_VALUES':
        return await this.generateCalculationResponse(query, context);
      
      case 'COMPARE_CIRCUITS':
        return await this.generateComparisonResponse(query, context);
      
      default:
        return {
          success: false,
          intent: query.intent,
          error: 'Unknown intent type',
        };
    }
  }

  /**
   * Generate explanation response
   */
  private async generateExplanationResponse(
    query: ElectronicsQuery,
    context: ProcessingContext
  ): Promise<ElectronicsResponse> {
    const response: ElectronicsResponse = {
      success: true,
      intent: 'GET_EXPLANATION',
    };

    // Extract concept from entities
    const conceptEntity = query.entities.find(e => e.label === 'CONCEPT');
    if (conceptEntity) {
      const conceptId = this.mapConceptToId(conceptEntity.text);
      const explanation = knowledgeBase.getConceptExplanation(conceptId);
      
      if (explanation) {
        response.explanation = explanation.explanation;
        
        // Add mathematics if requested
        if (context.preferences.includeMath) {
          response.mathematics = this.generateMathematicsExplanation(
            explanation,
            context.preferences.mathDetail
          );
        }
        
        // Add circuit example if available
        if (context.preferences.includeVisualization) {
          const circuit = await this.generateExampleCircuit(conceptId, query.params);
          if (circuit) {
            response.circuit = circuit;
          }
        }
      }
    }

    // Handle special cases like "KCL with 9V battery"
    if (query.params.concept === 'KCL' && query.params.voltage) {
      const voltage = parseFloat(query.params.voltage as string) || 9;
      response.mathematics = mathRenderer.generateKCLExplanation(voltage);
    }

    return response;
  }

  /**
   * Convert query parameters to the format expected by knowledgeBase
   */
  private convertParams(params: Record<string, string | number | boolean | string[]>): Record<string, string | number> {
    const converted: Record<string, string | number> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        converted[key] = value;
      } else if (typeof value === 'boolean') {
        converted[key] = value.toString();
      } else if (Array.isArray(value)) {
        converted[key] = value.join(',');
      }
    });
    
    return converted;
  }

  /**
   * Generate simulation response
   */
  private async generateSimulationResponse(
    query: ElectronicsQuery,
    context: ProcessingContext
  ): Promise<ElectronicsResponse> {
    const response: ElectronicsResponse = {
      success: true,
      intent: 'RUN_SIMULATION',
    };

    try {
      // Get circuit template
      const circuitTemplate = this.getCircuitFromQuery(query);
      if (!circuitTemplate) {
        throw new Error('No suitable circuit template found');
      }

      // Convert params to correct format
      const convertedParams = this.convertParams(query.params);

      // Generate netlist with custom parameters
      const netlist = knowledgeBase.generateNetlist(circuitTemplate.id, convertedParams);
      
      // Run simulation
      const simulationResult = await ngSpiceEngine.runSimulation({
        analysisType: 'DC_OPERATING_POINT',
        netlist,
        parameters: convertedParams,
      });

      if (simulationResult.success) {
        response.simulation = {
          results: simulationResult.data,
          analysis: this.generateSimulationAnalysis(simulationResult, context),
        };
        
        response.circuit = {
          netlist,
          visualization: await this.generateCircuitVisualization(circuitTemplate),
          components: circuitTemplate.components,
        };
      } else {
        throw new Error(simulationResult.error || 'Simulation failed');
      }
    } catch (error) {
      response.success = false;
      response.error = error instanceof Error ? error.message : 'Simulation error';
    }

    return response;
  }

  /**
   * Generate analysis response
   */
  private async generateAnalysisResponse(
    query: ElectronicsQuery,
    context: ProcessingContext
  ): Promise<ElectronicsResponse> {
    const response: ElectronicsResponse = {
      success: true,
      intent: 'ANALYZE_CIRCUIT',
    };

    // Extract component values from query
    const components = this.extractComponentValues(query);
    
    // Generate appropriate analysis
    if (components.resistors.length >= 2) {
      // Voltage divider analysis
      const r1 = components.resistors[0];
      const r2 = components.resistors[1];
      const vin = components.voltage || 9;
      
      response.mathematics = mathRenderer.generateVoltageDividerAnalysis(vin, r1, r2);
    }

    if (components.bjt) {
      // BJT amplifier analysis
      const vcc = components.voltage || 12;
      const rb = components.resistors[0] || 47000;
      const rc = components.resistors[1] || 4700;
      
      response.mathematics = mathRenderer.generateBJTAmplifierAnalysis(vcc, rb, rc);
    }

    return response;
  }

  /**
   * Generate example response
   */
  private async generateExampleResponse(
    query: ElectronicsQuery,
    context: ProcessingContext
  ): Promise<ElectronicsResponse> {
    const response: ElectronicsResponse = {
      success: true,
      intent: 'SHOW_EXAMPLE',
    };

    // Get examples based on concept
    const conceptEntity = query.entities.find(e => e.label === 'CONCEPT');
    if (conceptEntity) {
      const conceptId = this.mapConceptToId(conceptEntity.text);
      const templates = this.getExamplesForConcept(conceptId, context.userLevel);
      
      if (templates.length > 0) {
        const template = templates[0]; // Use first example
        response.circuit = {
          netlist: template.netlist,
          visualization: await this.generateCircuitVisualization(template),
          components: template.components,
        };
        
        response.explanation = template.description;
      }
    }

    return response;
  }

  /**
   * Generate calculation response
   */
  private async generateCalculationResponse(
    query: ElectronicsQuery,
    _context: ProcessingContext
  ): Promise<ElectronicsResponse> {
    const response: ElectronicsResponse = {
      success: true,
      intent: 'CALCULATE_VALUES',
    };

    // Extract values for calculation
    const values = this.extractCalculationValues(query);
    
    // Perform calculations based on detected pattern
    if (values.resistance && values.voltage) {
      // Ohm's law calculation
      const voltage = values.voltage as number;
      const resistance = values.resistance as number;
      const current = voltage / resistance;
      const power = voltage * current;
      
      response.mathematics = mathRenderer.generateStepByStepSolution(
        'Ohm\'s Law Calculation',
        [
          {
            id: 'given',
            description: `Given: V = ${voltage}V, R = ${resistance}Ω`,
            latex: `V = ${voltage}\\text{V}, \\quad R = ${resistance}\\Omega`,
          },
          {
            id: 'current',
            description: 'Calculate current using I = V/R:',
            latex: `I = \\frac{V}{R} = \\frac{${values.voltage}}{${values.resistance}} = ${current.toFixed(3)}\\text{A}`,
          },
          {
            id: 'power',
            description: 'Calculate power using P = VI:',
            latex: `P = V \\times I = ${values.voltage} \\times ${current.toFixed(3)} = ${power.toFixed(3)}\\text{W}`,
          },
        ]
      );
    }

    return response;
  }

  /**
   * Generate comparison response
   */
  private async generateComparisonResponse(
    query: ElectronicsQuery,
    _context: ProcessingContext
  ): Promise<ElectronicsResponse> {
    const response: ElectronicsResponse = {
      success: true,
      intent: 'COMPARE_CIRCUITS',
    };

    // Extract circuits to compare
    const circuits = this.extractCircuitsToCompare(query);
    
    if (circuits.length >= 2) {
      response.explanation = this.generateCircuitComparison(circuits[0], circuits[1]);
    }

    return response;
  }

  /**
   * Generate mathematics explanation
   */
  private generateMathematicsExplanation(
    explanation: { mathematics?: string[] },
    detail: 'BASIC' | 'DETAILED' | 'ADVANCED'
  ): string {
    const mathematics = explanation.mathematics || [];
    
    if (detail === 'BASIC') {
      return mathematics.slice(0, 2).map((latex: string) => 
        mathRenderer.renderExpression(latex, { displayMode: true })
      ).join('\n');
    }
    
    return mathematics.map((latex: string) => 
      mathRenderer.renderExpression(latex, { displayMode: true })
    ).join('\n');
  }

  /**
   * Generate example circuit for concept
   */
  private async generateExampleCircuit(
    conceptId: string,
    params: Record<string, any>
  ): Promise<any> {
    const template = knowledgeBase.getCircuitTemplate(conceptId);
    if (!template) return null;

    // Apply parameters to template
    const customNetlist = knowledgeBase.generateNetlist(template.id, params);
    
    return {
      netlist: customNetlist,
      visualization: await this.generateCircuitVisualization(template),
      components: template.components,
    };
  }

  /**
   * Generate circuit visualization
   */
  private async generateCircuitVisualization(template: unknown): Promise<unknown> {
    // This would integrate with the CircuitVisualizationEngine
    const templateData = template as {
      visualLayout?: unknown;
      components?: unknown;
      connections?: unknown;
    };
    
    return {
      layout: templateData.visualLayout,
      components: templateData.components,
      connections: templateData.connections,
    };
  }

  /**
   * Map concept text to knowledge base ID
   */
  private mapConceptToId(conceptText: string): string {
    const mapping: Record<string, string> = {
      'kcl': 'KCL',
      'kirchhoff\'s current law': 'KCL',
      'ohm\'s law': 'OHMS_LAW',
      'bjt': 'BJT',
      'common emitter': 'COMMON_EMITTER',
      'voltage divider': 'VOLTAGE_DIVIDER',
    };
    
    return mapping[conceptText.toLowerCase()] || conceptText.toUpperCase();
  }

  /**
   * Get circuit template from query
   */
  private getCircuitFromQuery(query: ElectronicsQuery): { id: string; components: unknown[] } | null {
    const conceptEntity = query.entities.find(e => e.label === 'CONCEPT');
    if (!conceptEntity) return null;

    const conceptId = this.mapConceptToId(conceptEntity.text);
    const template = knowledgeBase.getCircuitTemplate(conceptId.toLowerCase());
    
    if (!template) return null;
    
    return {
      id: template.id,
      components: template.components
    };
  }

  /**
   * Extract component values from query
   */
  private extractComponentValues(query: ElectronicsQuery): {
    resistors: number[];
    capacitors: number[];
    inductors: number[];
    voltage: number | null;
    current: number | null;
    bjt: string | null;
  } {
    const components = {
      resistors: [] as number[],
      capacitors: [] as number[],
      inductors: [] as number[],
      voltage: null as number | null,
      current: null as number | null,
      bjt: null as string | null,
    };

    query.entities.forEach(entity => {
      if (entity.label === 'VALUE') {
        const value = this.parseValue(entity.text);
        if (entity.text.includes('k') || entity.text.includes('Ω')) {
          components.resistors.push(value);
        } else if (entity.text.includes('V')) {
          components.voltage = value;
        } else if (entity.text.includes('A')) {
          components.current = value;
        }
      } else if (entity.label === 'PART_NUMBER') {
        components.bjt = entity.text;
      }
    });

    return components;
  }

  /**
   * Parse value with units
   */
  private parseValue(valueText: string): number {
    const multipliers: Record<string, number> = {
      'p': 1e-12,
      'n': 1e-9,
      'u': 1e-6,
      'm': 1e-3,
      'k': 1e3,
      'M': 1e6,
      'G': 1e9,
    };

    const match = valueText.match(/(\d+(?:\.\d+)?)\s*([pnumkMG]?)/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const prefix = match[2];
    const multiplier = multipliers[prefix] || 1;

    return value * multiplier;
  }

  /**
   * Extract values for calculation
   */
  private extractCalculationValues(query: ElectronicsQuery): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    
    query.entities.forEach(entity => {
      if (entity.label === 'VALUE') {
        const value = this.parseValue(entity.text);
        if (entity.text.includes('Ω') || entity.text.includes('ohm')) {
          values.resistance = value;
        } else if (entity.text.includes('V')) {
          values.voltage = value;
        } else if (entity.text.includes('A')) {
          values.current = value;
        }
      }
    });

    return values;
  }

  /**
   * Extract circuits to compare
   */
  private extractCircuitsToCompare(_query: ElectronicsQuery): unknown[] {
    // Implementation would extract multiple circuit references
    return [];
  }

  /**
   * Generate circuit comparison
   */
  private generateCircuitComparison(circuit1: unknown, circuit2: unknown): string {
    const c1 = circuit1 as { name?: string };
    const c2 = circuit2 as { name?: string };
    return `Comparing ${c1.name || 'Circuit 1'} vs ${c2.name || 'Circuit 2'}...`;
  }

  /**
   * Generate simulation analysis
   */
  private generateSimulationAnalysis(simulationResult: unknown, _context: ProcessingContext): string {
    const analysis = ['Simulation Results Analysis:'];
    
    // Handle simulation results structure
    const result = simulationResult as { data?: { nodes?: unknown[]; branches?: unknown[] } };
    if (result.data?.nodes) {
      result.data.nodes.forEach((node: unknown) => {
        const n = node as { name?: string; voltage?: number | number[] };
        const voltage = typeof n.voltage === 'number' ? n.voltage : (n.voltage as number[])?.[0] || 0;
        analysis.push(`Node ${n.name || 'unknown'}: ${voltage.toFixed(3)}V`);
      });
    }
    
    if (result.data?.branches) {
      result.data.branches.forEach((branch: unknown) => {
        const b = branch as { name?: string; current?: number | number[] };
        const current = typeof b.current === 'number' ? b.current : (b.current as number[])?.[0] || 0;
        analysis.push(`Branch ${b.name || 'unknown'}: ${(current * 1000).toFixed(3)}mA`);
      });
    }
    
    return analysis.join('\n');
  }

  /**
   * Get related topics
   */
  private getRelatedTopics(query: ElectronicsQuery, _context: ProcessingContext): string[] {
    const conceptEntity = query.entities.find(e => e.label === 'CONCEPT');
    if (!conceptEntity) return [];

    const conceptId = this.mapConceptToId(conceptEntity.text);
    const explanation = knowledgeBase.getConceptExplanation(conceptId);
    
    return explanation?.relatedConcepts || [];
  }

  /**
   * Generate learning path
   */
  private generateLearningPath(query: ElectronicsQuery, _context: ProcessingContext): string[] {
    const conceptEntity = query.entities.find(e => e.label === 'CONCEPT');
    if (!conceptEntity) return [];

    const conceptId = this.mapConceptToId(conceptEntity.text);
    const path = knowledgeBase.getLearningPath(conceptId);
    
    return path.map(template => template.name);
  }

  /**
   * Get examples for concept
   */
  private getExamplesForConcept(conceptId: string, _userLevel: string): unknown[] {
    const template = knowledgeBase.getCircuitTemplate(conceptId.toLowerCase());
    return template ? [template] : [];
  }
}

// Export singleton instance
export const electronicsEducationPipeline = new ElectronicsEducationPipeline();
