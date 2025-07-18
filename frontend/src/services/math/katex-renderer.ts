/**
 * Mathematical Rendering Service using KaTeX
 * 
 * This service handles rendering mathematical equations and expressions
 * with proper LaTeX formatting for electronics formulas.
 */

import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface MathExpression {
  id: string;
  latex: string;
  displayMode: boolean;
  inline?: boolean;
}

export interface EquationStep {
  id: string;
  description: string;
  latex: string;
  highlight?: boolean;
}

export interface MathRenderingOptions {
  displayMode?: boolean;
  inline?: boolean;
  throwOnError?: boolean;
  errorColor?: string;
  macros?: Record<string, string>;
  trust?: boolean;
  strict?: boolean;
}

export class MathematicalRenderer {
  private defaultOptions: MathRenderingOptions = {
    displayMode: false,
    inline: false,
    throwOnError: false,
    errorColor: '#cc0000',
    strict: false,
    trust: false,
    macros: {
      // Electronics-specific macros
      '\\volt': '\\mathrm{V}',
      '\\amp': '\\mathrm{A}',
      '\\ohm': '\\Omega',
      '\\farad': '\\mathrm{F}',
      '\\henry': '\\mathrm{H}',
      '\\watt': '\\mathrm{W}',
      '\\joule': '\\mathrm{J}',
      '\\coulomb': '\\mathrm{C}',
      '\\siemens': '\\mathrm{S}',
      '\\tesla': '\\mathrm{T}',
      '\\weber': '\\mathrm{Wb}',
      '\\degree': '^\\circ',
      // Common electronics formulas
      '\\kvl': '\\sum_{k=1}^{n} V_k = 0',
      '\\kcl': '\\sum_{k=1}^{n} I_k = 0',
      '\\ohmslaw': 'V = IR',
      '\\power': 'P = VI',
      '\\energy': 'W = Pt',
      '\\reactance': 'X = 2\\pi fL',
      '\\impedance': 'Z = R + jX',
      '\\resonance': 'f_0 = \\frac{1}{2\\pi\\sqrt{LC}}',
      '\\gain': 'A_v = \\frac{V_{out}}{V_{in}}',
      '\\beta': '\\beta = \\frac{I_C}{I_B}',
      '\\gm': 'g_m = \\frac{\\partial I_D}{\\partial V_{GS}}',
    },
  };

  constructor() {
    this.initializeRenderer();
  }

  private initializeRenderer(): void {
    // Set up custom KaTeX macros and options
    console.log('Mathematical renderer initialized with electronics macros');
  }

  /**
   * Render a single LaTeX expression to HTML
   */
  renderExpression(
    latex: string, 
    options: MathRenderingOptions = {}
  ): string {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    try {
      return katex.renderToString(latex, mergedOptions);
    } catch (error) {
      console.error('Error rendering LaTeX:', error);
      return `<span class="math-error">Error: ${latex}</span>`;
    }
  }

  /**
   * Render LaTeX to a DOM element
   */
  renderToElement(
    element: HTMLElement,
    latex: string,
    options: MathRenderingOptions = {}
  ): void {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    try {
      katex.render(latex, element, mergedOptions);
    } catch (error) {
      console.error('Error rendering LaTeX to element:', error);
      element.innerHTML = `<span class="math-error">Error: ${latex}</span>`;
    }
  }

  /**
   * Generate step-by-step equation solution
   */
  generateStepByStepSolution(
    problem: string,
    steps: EquationStep[]
  ): string {
    const html: string[] = [];
    
    html.push('<div class="math-solution">');
    html.push(`<h3 class="math-problem">${problem}</h3>`);
    html.push('<div class="math-steps">');
    
    steps.forEach((step, index) => {
      html.push(`<div class="math-step ${step.highlight ? 'highlighted' : ''}">`);
      html.push(`<div class="step-number">${index + 1}.</div>`);
      html.push(`<div class="step-content">`);
      html.push(`<div class="step-description">${step.description}</div>`);
      html.push(`<div class="step-equation">${this.renderExpression(step.latex, { displayMode: true })}</div>`);
      html.push(`</div>`);
      html.push(`</div>`);
    });
    
    html.push('</div>');
    html.push('</div>');
    
    return html.join('\n');
  }

