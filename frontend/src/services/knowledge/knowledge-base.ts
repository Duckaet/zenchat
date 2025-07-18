/**
 * Electronics Knowledge Base
 * 
 * This service manages the structured repository of circuit templates,
 * component models, explanations, and educational content.
 */

import { Circuit, Component, ComponentType } from '@/types/electronics';

export interface CircuitTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category: CircuitCategory;
  netlist: string;
  components: ComponentTemplate[];
  connections: ConnectionTemplate[];
  learningObjectives: string[];
  prerequisites: string[];
  relatedConcepts: string[];
  estimatedTime: number; // minutes
  visualLayout: LayoutInfo;
}

export interface ComponentTemplate {
  id: string;
  type: ComponentType;
  name: string;
  value: string;
  model?: string;
  position: { x: number; y: number };
  rotation?: number;
  parameters?: Record<string, string | number>;
}

export interface ConnectionTemplate {
  id: string;
  from: string;
  to: string;
  points?: { x: number; y: number }[];
}

export interface LayoutInfo {
  width: number;
  height: number;
  gridSize: number;
  components: Record<string, { x: number; y: number; rotation?: number }>;
}

export interface ComponentModel {
  id: string;
  type: ComponentType;
  name: string;
  manufacturer?: string;
  partNumber?: string;
  spiceModel: string;
  parameters: Record<string, number | string>;
  description: string;
  datasheet?: string;
  packageType?: string;
  maxRatings?: Record<string, number>;
}

export interface ConceptExplanation {
  id: string;
  title: string;
  description: string;
  explanation: string;
  mathematics: string[];
  examples: string[];
  relatedConcepts: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  keywords: string[];
}

export type CircuitCategory = 
  | 'BASIC_LAWS'
  | 'RESISTIVE_CIRCUITS'
  | 'REACTIVE_CIRCUITS'
  | 'FILTERS'
  | 'AMPLIFIERS'
  | 'OSCILLATORS'
  | 'POWER_SUPPLIES'
  | 'DIGITAL_CIRCUITS'
  | 'SENSORS'
  | 'COMMUNICATION';

export class ElectronicsKnowledgeBase {
  private circuitTemplates: Map<string, CircuitTemplate> = new Map();
  private componentModels: Map<string, ComponentModel> = new Map();
  private conceptExplanations: Map<string, ConceptExplanation> = new Map();
  private initialized = false;

  constructor() {
    this.initializeKnowledgeBase();
  }

  /**
   * Initialize the knowledge base with built-in content
   */
  private async initializeKnowledgeBase(): Promise<void> {
    if (this.initialized) return;

    // Load circuit templates
    this.loadCircuitTemplates();
    
    // Load component models
    this.loadComponentModels();
    
    // Load concept explanations
    this.loadConceptExplanations();
    
    this.initialized = true;
    console.log('Electronics Knowledge Base initialized');
  }

