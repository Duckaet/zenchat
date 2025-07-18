/**
 * Circuit Visualization Engine using GoJS
 * 
 * This module provides interactive circuit diagram rendering with
 * real-time simulation data visualization.
 */

import * as go from 'gojs';
import { Circuit, Component, Node, Connection } from '@/types/electronics';
import { SimulationResult } from '@/services/simulation/ngspice';

export interface CircuitVisualizationConfig {
  container: HTMLElement;
  width: number;
  height: number;
  interactive: boolean;
  showGrid: boolean;
  showCurrentFlow: boolean;
  showVoltageColors: boolean;
}

export interface VisualizationUpdate {
  nodeVoltages: Record<string, number>;
  branchCurrents: Record<string, number>;
  animationSpeed: number;
}

export class CircuitVisualizationEngine {
  private diagram: go.Diagram;
  private palette: go.Palette;
  private circuit: Circuit | null = null;
  private animationTimer: number | null = null;
  private currentFlowAnimations: Map<string, go.Animation> = new Map();

  constructor(config: CircuitVisualizationConfig) {
    this.diagram = this.initializeDiagram(config);
    this.palette = this.initializePalette();
    this.setupEventHandlers();
  }

  /**
   * Initialize the main circuit diagram
   */
  private initializeDiagram(config: CircuitVisualizationConfig): go.Diagram {
    const $ = go.GraphObject.make;

    const diagram = $(go.Diagram, config.container, {
      'undoManager.isEnabled': true,
      'grid.visible': config.showGrid,
      'grid.gridCellSize': new go.Size(20, 20),
      'draggingTool.isGridSnapEnabled': true,
      'resizingTool.isGridSnapEnabled': true,
      'rotatingTool.snapAngleMultiple': 90,
      'rotatingTool.snapAngleEpsilon': 45,
      allowDrop: true,
      allowTextEdit: config.interactive,
      'toolManager.hoverDelay': 200,
      'toolManager.toolTipDuration': 10000,
      initialContentAlignment: go.Spot.Center,
      'animationManager.isEnabled': true,
    });

    // Define node templates for different component types
    this.defineNodeTemplates(diagram);
    
    // Define link template for wires
    this.defineLinkTemplate(diagram);

    return diagram;
  }