  /**
   * Generate common electronics formulas
   */
  generateElectronicsFormulas(): Record<string, string> {
    return {
      ohmsLaw: this.renderExpression('V = I \\cdot R', { displayMode: true }),
      power: this.renderExpression('P = V \\cdot I = I^2 \\cdot R = \\frac{V^2}{R}', { displayMode: true }),
      kvl: this.renderExpression('\\sum_{k=1}^{n} V_k = 0', { displayMode: true }),
      kcl: this.renderExpression('\\sum_{k=1}^{n} I_k = 0', { displayMode: true }),
      capacitiveReactance: this.renderExpression('X_C = \\frac{1}{2\\pi f C}', { displayMode: true }),
      inductiveReactance: this.renderExpression('X_L = 2\\pi f L', { displayMode: true }),
      impedance: this.renderExpression('Z = R + j(X_L - X_C)', { displayMode: true }),
      resonantFrequency: this.renderExpression('f_0 = \\frac{1}{2\\pi\\sqrt{LC}}', { displayMode: true }),
      voltageDivider: this.renderExpression('V_{out} = V_{in} \\cdot \\frac{R_2}{R_1 + R_2}', { displayMode: true }),
      currentDivider: this.renderExpression('I_{out} = I_{in} \\cdot \\frac{R_1}{R_1 + R_2}', { displayMode: true }),
      bjtGain: this.renderExpression('\\beta = \\frac{I_C}{I_B}, \\quad \\alpha = \\frac{I_C}{I_E}', { displayMode: true }),
      transconductance: this.renderExpression('g_m = \\frac{\\partial I_D}{\\partial V_{GS}}', { displayMode: true }),
      timeDomain: this.renderExpression('v(t) = V_0 e^{-\\frac{t}{RC}}', { displayMode: true }),
      frequencyResponse: this.renderExpression('H(j\\omega) = \\frac{1}{1 + j\\omega RC}', { displayMode: true }),
    };
  }

  /**
   * Generate KCL explanation with circuit example
   */
  generateKCLExplanation(batteryVoltage: number = 9): string {
    const steps: EquationStep[] = [
      {
        id: 'kcl-statement',
        description: 'Kirchhoff\'s Current Law states that the sum of currents entering a node equals the sum of currents leaving the node.',
        latex: '\\sum_{k=1}^{n} I_k = 0',
        highlight: true,
      },
      {
        id: 'kcl-node-example',
        description: 'For a node with three branches, currents I₁, I₂, and I₃:',
        latex: 'I_1 + I_2 + I_3 = 0',
      },
      {
        id: 'kcl-sign-convention',
        description: 'Using sign convention: currents entering (+), currents leaving (-)',
        latex: 'I_{in} - I_{out1} - I_{out2} = 0',
      },
      {
        id: 'kcl-practical',
        description: `With a ${batteryVoltage}V battery and resistors R₁ = 10kΩ, R₂ = 20kΩ in parallel:`,
        latex: `I_{total} = I_1 + I_2 = \\frac{${batteryVoltage}}{10k} + \\frac{${batteryVoltage}}{20k} = ${(batteryVoltage/10 + batteryVoltage/20).toFixed(2)}\\text{mA}`,
      },
    ];

    return this.generateStepByStepSolution(
      'Kirchhoff\'s Current Law (KCL) with 9V Battery',
      steps
    );
  }

