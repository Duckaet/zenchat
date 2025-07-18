import { ElectronicsQuery, QueryIntent, ExtractedEntity } from '@/types/electronics';

// Electronics domain vocabulary and patterns
const ELECTRONICS_VOCABULARY = {
  CONCEPTS: {
    'ohm\'s law': 'OHMS_LAW',
    'ohms law': 'OHMS_LAW',
    'kcl': 'KCL',
    'kirchhoff\'s current law': 'KCL',
    'kirchhoffs current law': 'KCL',
    'kvl': 'KVL',
    'kirchhoff\'s voltage law': 'KVL',
    'kirchhoffs voltage law': 'KVL',
    'voltage divider': 'VOLTAGE_DIVIDER',
    'current divider': 'CURRENT_DIVIDER',
    'common emitter': 'COMMON_EMITTER',
    'common collector': 'COMMON_COLLECTOR',
    'common base': 'COMMON_BASE',
    'common source': 'COMMON_SOURCE',
    'common drain': 'COMMON_DRAIN',
    'common gate': 'COMMON_GATE',
    'bjt': 'BJT',
    'bipolar junction transistor': 'BJT',
    'mosfet': 'MOSFET',
    'fet': 'FET',
    'field effect transistor': 'FET',
    'amplifier': 'AMPLIFIER',
    'filter': 'FILTER',
    'low pass filter': 'LOW_PASS_FILTER',
    'high pass filter': 'HIGH_PASS_FILTER',
    'band pass filter': 'BAND_PASS_FILTER',
    'rc circuit': 'RC_CIRCUIT',
    'rl circuit': 'RL_CIRCUIT',
    'lc circuit': 'LC_CIRCUIT',
    'rlc circuit': 'RLC_CIRCUIT',
    'diode': 'DIODE',
    'zener diode': 'ZENER_DIODE',
    'op amp': 'OPAMP',
    'operational amplifier': 'OPAMP',
    'inverting amplifier': 'INVERTING_AMPLIFIER',
    'non-inverting amplifier': 'NON_INVERTING_AMPLIFIER',
    'rectifier': 'RECTIFIER',
    'half wave rectifier': 'HALF_WAVE_RECTIFIER',
    'full wave rectifier': 'FULL_WAVE_RECTIFIER',
    'bridge rectifier': 'BRIDGE_RECTIFIER',
  },
  
  COMPONENTS: {
    'resistor': 'RESISTOR',
    'capacitor': 'CAPACITOR',
    'inductor': 'INDUCTOR',
    'voltage source': 'VOLTAGE_SOURCE',
    'current source': 'CURRENT_SOURCE',
    'battery': 'VOLTAGE_SOURCE',
    'bjt': 'BJT',
    'transistor': 'BJT',
    'mosfet': 'MOSFET',
    'diode': 'DIODE',
    'led': 'LED',
    'switch': 'SWITCH',
    'ground': 'GROUND',
    'transformer': 'TRANSFORMER',
    'op amp': 'OPAMP',
    'operational amplifier': 'OPAMP',
  },
  
  PART_NUMBERS: {
    '2n3904': '2N3904',
    '2n3906': '2N3906',
    '2n2222': '2N2222',
    '2n2907': '2N2907',
    'bc547': 'BC547',
    'bc557': 'BC557',
    'lm741': 'LM741',
    'lm324': 'LM324',
    'lm358': 'LM358',
    'ne555': 'NE555',
    '1n4148': '1N4148',
    '1n4007': '1N4007',
    'irf540': 'IRF540',
    'irfz44': 'IRFZ44',
  },
  
  UNITS: {
    'ohm': 'Ω',
    'ohms': 'Ω',
    'volt': 'V',
    'volts': 'V',
    'ampere': 'A',
    'amperes': 'A',
    'amp': 'A',
    'amps': 'A',
    'watt': 'W',
    'watts': 'W',
    'farad': 'F',
    'farads': 'F',
    'henry': 'H',
    'henries': 'H',
    'hertz': 'Hz',
    'hz': 'Hz',
    'khz': 'kHz',
    'mhz': 'MHz',
    'ghz': 'GHz',
    'microfarad': 'μF',
    'nanofarad': 'nF',
    'picofarad': 'pF',
    'milliamp': 'mA',
    'microamp': 'μA',
    'millivolt': 'mV',
    'microvolt': 'μV',
    'kilohm': 'kΩ',
    'megohm': 'MΩ',
  },
  
  ANALYSIS_TYPES: {
    'dc analysis': 'DC_OPERATING_POINT',
    'dc operating point': 'DC_OPERATING_POINT',
    'ac analysis': 'AC_ANALYSIS',
    'transient analysis': 'TRANSIENT_ANALYSIS',
    'time domain': 'TRANSIENT_ANALYSIS',
    'frequency domain': 'AC_ANALYSIS',
    'frequency response': 'AC_ANALYSIS',
    'bode plot': 'AC_ANALYSIS',
    'sweep': 'DC_SWEEP',
    'dc sweep': 'DC_SWEEP',
    'parameter sweep': 'DC_SWEEP',
  },
  
  INTENT_PATTERNS: {
    'explain': 'GET_EXPLANATION',
    'what is': 'GET_EXPLANATION',
    'how does': 'GET_EXPLANATION',
    'describe': 'GET_EXPLANATION',
    'definition': 'GET_EXPLANATION',
    'simulate': 'RUN_SIMULATION',
    'run simulation': 'RUN_SIMULATION',
    'analyze': 'ANALYZE_CIRCUIT',
    'calculate': 'CALCULATE_VALUES',
    'find': 'CALCULATE_VALUES',
    'determine': 'CALCULATE_VALUES',
    'show': 'SHOW_EXAMPLE',
    'example': 'SHOW_EXAMPLE',
    'demonstrate': 'SHOW_EXAMPLE',
    'compare': 'COMPARE_CIRCUITS',
    'difference': 'COMPARE_CIRCUITS',
    'versus': 'COMPARE_CIRCUITS',
    'vs': 'COMPARE_CIRCUITS',
  }
};