  /**
   * Define node templates for electronic components
   */
  private defineNodeTemplates(diagram: go.Diagram): void {
    const $ = go.GraphObject.make;

    // Resistor template
    diagram.nodeTemplateMap.add('RESISTOR', 
      $(go.Node, 'Spot',
        {
          locationSpot: go.Spot.Center,
          selectionAdorned: true,
          resizable: false,
          rotatable: true,
          toolTip: this.createToolTip('Resistor'),
        },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding('angle').makeTwoWay(),
        
        // Main shape
        $(go.Shape, 'Rectangle',
          {
            fill: 'white',
            stroke: 'black',
            strokeWidth: 2,
            width: 60,
            height: 20,
          },
          new go.Binding('fill', 'voltage', this.voltageToColor)
        ),
        
        // Value label
        $(go.TextBlock,
          {
            text: 'R',
            font: 'bold 12px sans-serif',
            stroke: 'black',
            background: 'white',
            editable: true,
          },
          new go.Binding('text', 'value').makeTwoWay()
        ),
        
        // Connection ports
        this.createPort('L', go.Spot.Left),
        this.createPort('R', go.Spot.Right),
        
        // Zigzag pattern for resistor
        $(go.Shape,
          {
            geometryString: 'M-30,0 L-20,-8 L-10,8 L0,-8 L10,8 L20,-8 L30,0',
            stroke: 'black',
            strokeWidth: 2,
            fill: 'transparent',
          }
        )
      )
    );

    // Capacitor template
    diagram.nodeTemplateMap.add('CAPACITOR',
      $(go.Node, 'Spot',
        {
          locationSpot: go.Spot.Center,
          selectionAdorned: true,
          resizable: false,
          rotatable: true,
          toolTip: this.createToolTip('Capacitor'),
        },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding('angle').makeTwoWay(),
        
        // Main shape
        $(go.Shape, 'Rectangle',
          {
            fill: 'transparent',
            stroke: 'transparent',
            width: 60,
            height: 30,
          }
        ),
        
        // Left plate
        $(go.Shape,
          {
            geometryString: 'M-5,-15 L-5,15',
            stroke: 'black',
            strokeWidth: 3,
          }
        ),
        
        // Right plate
        $(go.Shape,
          {
            geometryString: 'M5,-15 L5,15',
            stroke: 'black',
            strokeWidth: 3,
          }
        ),
        
        // Value label
        $(go.TextBlock,
          {
            text: 'C',
            font: 'bold 12px sans-serif',
            stroke: 'black',
            background: 'white',
            alignment: go.Spot.Top,
            editable: true,
          },
          new go.Binding('text', 'value').makeTwoWay()
        ),
        
        // Connection ports
        this.createPort('L', go.Spot.Left),
        this.createPort('R', go.Spot.Right)
      )
    );

    // Voltage source template
    diagram.nodeTemplateMap.add('VOLTAGE_SOURCE',
      $(go.Node, 'Spot',
        {
          locationSpot: go.Spot.Center,
          selectionAdorned: true,
          resizable: false,
          rotatable: true,
          toolTip: this.createToolTip('Voltage Source'),
        },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding('angle').makeTwoWay(),
        
        // Circle shape
        $(go.Shape, 'Circle',
          {
            fill: 'white',
            stroke: 'black',
            strokeWidth: 2,
            width: 40,
            height: 40,
          }
        ),
        
        // Plus sign
        $(go.Shape,
          {
            geometryString: 'M-8,0 L8,0 M0,-8 L0,8',
            stroke: 'red',
            strokeWidth: 2,
          }
        ),
        
        // Value label
        $(go.TextBlock,
          {
            text: 'V',
            font: 'bold 12px sans-serif',
            stroke: 'black',
            background: 'white',
            alignment: go.Spot.Bottom,
            editable: true,
          },
          new go.Binding('text', 'value').makeTwoWay()
        ),
        
        // Connection ports
        this.createPort('T', go.Spot.Top),
        this.createPort('B', go.Spot.Bottom)
      )
    );

    // Ground symbol template
    diagram.nodeTemplateMap.add('GROUND',
      $(go.Node, 'Spot',
        {
          locationSpot: go.Spot.Center,
          selectionAdorned: true,
          resizable: false,
          rotatable: false,
          toolTip: this.createToolTip('Ground'),
        },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        
        // Ground symbol
        $(go.Shape,
          {
            geometryString: 'M-15,0 L15,0 M-10,5 L10,5 M-5,10 L5,10',
            stroke: 'black',
            strokeWidth: 2,
          }
        ),
        
        // Connection port
        this.createPort('T', go.Spot.Top)
      )
    );

    // BJT template
    diagram.nodeTemplateMap.add('BJT',
      $(go.Node, 'Spot',
        {
          locationSpot: go.Spot.Center,
          selectionAdorned: true,
          resizable: false,
          rotatable: true,
          toolTip: this.createToolTip('BJT Transistor'),
        },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding('angle').makeTwoWay(),
        
        // Main circle
        $(go.Shape, 'Circle',
          {
            fill: 'white',
            stroke: 'black',
            strokeWidth: 2,
            width: 50,
            height: 50,
          }
        ),
        
        // Base line
        $(go.Shape,
          {
            geometryString: 'M-10,-15 L-10,15',
            stroke: 'black',
            strokeWidth: 3,
          }
        ),
        
        // Collector line
        $(go.Shape,
          {
            geometryString: 'M-10,-10 L10,-20',
            stroke: 'black',
            strokeWidth: 2,
          }
        ),
        
        // Emitter line with arrow
        $(go.Shape,
          {
            geometryString: 'M-10,10 L10,20 M5,15 L10,20 L5,23',
            stroke: 'black',
            strokeWidth: 2,
          }
        ),
        
        // Part number label
        $(go.TextBlock,
          {
            text: 'Q',
            font: 'bold 10px sans-serif',
            stroke: 'black',
            alignment: go.Spot.Center,
            editable: true,
          },
          new go.Binding('text', 'partNumber').makeTwoWay()
        ),
        
        // Connection ports
        this.createPort('B', go.Spot.Left),      // Base
        this.createPort('C', go.Spot.TopRight),  // Collector
        this.createPort('E', go.Spot.BottomRight) // Emitter
      )
    );
  }