  /**
   * Generate voltage divider analysis
   */
  generateVoltageDividerAnalysis(vin: number, r1: number, r2: number): string {
    const vout = vin * (r2 / (r1 + r2));
    const ratio = r2 / (r1 + r2);
    
    const steps: EquationStep[] = [
      {
        id: 'vd-formula',
        description: 'Voltage divider formula:',
        latex: 'V_{out} = V_{in} \\cdot \\frac{R_2}{R_1 + R_2}',
        highlight: true,
      },
      {
        id: 'vd-substitution',
        description: `Substituting values: V_in = ${vin}V, R₁ = ${r1}Ω, R₂ = ${r2}Ω`,
        latex: `V_{out} = ${vin} \\cdot \\frac{${r2}}{${r1} + ${r2}}`,
      },
      {
        id: 'vd-calculation',
        description: 'Calculating the ratio:',
        latex: `V_{out} = ${vin} \\cdot ${ratio.toFixed(3)} = ${vout.toFixed(2)}\\text{V}`,
      },
      {
        id: 'vd-current',
        description: 'Total current through the divider:',
        latex: `I = \\frac{V_{in}}{R_1 + R_2} = \\frac{${vin}}{${r1 + r2}} = ${(vin / (r1 + r2)).toFixed(3)}\\text{A}`,
      },
    ];

    return this.generateStepByStepSolution(
      'Voltage Divider Analysis',
      steps
    );
  }

  /**
   * Generate BJT amplifier analysis
   */
  generateBJTAmplifierAnalysis(
    vcc: number, 
    rb: number, 
    rc: number, 
    beta: number = 100
  ): string {
    const vbe = 0.7; // Silicon BJT base-emitter voltage
    const ib = (vcc - vbe) / rb;
    const ic = beta * ib;
    const vce = vcc - (ic * rc);
    
    const steps: EquationStep[] = [
      {
        id: 'bjt-beta',
        description: 'BJT current gain relationship:',
        latex: '\\beta = \\frac{I_C}{I_B}',
        highlight: true,
      },
      {
        id: 'bjt-base-current',
        description: `Base current calculation (assuming V_BE = ${vbe}V):`,
        latex: `I_B = \\frac{V_{CC} - V_{BE}}{R_B} = \\frac{${vcc} - ${vbe}}{${rb}} = ${(ib * 1000).toFixed(3)}\\text{mA}`,
      },
      {
        id: 'bjt-collector-current',
        description: `Collector current using β = ${beta}:`,
        latex: `I_C = \\beta \\cdot I_B = ${beta} \\times ${(ib * 1000).toFixed(3)}\\text{mA} = ${(ic * 1000).toFixed(2)}\\text{mA}`,
      },
      {
        id: 'bjt-collector-voltage',
        description: 'Collector-emitter voltage:',
        latex: `V_{CE} = V_{CC} - I_C \\cdot R_C = ${vcc} - ${(ic * 1000).toFixed(2)}\\text{mA} \\times ${rc}\\Omega = ${vce.toFixed(2)}\\text{V}`,
      },
      {
        id: 'bjt-operating-point',
        description: 'Operating point (Q-point):',
        latex: `Q(I_C, V_{CE}) = (${(ic * 1000).toFixed(2)}\\text{mA}, ${vce.toFixed(2)}\\text{V})`,
      },
    ];

    return this.generateStepByStepSolution(
      'BJT Common-Emitter Amplifier Analysis',
      steps
    );
  }

  /**
   * Generate RC filter analysis
   */
  generateRCFilterAnalysis(
    r: number, 
    c: number, 
    filterType: 'low-pass' | 'high-pass' = 'low-pass'
  ): string {
    const fc = 1 / (2 * Math.PI * r * c);
    const tau = r * c;
    
    const steps: EquationStep[] = [
      {
        id: 'rc-cutoff',
        description: 'Cutoff frequency formula:',
        latex: 'f_c = \\frac{1}{2\\pi RC}',
        highlight: true,
      },
      {
        id: 'rc-substitution',
        description: `Substituting R = ${r}Ω, C = ${c}F:`,
        latex: `f_c = \\frac{1}{2\\pi \\times ${r} \\times ${c}} = ${fc.toFixed(2)}\\text{Hz}`,
      },
      {
        id: 'rc-time-constant',
        description: 'Time constant:',
        latex: `\\tau = RC = ${r} \\times ${c} = ${tau.toFixed(6)}\\text{s}`,
      },
      {
        id: 'rc-transfer-function',
        description: `Transfer function for ${filterType} filter:`,
        latex: filterType === 'low-pass' 
          ? 'H(j\\omega) = \\frac{1}{1 + j\\omega RC}'
          : 'H(j\\omega) = \\frac{j\\omega RC}{1 + j\\omega RC}',
      },
      {
        id: 'rc-magnitude',
        description: 'Magnitude at cutoff frequency:',
        latex: '|H(j\\omega_c)| = \\frac{1}{\\sqrt{2}} = 0.707 = -3\\text{dB}',
      },
    ];

    return this.generateStepByStepSolution(
      `RC ${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Filter Analysis`,
      steps
    );
  }

