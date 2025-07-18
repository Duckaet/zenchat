/**
 * NgSpice WebAssembly Simulation Engine
 * 
 * This module provides the client-side SPICE simulation capabilities
 * by wrapping the ngspice WebAssembly module.
 */

export interface SimulationResult {
  success: boolean;
  analysis: AnalysisType;
  data: SimulationData;
  error?: string;
}

export interface SimulationData {
  nodes: NodeResult[];
  branches: BranchResult[];
  frequency?: number[];
  time?: number[];
  vectors: Record<string, number[]>;
}

export interface NodeResult {
  id: string;
  name: string;
  voltage: number | number[];
  phase?: number | number[];
}

export interface BranchResult {
  id: string;
  name: string;
  current: number | number[];
  phase?: number | number[];
  power?: number | number[];
}

export type AnalysisType = 
  | 'DC_OPERATING_POINT'
  | 'DC_SWEEP'
  | 'AC_ANALYSIS'
  | 'TRANSIENT_ANALYSIS'
  | 'NOISE_ANALYSIS';

export interface SimulationConfig {
  analysisType: AnalysisType;
  netlist: string;
  parameters?: Record<string, string | number>;
  temperature?: number;
  options?: SpiceOptions;
}

export interface SpiceOptions {
  gmin?: number;
  abstol?: number;
  reltol?: number;
  vntol?: number;
  temp?: number;
  tnom?: number;
  method?: 'gear' | 'trap' | 'euler';
  maxiter?: number;
  pivrel?: number;
  pivabs?: number;
}