  /**
   * Load built-in circuit templates
   */
  private loadCircuitTemplates(): void {
    // Voltage Divider
    this.circuitTemplates.set('voltage_divider', {
      id: 'voltage_divider',
      name: 'Voltage Divider',
      description: 'Basic voltage divider circuit demonstrating voltage division principle',
      difficulty: 'BEGINNER',
      category: 'RESISTIVE_CIRCUITS',
      netlist: `* Voltage Divider Circuit
V1 1 0 DC 9
R1 1 2 10k
R2 2 0 5k
.op
.end`,
      components: [
        {
          id: 'V1',
          type: 'VOLTAGE_SOURCE',
          name: 'V1',
          value: '9V',
          position: { x: 100, y: 100 },
        },
        {
          id: 'R1',
          type: 'RESISTOR',
          name: 'R1',
          value: '10k',
          position: { x: 200, y: 100 },
        },
        {
          id: 'R2',
          type: 'RESISTOR',
          name: 'R2',
          value: '5k',
          position: { x: 200, y: 200 },
        },
        {
          id: 'GND',
          type: 'GROUND',
          name: 'GND',
          value: '',
          position: { x: 100, y: 250 },
        },
      ],
      connections: [
        { id: 'conn1', from: 'V1', to: 'R1' },
        { id: 'conn2', from: 'R1', to: 'R2' },
        { id: 'conn3', from: 'R2', to: 'GND' },
        { id: 'conn4', from: 'V1', to: 'GND' },
      ],
      learningObjectives: [
        'Understand voltage division principle',
        'Calculate output voltage using voltage divider formula',
        'Analyze the effect of load resistance',
      ],
      prerequisites: ['Ohm\'s Law', 'Series resistance'],
      relatedConcepts: ['KVL', 'Series circuits', 'Voltage measurement'],
      estimatedTime: 15,
      visualLayout: {
        width: 400,
        height: 300,
        gridSize: 20,
        components: {
          'V1': { x: 100, y: 100 },
          'R1': { x: 200, y: 100 },
          'R2': { x: 200, y: 200 },
          'GND': { x: 100, y: 250 },
        },
      },
    });

    // Common Emitter Amplifier
    this.circuitTemplates.set('common_emitter', {
      id: 'common_emitter',
      name: 'Common Emitter Amplifier',
      description: 'Basic BJT common emitter amplifier with voltage divider bias',
      difficulty: 'INTERMEDIATE',
      category: 'AMPLIFIERS',
      netlist: `* Common Emitter Amplifier
VCC 1 0 DC 12
VIN 2 0 DC 0 AC 1m
R1 1 3 47k
R2 3 0 10k
RC 1 4 4.7k
RE 5 0 1k
C1 2 3 1u
C2 4 6 1u
CE 5 0 10u
Q1 4 3 5 2N3904
.op
.end`,
      components: [
        {
          id: 'VCC',
          type: 'VOLTAGE_SOURCE',
          name: 'VCC',
          value: '12V',
          position: { x: 100, y: 50 },
        },
        {
          id: 'VIN',
          type: 'VOLTAGE_SOURCE',
          name: 'VIN',
          value: '1mV',
          position: { x: 50, y: 150 },
        },
        {
          id: 'Q1',
          type: 'BJT',
          name: 'Q1',
          value: '2N3904',
          position: { x: 200, y: 150 },
        },
        {
          id: 'R1',
          type: 'RESISTOR',
          name: 'R1',
          value: '47k',
          position: { x: 150, y: 100 },
        },
        {
          id: 'R2',
          type: 'RESISTOR',
          name: 'R2',
          value: '10k',
          position: { x: 150, y: 200 },
        },
        {
          id: 'RC',
          type: 'RESISTOR',
          name: 'RC',
          value: '4.7k',
          position: { x: 200, y: 100 },
        },
        {
          id: 'RE',
          type: 'RESISTOR',
          name: 'RE',
          value: '1k',
          position: { x: 200, y: 200 },
        },
      ],
      connections: [
        { id: 'conn1', from: 'VCC', to: 'R1' },
        { id: 'conn2', from: 'R1', to: 'R2' },
        { id: 'conn3', from: 'R2', to: 'GND' },
        { id: 'conn4', from: 'VIN', to: 'Q1' },
        { id: 'conn5', from: 'Q1', to: 'RC' },
        { id: 'conn6', from: 'Q1', to: 'RE' },
      ],
      learningObjectives: [
        'Understand BJT operation in amplifier mode',
        'Calculate bias point and AC gain',
        'Analyze frequency response',
      ],
      prerequisites: ['BJT characteristics', 'Voltage divider', 'AC coupling'],
      relatedConcepts: ['Small signal analysis', 'Frequency response', 'Bias stability'],
      estimatedTime: 45,
      visualLayout: {
        width: 400,
        height: 300,
        gridSize: 20,
        components: {
          'VCC': { x: 100, y: 50 },
          'VIN': { x: 50, y: 150 },
          'Q1': { x: 200, y: 150 },
          'R1': { x: 150, y: 100 },
          'R2': { x: 150, y: 200 },
          'RC': { x: 200, y: 100 },
          'RE': { x: 200, y: 200 },
        },
      },
    });

    // RC Low Pass Filter
    this.circuitTemplates.set('rc_lowpass', {
      id: 'rc_lowpass',
      name: 'RC Low Pass Filter',
      description: 'First-order RC low pass filter for frequency response analysis',
      difficulty: 'INTERMEDIATE',
      category: 'FILTERS',
      netlist: `* RC Low Pass Filter
VIN 1 0 DC 0 AC 1
R1 1 2 1k
C1 2 0 1u
.ac dec 100 1 100k
.end`,
      components: [
        {
          id: 'VIN',
          type: 'VOLTAGE_SOURCE',
          name: 'VIN',
          value: '1V',
          position: { x: 100, y: 100 },
        },
        {
          id: 'R1',
          type: 'RESISTOR',
          name: 'R1',
          value: '1k',
          position: { x: 200, y: 100 },
        },
        {
          id: 'C1',
          type: 'CAPACITOR',
          name: 'C1',
          value: '1u',
          position: { x: 300, y: 150 },
        },
      ],
      connections: [
        { id: 'conn1', from: 'VIN', to: 'R1' },
        { id: 'conn2', from: 'R1', to: 'C1' },
        { id: 'conn3', from: 'C1', to: 'GND' },
        { id: 'conn4', from: 'VIN', to: 'GND' },
      ],
      learningObjectives: [
        'Understand frequency response of RC filters',
        'Calculate cutoff frequency',
        'Analyze Bode plot characteristics',
      ],
      prerequisites: ['AC analysis', 'Capacitive reactance', 'Complex impedance'],
      relatedConcepts: ['Frequency response', 'Bode plots', 'Transfer functions'],
      estimatedTime: 30,
      visualLayout: {
        width: 400,
        height: 250,
        gridSize: 20,
        components: {
          'VIN': { x: 100, y: 100 },
          'R1': { x: 200, y: 100 },
          'C1': { x: 300, y: 150 },
        },
      },
    });
  }