  /**
   * Generate complex impedance analysis
   */
  generateImpedanceAnalysis(
    r: number, 
    l: number, 
    c: number, 
    frequency: number
  ): string {
    const omega = 2 * Math.PI * frequency;
    const xl = omega * l;
    const xc = 1 / (omega * c);
    const x = xl - xc;
    const z = Math.sqrt(r * r + x * x);
    const phase = Math.atan(x / r) * (180 / Math.PI);

    const steps: EquationStep[] = [
      {
        id: 'impedance-components',
        description: 'Reactance components:',
        latex: 'X_L = \\omega L = 2\\pi f L, \\quad X_C = \\frac{1}{\\omega C} = \\frac{1}{2\\pi f C}',
        highlight: true,
      },
      {
        id: 'impedance-calculation',
        description: `At f = ${frequency}Hz:`,
        latex: `X_L = ${xl.toFixed(2)}\\Omega, \\quad X_C = ${xc.toFixed(2)}\\Omega`,
      },
      {
        id: 'impedance-net',
        description: 'Net reactance:',
        latex: `X = X_L - X_C = ${xl.toFixed(2)} - ${xc.toFixed(2)} = ${x.toFixed(2)}\\Omega`,
      },
      {
        id: 'impedance-magnitude',
        description: 'Impedance magnitude:',
        latex: `|Z| = \\sqrt{R^2 + X^2} = \\sqrt{${r}^2 + ${x.toFixed(2)}^2} = ${z.toFixed(2)}\\Omega`,
      },
      {
        id: 'impedance-phase',
        description: 'Phase angle:',
        latex: `\\phi = \\arctan\\left(\\frac{X}{R}\\right) = \\arctan\\left(\\frac{${x.toFixed(2)}}{${r}}\\right) = ${phase.toFixed(1)}°`,
      },
    ];

    return this.generateStepByStepSolution(
      'RLC Circuit Impedance Analysis',
      steps
    );
  }

  /**
   * Render inline math expressions in text
   */
  renderInlineExpressions(text: string): string {
    // Replace $...$ with rendered math
    return text.replace(/\$([^$]+)\$/g, (_match, latex) => {
      return this.renderExpression(latex, { inline: true });
    });
  }

  /**
   * Get CSS styles for math rendering
   */
  getMathStyles(): string {
    return `
      .math-solution {
        font-family: 'Computer Modern', serif;
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        background: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .math-problem {
        color: #2c3e50;
        border-bottom: 2px solid #3498db;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      
      .math-steps {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .math-step {
        display: flex;
        align-items: flex-start;
        gap: 15px;
        padding: 15px;
        background: white;
        border-radius: 6px;
        border-left: 4px solid #3498db;
        transition: all 0.3s ease;
      }
      
      .math-step.highlighted {
        border-left-color: #e74c3c;
        background: #fdf2f2;
      }
      
      .step-number {
        font-weight: bold;
        color: #3498db;
        min-width: 25px;
      }
      
      .step-content {
        flex: 1;
      }
      
      .step-description {
        margin-bottom: 10px;
        color: #34495e;
        line-height: 1.6;
      }
      
      .step-equation {
        background: #f8f9fa;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
      }
      
      .math-error {
        color: #e74c3c;
        background: #fdf2f2;
        padding: 4px 8px;
        border-radius: 4px;
        font-family: monospace;
      }
      
      .katex-display {
        margin: 0.5em 0;
      }
      
      .katex {
        font-size: 1.1em;
      }
    `;
  }
}

// Export singleton instance
export const mathRenderer = new MathematicalRenderer();