class NgSpiceEngine {
  private wasmModule: any = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initialize();
  }

  /**
   * Initialize the NgSpice WebAssembly module
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // For now, we'll use a mock implementation since the WASM module isn't available
      // In a real implementation, you would load the actual ngspice WASM module
      console.warn('NGSPICE WASM module not available, using mock implementation');
      
      // Mock WASM module interface
      this.wasmModule = {
        ngSpice_Init: () => console.log('Mock ngSpice_Init called'),
        ngSpice_Circ: (netlist: string) => {
          console.log('Mock ngSpice_Circ called with:', netlist);
          return 0; // Success
        },
        ngSpice_Command: (command: string) => {
          console.log('Mock ngSpice_Command called with:', command);
          return 0; // Success
        },
        ngSpice_CurPlot: () => 'mock_plot',
        ngSpice_AllPlots: () => ['mock_plot'],
        ngSpice_AllVecs: () => ['v(n1)', 'v(n2)', 'i(r1)'],
        ngSpice_GVec: (vecName: string) => {
          console.log('Mock ngSpice_GVec called with:', vecName);
          return {
            name: vecName,
            type: 'voltage',
            length: 10,
            data: Array.from({ length: 10 }, (_, i) => Math.sin(i * 0.1) * 5)
          };
        }
      };
      
      this.wasmModule.ngSpice_Init();
      this.isInitialized = true;
      console.log('NgSpice mock module initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NgSpice module:', error);
      throw new Error('NgSpice initialization failed');
    }
  }

  /**
   * Run a SPICE simulation
   */
  async runSimulation(config: SimulationConfig): Promise<SimulationResult> {
    await this.initPromise;
    
    if (!this.isInitialized) {
      throw new Error('NgSpice engine not initialized');
    }

    try {
      // Prepare the netlist with analysis commands
      const fullNetlist = this.prepareNetlist(config);
      
      // Load the circuit
      const circuitLines = fullNetlist.split('\n');
      const result = this.wasmModule.ngSpice_Circ(circuitLines);
      
      if (result !== 0) {
        throw new Error(`Failed to load circuit: ${result}`);
      }

      // Run the simulation
      const runResult = this.wasmModule.ngSpice_Command('run');
      if (runResult !== 0) {
        throw new Error(`Simulation failed: ${runResult}`);
      }

      // Extract results
      const simulationData = this.extractResults(config.analysisType);
      
      return {
        success: true,
        analysis: config.analysisType,
        data: simulationData,
      };
    } catch (error) {
      return {
        success: false,
        analysis: config.analysisType,
        data: { nodes: [], branches: [], vectors: {} },
        error: error instanceof Error ? error.message : 'Unknown simulation error',
      };
    }
  }

  /**
   * Prepare the complete netlist with analysis commands
   */
  private prepareNetlist(config: SimulationConfig): string {
    const { netlist, analysisType, parameters = {}, temperature = 27 } = config;
    
    let fullNetlist = netlist;
    
    // Add title if not present
    if (!fullNetlist.trim().startsWith('*') && !fullNetlist.trim().match(/^[a-zA-Z]/)) {
      fullNetlist = 'Electronic Circuit Analysis\n' + fullNetlist;
    }
    
    // Add temperature setting
    fullNetlist += `\n.temp ${temperature}`;
    
    // Add parameter definitions
    Object.entries(parameters).forEach(([key, value]) => {
      fullNetlist += `\n.param ${key}=${value}`;
    });
    
    // Add analysis commands based on type
    switch (analysisType) {
      case 'DC_OPERATING_POINT':
        fullNetlist += '\n.op';
        break;
      case 'DC_SWEEP':
        fullNetlist += '\n.dc V1 0 10 0.1';
        break;
      case 'AC_ANALYSIS':
        fullNetlist += '\n.ac dec 100 1 1meg';
        break;
      case 'TRANSIENT_ANALYSIS':
        fullNetlist += '\n.tran 1u 1m';
        break;
      case 'NOISE_ANALYSIS':
        fullNetlist += '\n.noise v(out) V1 dec 100 1 1meg';
        break;
    }
    
    // Add control commands
    fullNetlist += '\n.control';
    fullNetlist += '\nrun';
    fullNetlist += '\nprint all';
    fullNetlist += '\n.endc';
    
    // Add end
    fullNetlist += '\n.end';
    
    return fullNetlist;
  }

  /**
   * Extract simulation results from NgSpice
   */
  private extractResults(analysisType: AnalysisType): SimulationData {
    const nodes: NodeResult[] = [];
    const branches: BranchResult[] = [];
    const vectors: Record<string, number[]> = {};
    
    try {
      // Get all available vectors
      const vectorNames = this.wasmModule.ngSpice_AllVecs();
      
      for (const vecName of vectorNames) {
        const vecData = this.wasmModule.ngSpice_GetVecData(vecName);
        
        if (vecData) {
          vectors[vecName] = vecData;
          
          // Classify as node voltage or branch current
          if (vecName.startsWith('v(') || vecName.startsWith('V(')) {
            const nodeName = vecName.replace(/^v?\(/, '').replace(/\)$/, '');
            nodes.push({
              id: nodeName,
              name: nodeName,
              voltage: vecData.length === 1 ? vecData[0] : vecData,
            });
          } else if (vecName.startsWith('i(') || vecName.startsWith('I(')) {
            const branchName = vecName.replace(/^i?\(/, '').replace(/\)$/, '');
            branches.push({
              id: branchName,
              name: branchName,
              current: vecData.length === 1 ? vecData[0] : vecData,
            });
          }
        }
      }
      
      // Get frequency/time vectors if available
      const freqData = this.wasmModule.ngSpice_GetVecData('frequency');
      const timeData = this.wasmModule.ngSpice_GetVecData('time');
      
      return {
        nodes,
        branches,
        vectors,
        frequency: freqData || undefined,
        time: timeData || undefined,
      };
    } catch (error) {
      console.error('Error extracting simulation results:', error);
      return { nodes, branches, vectors };
    }
  }

  /**
   * Get available analysis types
   */
  getAvailableAnalyses(): AnalysisType[] {
    return [
      'DC_OPERATING_POINT',
      'DC_SWEEP',
      'AC_ANALYSIS',
      'TRANSIENT_ANALYSIS',
      'NOISE_ANALYSIS',
    ];
  }

  /**
   * Validate netlist syntax
   */
  validateNetlist(netlist: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = netlist.trim().split('\n');
    
    // Basic validation rules
    if (lines.length === 0) {
      errors.push('Netlist is empty');
    }
    
    // Check for required elements
    const hasGround = lines.some(line => 
      line.toLowerCase().includes('0') || 
      line.toLowerCase().includes('gnd') || 
      line.toLowerCase().includes('ground')
    );
    
    if (!hasGround) {
      errors.push('Circuit must have a ground node (node 0)');
    }
    
    // Check for voltage source
    const hasVoltageSource = lines.some(line => 
      line.trim().toLowerCase().startsWith('v') ||
      line.trim().toLowerCase().startsWith('vdc') ||
      line.trim().toLowerCase().startsWith('vac')
    );
    
    if (!hasVoltageSource) {
      errors.push('Circuit should have at least one voltage source');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.wasmModule && this.isInitialized) {
      this.wasmModule.ngSpice_Cleanup();
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const ngSpiceEngine = new NgSpiceEngine();