  /**
   * Load component models
   */
  private loadComponentModels(): void {
    // 2N3904 NPN BJT
    this.componentModels.set('2N3904', {
      id: '2N3904',
      type: 'BJT',
      name: '2N3904',
      manufacturer: 'Various',
      partNumber: '2N3904',
      spiceModel: `.model 2N3904 NPN(Is=6.734f Xti=3 Eg=1.11 Vaf=74.03 Bf=416.4 Ne=1.259
+ Ise=6.734f Ikf=66.78m Xtb=1.5 Br=.7371 Nc=2 Isc=0 Ikr=0 Rc=1
+ Cjc=3.638p Mjc=.3085 Vjc=.75 Fc=.5 Cje=4.493p Mje=.2593 Vje=.75
+ Tr=239.5n Tf=301.2p Itf=.4 Vtf=4 Xtf=2 Rb=10)`,
      parameters: {
        'Is': 6.734e-15,
        'Bf': 416.4,
        'Vaf': 74.03,
        'Ikf': 66.78e-3,
        'Cje': 4.493e-12,
        'Cjc': 3.638e-12,
        'Tf': 301.2e-12,
        'Tr': 239.5e-9,
      },
      description: 'General purpose NPN bipolar junction transistor',
      packageType: 'TO-92',
      maxRatings: {
        'Vceo': 40,
        'Ic': 0.2,
        'Pd': 0.625,
        'Tj': 150,
      },
    });

    // LM741 Op-Amp
    this.componentModels.set('LM741', {
      id: 'LM741',
      type: 'OPAMP',
      name: 'LM741',
      manufacturer: 'Texas Instruments',
      partNumber: 'LM741',
      spiceModel: `.subckt LM741 1 2 3 4 5
* Connections:   non-inverting input
*                | inverting input
*                | | positive power supply
*                | | | negative power supply
*                | | | | output
*                | | | | |
.model dx D(Is=800.0E-18 Rs=1)
.model dy D(Is=800.0E-18 Rs=1 Cjo=10p)
.model dz D(Is=800.0E-18 Rs=1 Ibv=18.0E-6 Bv=6.2)
Q1 11 2 13 qx1
Q2 12 1 14 qx2
Rc1 3 11 5.305E3
Rc2 3 12 5.305E3
Re1 13 10 1.836E3
Re2 14 10 1.836E3
Ree 10 99 13.19E6
Ro1 8 5 150
Ro2 7 99 150
Rp 3 4 18.16E3
C1 11 12 8.661E-12
C2 6 7 30.00E-12
.model qx1 NPN(Is=800.0E-18 Bf=93.75)
.model qx2 NPN(Is=800.0E-18 Bf=93.75)
.ends`,
      parameters: {
        'Slew_Rate': 0.5e6,
        'GBW': 1e6,
        'Input_Offset_Voltage': 1e-3,
        'Input_Bias_Current': 80e-9,
        'Supply_Voltage_Min': 5,
        'Supply_Voltage_Max': 22,
      },
      description: 'General purpose operational amplifier',
      packageType: 'DIP-8',
      maxRatings: {
        'Supply_Voltage': 22,
        'Input_Voltage': 22,
        'Output_Current': 25e-3,
        'Power_Dissipation': 500e-3,
      },
    });
  }