// Value patterns for component values
const VALUE_PATTERNS = [
  // Standard notation: 10k, 4.7u, 100n, etc.
  /(\d+(?:\.\d+)?)\s*([kmugMGnpt]?)([ohmsVAWFHzΩ]*)/gi,
  // Scientific notation: 1e-6, 2.2e3, etc.
  /(\d+(?:\.\d+)?)\s*[eE]([+-]?\d+)\s*([ohmsVAWFHzΩ]*)/gi,
  // Fractional notation: 1/4W, 3/8", etc.
  /(\d+)\/(\d+)\s*([ohmsVAWFHzΩ]*)/gi,
];

// Node reference patterns
const NODE_PATTERNS = [
  /node\s+([a-zA-Z0-9]+)/gi,
  /at\s+([a-zA-Z0-9]+)/gi,
  /pin\s+([a-zA-Z0-9]+)/gi,
  /(collector|base|emitter|drain|source|gate|anode|cathode|input|output)/gi,
  /ground/gi,
  /vcc|vdd|vss|vee/gi,
];

export class ElectronicsNLP {
  private vocabulary = ELECTRONICS_VOCABULARY;
  private valuePatterns = VALUE_PATTERNS;
  private nodePatterns = NODE_PATTERNS;
  
  /**
   * Process a natural language query about electronics
   */
  async processQuery(query: string): Promise<ElectronicsQuery> {
    const normalizedQuery = this.normalizeQuery(query);
    const entities = this.extractEntities(normalizedQuery);
    const intent = this.classifyIntent(normalizedQuery, entities);
    const params = this.extractParameters(normalizedQuery, entities);
    
    return {
      intent,
      entities,
      params,
    };
  }
  
