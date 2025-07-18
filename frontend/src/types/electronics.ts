// Core Electronics Domain Types
export interface ElectronicsQuery {
  intent: QueryIntent;
  entities: ExtractedEntity[];
  params: Record<string, string | number | boolean | string[]>;
}

export type QueryIntent = 
  | 'GET_EXPLANATION'
  | 'RUN_SIMULATION'
  | 'ANALYZE_CIRCUIT'
  | 'SHOW_EXAMPLE'
  | 'COMPARE_CIRCUITS'
  | 'CALCULATE_VALUES';

export interface ExtractedEntity {
  text: string;
  label: EntityLabel;
  start: number;
  end: number;
  confidence: number;
}

export type EntityLabel = 
  | 'CONCEPT'
  | 'COMPONENT'
  | 'PART_NUMBER'
  | 'VALUE'
  | 'UNIT'
  | 'NODE'
  | 'CIRCUIT_TYPE'
  | 'ANALYSIS_TYPE';

// Circuit and Component Types
export interface Circuit {
  id: string;
  name: string;
  description: string;
  netlist: string;
  components: Component[];
  nodes: Node[];
  connections: Connection[];
  metadata: CircuitMetadata;
}

export interface Component {
  id: string;
  type: ComponentType;
  name: string;
  value?: string;
  unit?: string;
  model?: string;
  partNumber?: string;
  position: Position;
  connections: string[]; // node IDs
  parameters: Record<string, string | number | boolean>;
}

export type ComponentType = 
  | 'RESISTOR'
  | 'CAPACITOR'
  | 'INDUCTOR'
  | 'VOLTAGE_SOURCE'
  | 'CURRENT_SOURCE'
  | 'DIODE'
  | 'BJT'
  | 'MOSFET'
  | 'OPAMP'
  | 'TRANSFORMER'
  | 'SWITCH'
  | 'GROUND';

export interface Node {
  id: string;
  name: string;
  position: Position;
  voltage?: number;
  isGround?: boolean;
}

export interface Connection {
  id: string;
  from: string; // node ID
  to: string; // node ID
  current?: number;
  resistance?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface CircuitMetadata {
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  concepts: string[];
  learningObjectives: string[];
  prerequisites: string[];
  estimatedTime: number; // minutes
}

// Simulation Types
export interface SimulationRequest {
  netlist: string;
  analysisType: AnalysisType;
  parameters: SimulationParameters;
}

export type AnalysisType = 
  | 'DC_OPERATING_POINT'
  | 'DC_SWEEP'
  | 'AC_ANALYSIS'
  | 'TRANSIENT_ANALYSIS'
  | 'NOISE_ANALYSIS';

export interface SimulationParameters {
  startTime?: number;
  stopTime?: number;
  stepSize?: number;
  startFreq?: number;
  stopFreq?: number;
  pointsPerDecade?: number;
  temperature?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface SimulationResult {
  analysisType: AnalysisType;
  data: SimulationData;
  nodes: NodeResult[];
  branches: BranchResult[];
  success: boolean;
  error?: string;
  warnings?: string[];
}

export interface SimulationData {
  variables: string[];
  values: number[][];
  units: string[];
  scale: number[];
}

export interface NodeResult {
  nodeId: string;
  voltage: number;
  current?: number;
}

export interface BranchResult {
  componentId: string;
  current: number;
  voltage: number;
  power: number;
}

// Knowledge Base Types
export interface ConceptDefinition {
  id: string;
  name: string;
  category: ConceptCategory;
  description: string;
  explanation: string;
  equations: Equation[];
  canonicalCircuit: Circuit;
  solvedExamples: SolvedExample[];
  relatedConcepts: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tags: string[];
}

export type ConceptCategory = 
  | 'DC_FUNDAMENTALS'
  | 'AC_ANALYSIS'
  | 'SEMICONDUCTORS'
  | 'AMPLIFIERS'
  | 'FILTERS'
  | 'POWER_ELECTRONICS'
  | 'DIGITAL_CIRCUITS'
  | 'CONTROL_SYSTEMS';

export interface Equation {
  id: string;
  name: string;
  latex: string;
  variables: Variable[];
  description: string;
  conditions?: string;
}

export interface Variable {
  symbol: string;
  name: string;
  unit: string;
  description: string;
}

export interface SolvedExample {
  id: string;
  title: string;
  problem: string;
  solution: SolutionStep[];
  finalAnswer: string;
  circuit: Circuit;
  simulationResult: SimulationResult;
}

export interface SolutionStep {
  stepNumber: number;
  description: string;
  equation?: string;
  calculation?: string;
  result?: string;
  explanation?: string;
}

// Component Library Types
export interface ComponentLibrary {
  categories: ComponentCategory[];
  components: ComponentDefinition[];
  models: ComponentModel[];
}

export interface ComponentCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  components: string[]; // component IDs
}

export interface ComponentDefinition {
  id: string;
  name: string;
  type: ComponentType;
  symbol: string; // SVG or path to symbol
  defaultValue?: string;
  valueRange?: ValueRange;
  pins: Pin[];
  description: string;
  datasheet?: string;
  applications: string[];
  spiceModel?: string;
}

export interface ValueRange {
  min: number;
  max: number;
  step: number;
  unit: string;
  scale: 'LINEAR' | 'LOG';
}

export interface Pin {
  id: string;
  name: string;
  type: 'INPUT' | 'OUTPUT' | 'BIDIRECTIONAL' | 'POWER' | 'GROUND';
  position: Position;
  description?: string;
}

export interface ComponentModel {
  id: string;
  componentId: string;
  name: string;
  type: 'SPICE' | 'BEHAVIORAL' | 'SUBCIRCUIT';
  modelText: string;
  parameters: ModelParameter[];
  description: string;
  manufacturer?: string;
  partNumber?: string;
}

export interface ModelParameter {
  name: string;
  value: number | string;
  unit?: string;
  description: string;
}

// Response Types
export interface ElectronicsResponse {
  type: ResponseType;
  content: ResponseContent;
  metadata: ResponseMetadata;
}

export type ResponseType = 
  | 'EXPLANATION'
  | 'SIMULATION'
  | 'CIRCUIT_DIAGRAM'
  | 'CALCULATION'
  | 'EXAMPLE'
  | 'COMPARISON';

export interface ResponseContent {
  text?: string;
  equations?: Equation[];
  circuit?: Circuit;
  simulation?: SimulationResult;
  calculations?: CalculationStep[];
  examples?: SolvedExample[];
  visualizations?: Visualization[];
}

export interface CalculationStep {
  step: number;
  description: string;
  formula: string;
  substitution: string;
  result: string;
  unit: string;
}

export interface Visualization {
  type: 'CIRCUIT' | 'GRAPH' | 'WAVEFORM' | '3D_MODEL';
  data: Record<string, unknown>;
  config: VisualizationConfig;
}

export interface VisualizationConfig {
  width?: number;
  height?: number;
  interactive?: boolean;
  showAnimations?: boolean;
  colorScheme?: 'LIGHT' | 'DARK' | 'AUTO';
  showValues?: boolean;
  showCurrentFlow?: boolean;
  showVoltageColors?: boolean;
}

export interface ResponseMetadata {
  processingTime: number;
  sources: string[];
  confidence: number;
  suggestions: string[];
  relatedTopics: string[];
}

// Error Types
export interface ElectronicsError {
  code: string;
  message: string;
  details?: Record<string, string | number | boolean>;
  suggestions?: string[];
}