  /**
   * Load concept explanations
   */
  private loadConceptExplanations(): void {
    // Kirchhoff's Current Law
    this.conceptExplanations.set('KCL', {
      id: 'KCL',
      title: 'Kirchhoff\'s Current Law (KCL)',
      description: 'The algebraic sum of currents entering any node equals zero',
      explanation: `Kirchhoff's Current Law states that the sum of all currents flowing into a node must equal the sum of all currents flowing out of that node. This is a consequence of the conservation of electric charge.

      The law can be stated mathematically as: ∑I_in = ∑I_out, or equivalently, ∑I = 0 where currents entering the node are positive and currents leaving are negative.

      This fundamental principle is essential for analyzing circuits and is the basis for nodal analysis, one of the most powerful circuit analysis techniques.`,
      mathematics: [
        '\\sum_{k=1}^{n} I_k = 0',
        'I_1 + I_2 + I_3 + ... + I_n = 0',
        'I_{entering} = I_{leaving}',
      ],
      examples: [
        'Simple node with three branches',
        'Current division in parallel circuits',
        'Analysis of complex networks',
      ],
      relatedConcepts: ['KVL', 'Nodal Analysis', 'Current Division'],
      difficulty: 'BEGINNER',
      keywords: ['current', 'node', 'kirchhoff', 'conservation', 'charge'],
    });

    // Ohm's Law
    this.conceptExplanations.set('OHMS_LAW', {
      id: 'OHMS_LAW',
      title: 'Ohm\'s Law',
      description: 'The fundamental relationship between voltage, current, and resistance',
      explanation: `Ohm's Law describes the relationship between voltage (V), current (I), and resistance (R) in an electrical circuit. It states that the voltage across a resistor is directly proportional to the current flowing through it, with the constant of proportionality being the resistance.

      This law is fundamental to understanding electrical circuits and forms the basis for most circuit analysis techniques. It applies to ohmic materials where the resistance remains constant regardless of the voltage or current.`,
      mathematics: [
        'V = I \\cdot R',
        'I = \\frac{V}{R}',
        'R = \\frac{V}{I}',
        'P = V \\cdot I = I^2 \\cdot R = \\frac{V^2}{R}',
      ],
      examples: [
        'Calculate current through a 1kΩ resistor with 5V applied',
        'Determine power dissipation in a resistor',
        'Find required resistance for desired current',
      ],
      relatedConcepts: ['Power', 'Resistance', 'Voltage', 'Current'],
      difficulty: 'BEGINNER',
      keywords: ['voltage', 'current', 'resistance', 'ohm', 'power'],
    });

    // BJT Operation
    this.conceptExplanations.set('BJT', {
      id: 'BJT',
      title: 'Bipolar Junction Transistor (BJT)',
      description: 'Three-terminal semiconductor device used for amplification and switching',
      explanation: `A Bipolar Junction Transistor (BJT) is a three-terminal semiconductor device consisting of two p-n junctions. It has three regions: emitter, base, and collector. BJTs can be either NPN or PNP type.

      In the active region, the BJT acts as a current amplifier where a small base current controls a much larger collector current. The current gain (β or hFE) is the ratio of collector current to base current.

      BJTs are widely used in amplifier circuits, switches, and digital logic circuits due to their excellent current amplification properties.`,
      mathematics: [
        '\\beta = \\frac{I_C}{I_B}',
        '\\alpha = \\frac{I_C}{I_E}',
        'I_E = I_B + I_C',
        'g_m = \\frac{I_C}{V_T}',
        'V_T = \\frac{kT}{q} \\approx 26mV \\text{ at room temperature}',
      ],
      examples: [
        'Common emitter amplifier',
        'Voltage follower (emitter follower)',
        'Current mirror',
        'Differential amplifier',
      ],
      relatedConcepts: ['Amplifiers', 'Small Signal Analysis', 'Biasing', 'Frequency Response'],
      difficulty: 'INTERMEDIATE',
      keywords: ['transistor', 'amplifier', 'current gain', 'beta', 'emitter', 'collector', 'base'],
    });
  }

  /**
   * Get circuit template by ID
   */
  getCircuitTemplate(id: string): CircuitTemplate | null {
    return this.circuitTemplates.get(id) || null;
  }

  /**
   * Get all circuit templates by category
   */
  getCircuitTemplatesByCategory(category: CircuitCategory): CircuitTemplate[] {
    return Array.from(this.circuitTemplates.values())
      .filter(template => template.category === category);
  }

  /**
   * Get component model by part number
   */
  getComponentModel(partNumber: string): ComponentModel | null {
    return this.componentModels.get(partNumber) || null;
  }

  /**
   * Get concept explanation by ID
   */
  getConceptExplanation(conceptId: string): ConceptExplanation | null {
    return this.conceptExplanations.get(conceptId) || null;
  }