  /**
   * Normalize the query for better processing
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
      .replace(/\b(\d+)\s*([kmugMGnpt])\b/g, '$1$2') // Normalize unit prefixes
      .replace(/\bopamp\b/g, 'op amp') // Normalize op amp
      .replace(/\bfet\b/g, 'field effect transistor') // Expand FET
      .replace(/\bbjt\b/g, 'bipolar junction transistor'); // Expand BJT
  }
  
  /**
   * Extract entities from the normalized query
   */
  private extractEntities(query: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Extract concepts
    for (const [term] of Object.entries(this.vocabulary.CONCEPTS)) {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = query.matchAll(regex);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            text: match[0],
            label: 'CONCEPT',
            start: match.index,
            end: match.index + match[0].length,
            confidence: 0.9,
          });
        }
      }
    }
    
    // Extract components
    for (const [term] of Object.entries(this.vocabulary.COMPONENTS)) {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = query.matchAll(regex);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            text: match[0],
            label: 'COMPONENT',
            start: match.index,
            end: match.index + match[0].length,
            confidence: 0.8,
          });
        }
      }
    }
    
    // Extract part numbers
    for (const [term] of Object.entries(this.vocabulary.PART_NUMBERS)) {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = query.matchAll(regex);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            text: match[0],
            label: 'PART_NUMBER',
            start: match.index,
            end: match.index + match[0].length,
            confidence: 0.95,
          });
        }
      }
    }
    
    // Extract values and units
    for (const pattern of this.valuePatterns) {
      const matches = query.matchAll(pattern);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            text: match[0],
            label: 'VALUE',
            start: match.index,
            end: match.index + match[0].length,
            confidence: 0.85,
          });
        }
      }
    }
    
    // Extract units
    for (const [term] of Object.entries(this.vocabulary.UNITS)) {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = query.matchAll(regex);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            text: match[0],
            label: 'UNIT',
            start: match.index,
            end: match.index + match[0].length,
            confidence: 0.7,
          });
        }
      }
    }
    
    // Extract node references
    for (const pattern of this.nodePatterns) {
      const matches = query.matchAll(pattern);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            text: match[0],
            label: 'NODE',
            start: match.index,
            end: match.index + match[0].length,
            confidence: 0.75,
          });
        }
      }
    }
    
    // Extract analysis types
    for (const [term] of Object.entries(this.vocabulary.ANALYSIS_TYPES)) {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = query.matchAll(regex);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            text: match[0],
            label: 'ANALYSIS_TYPE',
            start: match.index,
            end: match.index + match[0].length,
            confidence: 0.8,
          });
        }
      }
    }
    
    // Sort entities by position and remove overlaps
    return this.removeOverlappingEntities(entities);
  }
  
  /**
   * Classify the intent of the query
   */
  private classifyIntent(query: string, entities: ExtractedEntity[]): QueryIntent {
    // Check for explicit intent keywords
    for (const [pattern, intent] of Object.entries(this.vocabulary.INTENT_PATTERNS)) {
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(query)) {
        return intent as QueryIntent;
      }
    }
    
    // Infer intent from entities and context
    const hasConcept = entities.some(e => e.label === 'CONCEPT');
    const hasComponent = entities.some(e => e.label === 'COMPONENT');
    const hasValue = entities.some(e => e.label === 'VALUE');
    const hasAnalysisType = entities.some(e => e.label === 'ANALYSIS_TYPE');
    
    if (hasAnalysisType || query.includes('simulate')) {
      return 'RUN_SIMULATION';
    }
    
    if (hasValue && (hasComponent || hasConcept)) {
      return 'CALCULATE_VALUES';
    }
    
    if (hasConcept || hasComponent) {
      return 'GET_EXPLANATION';
    }
    
    if (query.includes('example') || query.includes('show')) {
      return 'SHOW_EXAMPLE';
    }
    
    if (query.includes('compare') || query.includes('difference')) {
      return 'COMPARE_CIRCUITS';
    }
    
    // Default intent
    return 'GET_EXPLANATION';
  }
  
  /**
   * Extract parameters from the query and entities
   */
  private extractParameters(query: string, entities: ExtractedEntity[]): Record<string, string | number | boolean | string[]> {
    const params: Record<string, string | number | boolean | string[]> = {};
    
    // Group entities by type
    const conceptEntities = entities.filter(e => e.label === 'CONCEPT');
    const componentEntities = entities.filter(e => e.label === 'COMPONENT');
    const partNumberEntities = entities.filter(e => e.label === 'PART_NUMBER');
    const valueEntities = entities.filter(e => e.label === 'VALUE');
    const unitEntities = entities.filter(e => e.label === 'UNIT');
    const nodeEntities = entities.filter(e => e.label === 'NODE');
    const analysisEntities = entities.filter(e => e.label === 'ANALYSIS_TYPE');
    
    // Extract main concept
    if (conceptEntities.length > 0) {
      const mainConcept = conceptEntities[0].text.toLowerCase();
      params.concept = (this.vocabulary.CONCEPTS as Record<string, string>)[mainConcept] || mainConcept;
    }
    
    // Extract components
    if (componentEntities.length > 0) {
      params.components = componentEntities.map(e => 
        (this.vocabulary.COMPONENTS as Record<string, string>)[e.text.toLowerCase()] || e.text
      );
    }
    
    // Extract part numbers
    if (partNumberEntities.length > 0) {
      params.partNumbers = partNumberEntities.map(e => 
        (this.vocabulary.PART_NUMBERS as Record<string, string>)[e.text.toLowerCase()] || e.text.toUpperCase()
      );
    }
    
    // Extract values
    if (valueEntities.length > 0) {
      params.values = valueEntities.map(e => e.text);
    }
    
    // Extract units
    if (unitEntities.length > 0) {
      params.units = unitEntities.map(e => 
        this.vocabulary.UNITS[e.text.toLowerCase() as keyof typeof this.vocabulary.UNITS] || e.text
      );
    }
    
    // Extract nodes
    if (nodeEntities.length > 0) {
      params.nodes = nodeEntities.map(e => e.text);
    }
    
    // Extract analysis type
    if (analysisEntities.length > 0) {
      const analysisType = analysisEntities[0].text.toLowerCase();
      params.analysisType = this.vocabulary.ANALYSIS_TYPES[analysisType as keyof typeof this.vocabulary.ANALYSIS_TYPES] || analysisType;
    }
    
    // Extract component values using regex
    const componentValues = this.extractComponentValues(query);
    if (Object.keys(componentValues).length > 0) {
      params.componentValuesString = JSON.stringify(componentValues);
    }
    
    return params;
  }
  
  /**
   * Extract component values (e.g., "R1=10k", "C1=100nF")
   */
  private extractComponentValues(query: string): Record<string, string> {
    const values: Record<string, string> = {};
    
    // Pattern for component=value (e.g., R1=10k, C2=100nF)
    const componentValuePattern = /([a-zA-Z]+\d*)\s*=\s*(\d+(?:\.\d+)?[a-zA-Z]*)/gi;
    const matches = query.matchAll(componentValuePattern);
    
    for (const match of matches) {
      if (match[1] && match[2]) {
        values[match[1].toUpperCase()] = match[2];
      }
    }
    
    return values;
  }
  
  /**
   * Remove overlapping entities, keeping the one with higher confidence
   */
  private removeOverlappingEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    const sortedEntities = entities.sort((a, b) => {
      if (a.start === b.start) {
        return b.confidence - a.confidence; // Higher confidence first
      }
      return a.start - b.start;
    });
    
    const nonOverlapping: ExtractedEntity[] = [];
    
    for (const entity of sortedEntities) {
      const hasOverlap = nonOverlapping.some(existing => 
        (entity.start >= existing.start && entity.start < existing.end) ||
        (entity.end > existing.start && entity.end <= existing.end) ||
        (entity.start <= existing.start && entity.end >= existing.end)
      );
      
      if (!hasOverlap) {
        nonOverlapping.push(entity);
      }
    }
    
    return nonOverlapping.sort((a, b) => a.start - b.start);
  }
  
  /**
   * Get suggestions for incomplete or unclear queries
   */
  getSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const normalizedQuery = this.normalizeQuery(query);
    
    // Suggest concepts if query is too general
    if (normalizedQuery.length < 5) {
      suggestions.push(
        "Try asking about specific topics like 'Explain Ohm's Law'",
        "Ask for examples like 'Show me a voltage divider circuit'",
        "Request simulations like 'Simulate a BJT amplifier'"
      );
    }
    
    // Suggest specific components if only general terms are used
    if (normalizedQuery.includes('amplifier') && !normalizedQuery.includes('bjt') && !normalizedQuery.includes('op amp')) {
      suggestions.push(
        "Be more specific: 'BJT amplifier' or 'Op-amp amplifier'"
      );
    }
    
    // Suggest part numbers if generic components are mentioned
    if (normalizedQuery.includes('transistor') && !this.hasPartNumber(normalizedQuery)) {
      suggestions.push(
        "Specify a part number like '2N3904' or 'BC547'"
      );
    }
    
    return suggestions;
  }
  
  /**
   * Check if query contains a part number
   */
  private hasPartNumber(query: string): boolean {
    return Object.keys(this.vocabulary.PART_NUMBERS).some(partNumber => 
      query.toLowerCase().includes(partNumber)
    );
  }
}

// Export singleton instance
export const electronicsNLP = new ElectronicsNLP();