  /**
   * Define link template for wires
   */
  private defineLinkTemplate(diagram: go.Diagram): void {
    const $ = go.GraphObject.make;

    diagram.linkTemplate = 
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes,
          corner: 5,
          selectionAdorned: true,
          layerName: 'Foreground',
        },
        new go.Binding('points').makeTwoWay(),
        
        // Wire shape
        $(go.Shape,
          {
            stroke: 'black',
            strokeWidth: 2,
          },
          new go.Binding('stroke', 'current', this.currentToColor),
          new go.Binding('strokeWidth', 'current', this.currentToWidth)
        ),
        
        // Current flow animation dots
        $(go.Shape,
          {
            figure: 'Circle',
            fill: 'blue',
            stroke: null,
            width: 4,
            height: 4,
            visible: false,
          },
          new go.Binding('visible', 'showCurrentFlow')
        )
      );
  }

  /**
   * Create connection port for components
   */
  private createPort(name: string, spot: go.Spot): go.GraphObject {
    const $ = go.GraphObject.make;
    
    return $(go.Shape, 'Circle',
      {
        fill: 'transparent',
        stroke: null,
        width: 8,
        height: 8,
        alignment: spot,
        portId: name,
        fromSpot: spot,
        toSpot: spot,
        fromLinkable: true,
        toLinkable: true,
        cursor: 'pointer',
      }
    );
  }

  /**
   * Create tooltip for components
   */
  private createToolTip(componentType: string): go.Adornment {
    const $ = go.GraphObject.make;
    
    return $(go.Adornment, 'Auto',
      $(go.Shape, { fill: '#FFFFCC' }),
      $(go.TextBlock, { margin: 4 },
        new go.Binding('text', '', (data) => {
          return `${componentType}\nValue: ${data.value || 'N/A'}\nVoltage: ${data.voltage?.toFixed(2) || 'N/A'}V\nCurrent: ${data.current?.toFixed(2) || 'N/A'}A`;
        })
      )
    );
  }

  /**
   * Initialize component palette
   */
  private initializePalette(): go.Palette {
    const $ = go.GraphObject.make;
    
    const palette = $(go.Palette, {
      nodeTemplateMap: this.diagram.nodeTemplateMap,
      model: $(go.GraphLinksModel, {
        nodeDataArray: [
          { category: 'RESISTOR', text: 'Resistor', value: '1k' },
          { category: 'CAPACITOR', text: 'Capacitor', value: '1μF' },
          { category: 'VOLTAGE_SOURCE', text: 'Voltage Source', value: '9V' },
          { category: 'GROUND', text: 'Ground' },
          { category: 'BJT', text: 'BJT', partNumber: '2N3904' },
        ]
      })
    });
    
    return palette;
  }

  /**
   * Convert voltage to color for visualization
   */
  private voltageToColor(voltage: number): string {
    if (voltage === undefined || voltage === null) return 'white';
    
    // Map voltage to color: red (-) -> gray (0) -> green (+)
    const normalizedVoltage = Math.max(-10, Math.min(10, voltage)) / 10;
    
    if (normalizedVoltage < 0) {
      const intensity = Math.abs(normalizedVoltage);
      return `rgb(${255}, ${255 - intensity * 100}, ${255 - intensity * 100})`;
    } else {
      const intensity = normalizedVoltage;
      return `rgb(${255 - intensity * 100}, ${255}, ${255 - intensity * 100})`;
    }
  }

  /**
   * Convert current to color for wire visualization
   */
  private currentToColor(current: number): string {
    if (current === undefined || current === null) return 'black';
    
    const intensity = Math.min(1, Math.abs(current) / 0.1); // Normalize to max 100mA
    return `rgb(${intensity * 255}, ${intensity * 100}, 0)`;
  }

  /**
   * Convert current to wire width
   */
  private currentToWidth(current: number): number {
    if (current === undefined || current === null) return 2;
    
    const intensity = Math.min(1, Math.abs(current) / 0.1); // Normalize to max 100mA
    return 2 + intensity * 4; // Width between 2 and 6
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Component value changed
    this.diagram.addDiagramListener('Modified', (e) => {
      if (e.isTransactionFinished) {
        this.onCircuitModified();
      }
    });

    // Selection changed
    this.diagram.addDiagramListener('ChangedSelection', (e) => {
      this.onSelectionChanged();
    });
  }

  /**
   * Load circuit into the diagram
   */
  loadCircuit(circuit: Circuit): void {
    this.circuit = circuit;
    
    // Convert circuit components to GoJS node data
    const nodeDataArray = circuit.components.map(component => ({
      key: component.id,
      category: component.type,
      text: component.name,
      value: component.value,
      partNumber: component.partNumber,
      loc: `${component.position.x} ${component.position.y}`,
      voltage: 0,
      current: 0,
    }));

    // Convert connections to GoJS link data
    const linkDataArray = circuit.connections.map(connection => ({
      key: connection.id,
      from: connection.from,
      to: connection.to,
      current: connection.current || 0,
      showCurrentFlow: false,
    }));

    // Update diagram model
    this.diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
  }

  /**
   * Update visualization with simulation results
   */
  updateVisualization(simulationResult: SimulationResult): void {
    if (!simulationResult.success || !this.circuit) return;

    const updates: VisualizationUpdate = {
      nodeVoltages: {},
      branchCurrents: {},
      animationSpeed: 1.0,
    };

    // Update node voltages
    simulationResult.data.nodes.forEach(node => {
      updates.nodeVoltages[node.id] = Array.isArray(node.voltage) 
        ? node.voltage[0] 
        : node.voltage;
    });

    // Update branch currents
    simulationResult.data.branches.forEach(branch => {
      updates.branchCurrents[branch.id] = Array.isArray(branch.current) 
        ? branch.current[0] 
        : branch.current;
    });

    this.applyVisualizationUpdate(updates);
  }

  /**
   * Apply visualization updates to the diagram
   */
  private applyVisualizationUpdate(update: VisualizationUpdate): void {
    this.diagram.startTransaction('update visualization');

    // Update node voltages
    Object.entries(update.nodeVoltages).forEach(([nodeId, voltage]) => {
      const node = this.diagram.findNodeForKey(nodeId);
      if (node) {
        this.diagram.model.setDataProperty(node.data, 'voltage', voltage);
      }
    });

    // Update branch currents
    Object.entries(update.branchCurrents).forEach(([branchId, current]) => {
      const link = this.diagram.findLinkForKey(branchId);
      if (link) {
        this.diagram.model.setDataProperty(link.data, 'current', current);
        this.diagram.model.setDataProperty(link.data, 'showCurrentFlow', Math.abs(current) > 0.001);
      }
    });

    this.diagram.commitTransaction('update visualization');

    // Start current flow animations
    this.startCurrentFlowAnimations(update);
  }

  /**
   * Start current flow animations
   */
  private startCurrentFlowAnimations(update: VisualizationUpdate): void {
    // Stop existing animations
    this.currentFlowAnimations.forEach(animation => animation.stop());
    this.currentFlowAnimations.clear();

    // Create new animations for links with current flow
    this.diagram.links.each(link => {
      const current = link.data.current;
      if (Math.abs(current) > 0.001) {
        const animation = this.createCurrentFlowAnimation(link, current, update.animationSpeed);
        this.currentFlowAnimations.set(link.data.key, animation);
        animation.start();
      }
    });
  }

  /**
   * Create current flow animation for a link
   */
  private createCurrentFlowAnimation(link: go.Link, current: number, speed: number): go.Animation {
    const animation = new go.Animation();
    animation.duration = 2000 / speed; // 2 seconds at normal speed
    animation.easing = go.Animation.EaseLinear;
    
    // Create animated dots moving along the link
    const dots = this.createAnimatedDots(link, current);
    
    animation.add(dots, 'position', dots.position, link.getPoint(link.pointsCount - 1));
    
    return animation;
  }

  /**
   * Create animated dots for current flow
   */
  private createAnimatedDots(link: go.Link, current: number): go.GraphObject {
    const $ = go.GraphObject.make;
    
    const numDots = Math.ceil(Math.abs(current) * 10); // More current = more dots
    const dotSize = Math.min(6, Math.max(2, Math.abs(current) * 20));
    
    return $(go.Shape, 'Circle',
      {
        fill: current > 0 ? 'blue' : 'red',
        stroke: null,
        width: dotSize,
        height: dotSize,
        opacity: 0.8,
      }
    );
  }

  /**
   * Get circuit netlist from current diagram
   */
  getNetlist(): string {
    const netlist: string[] = [];
    netlist.push('* Circuit generated from diagram');
    
    // Add components
    this.diagram.nodes.each(node => {
      const data = node.data;
      const connections = this.getNodeConnections(node);
      
      switch (data.category) {
        case 'RESISTOR':
          netlist.push(`R${data.key} ${connections.join(' ')} ${data.value || '1k'}`);
          break;
        case 'CAPACITOR':
          netlist.push(`C${data.key} ${connections.join(' ')} ${data.value || '1u'}`);
          break;
        case 'VOLTAGE_SOURCE':
          netlist.push(`V${data.key} ${connections.join(' ')} ${data.value || '9'}`);
          break;
        case 'BJT':
          netlist.push(`Q${data.key} ${connections.join(' ')} ${data.partNumber || '2N3904'}`);
          break;
      }
    });
    
    netlist.push('.end');
    return netlist.join('\n');
  }

  /**
   * Get node connections for netlist generation
   */
  private getNodeConnections(node: go.Node): string[] {
    const connections: string[] = [];
    
    // Find all links connected to this node
    node.findLinksConnected().each(link => {
      const otherNode = link.getOtherNode(node);
      if (otherNode) {
        connections.push(otherNode.data.key);
      }
    });
    
    return connections;
  }

  /**
   * Circuit modification handler
   */
  private onCircuitModified(): void {
    // Emit event for circuit changes
    const event = new CustomEvent('circuitModified', {
      detail: { netlist: this.getNetlist() }
    });
    document.dispatchEvent(event);
  }

  /**
   * Selection change handler
   */
  private onSelectionChanged(): void {
    const selectedNodes = this.diagram.selection.filter(part => part instanceof go.Node);
    const selectedLinks = this.diagram.selection.filter(part => part instanceof go.Link);
    
    // Emit selection event
    const event = new CustomEvent('selectionChanged', {
      detail: { 
        nodes: selectedNodes.map(node => node.data),
        links: selectedLinks.map(link => link.data)
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Export diagram as image
   */
  exportAsImage(format: 'PNG' | 'SVG' = 'PNG'): string {
    if (format === 'PNG') {
      return this.diagram.makeImageData({
        scale: 1,
        background: 'white',
      });
    } else {
      return this.diagram.makeSvg({
        scale: 1,
        background: 'white',
      });
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.currentFlowAnimations.forEach(animation => animation.stop());
    this.currentFlowAnimations.clear();
    
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
    }
    
    this.diagram.div = null;
  }
}

export default CircuitVisualizationEngine;