  /**
   * Search circuit templates by keywords
   */
  searchCircuitTemplates(keywords: string[]): CircuitTemplate[] {
    const results: CircuitTemplate[] = [];
    
    for (const template of this.circuitTemplates.values()) {
      const searchText = [
        template.name,
        template.description,
        ...template.learningObjectives,
        ...template.relatedConcepts,
      ].join(' ').toLowerCase();
      
      const matches = keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
      
      if (matches) {
        results.push(template);
      }
    }
    
    return results;
  }

  /**
   * Get recommended circuits based on difficulty progression
   */
  getRecommendedCircuits(currentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'): CircuitTemplate[] {
    const templates = Array.from(this.circuitTemplates.values());
    
    // Filter by appropriate difficulty level
    const filtered = templates.filter(template => {
      if (currentLevel === 'BEGINNER') {
        return template.difficulty === 'BEGINNER';
      } else if (currentLevel === 'INTERMEDIATE') {
        return template.difficulty === 'BEGINNER' || template.difficulty === 'INTERMEDIATE';
      } else {
        return true; // Advanced users can see all
      }
    });
    
    // Sort by estimated time and difficulty
    return filtered.sort((a, b) => {
      const difficultyOrder = { 'BEGINNER': 1, 'INTERMEDIATE': 2, 'ADVANCED': 3 };
      const diffA = difficultyOrder[a.difficulty];
      const diffB = difficultyOrder[b.difficulty];
      
      if (diffA !== diffB) {
        return diffA - diffB;
      }
      
      return a.estimatedTime - b.estimatedTime;
    });
  }

  /**
   * Get all available component models
   */
  getAllComponentModels(): ComponentModel[] {
    return Array.from(this.componentModels.values());
  }

  /**
   * Get all concept explanations
   */
  getAllConceptExplanations(): ConceptExplanation[] {
    return Array.from(this.conceptExplanations.values());
  }

  /**
   * Add custom circuit template
   */
  addCircuitTemplate(template: CircuitTemplate): void {
    this.circuitTemplates.set(template.id, template);
  }

  /**
   * Add custom component model
   */
  addComponentModel(model: ComponentModel): void {
    this.componentModels.set(model.id, model);
  }

  /**
   * Add custom concept explanation
   */
  addConceptExplanation(explanation: ConceptExplanation): void {
    this.conceptExplanations.set(explanation.id, explanation);
  }

  /**
   * Generate netlist from circuit template with custom parameters
   */
  generateNetlist(templateId: string, parameters: Record<string, string | number> = {}): string {
    const template = this.getCircuitTemplate(templateId);
    if (!template) {
      throw new Error(`Circuit template ${templateId} not found`);
    }

    let netlist = template.netlist;
    
    // Replace parameter placeholders
    Object.entries(parameters).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g');
      netlist = netlist.replace(placeholder, value.toString());
    });

    return netlist;
  }

  /**
   * Get learning path for a specific topic
   */
  getLearningPath(topic: string): CircuitTemplate[] {
    const path: CircuitTemplate[] = [];
    
    // Define learning progressions
    const progressions: Record<string, string[]> = {
      'amplifiers': ['voltage_divider', 'common_emitter', 'common_collector', 'differential_amplifier'],
      'filters': ['voltage_divider', 'rc_lowpass', 'rc_highpass', 'rlc_bandpass'],
      'basics': ['ohms_law', 'voltage_divider', 'current_divider', 'series_parallel'],
    };

    const templateIds = progressions[topic.toLowerCase()] || [];
    
    templateIds.forEach(id => {
      const template = this.getCircuitTemplate(id);
      if (template) {
        path.push(template);
      }
    });

    return path;
  }

  /**
   * Get statistics about the knowledge base
   */
  getStatistics(): {
    circuitTemplates: number;
    componentModels: number;
    conceptExplanations: number;
    categoryCounts: Record<CircuitCategory, number>;
    difficultyDistribution: Record<string, number>;
  } {
    const templates = Array.from(this.circuitTemplates.values());
    
    const categoryCounts: Record<CircuitCategory, number> = {} as Record<CircuitCategory, number>;
    const difficultyDistribution: Record<string, number> = {
      'BEGINNER': 0,
      'INTERMEDIATE': 0,
      'ADVANCED': 0,
    };

    templates.forEach(template => {
      categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
      difficultyDistribution[template.difficulty]++;
    });

    return {
      circuitTemplates: this.circuitTemplates.size,
      componentModels: this.componentModels.size,
      conceptExplanations: this.conceptExplanations.size,
      categoryCounts,
      difficultyDistribution,
    };
  }
}

// Export singleton instance
export const knowledgeBase = new ElectronicsKnowledgeBase();
