import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Copy } from 'lucide-react';

interface TextSelectionTooltipProps {
  onAddToFollowUp: (text: string) => void;
}

export function TextSelectionTooltip({ onAddToFollowUp }: TextSelectionTooltipProps) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  
  const clearSelection = useCallback(() => {
    setIsVisible(false);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    const handleSelection = () => {
     
      setTimeout(() => {
        const selection = window.getSelection();
        
        if (!selection || selection.isCollapsed) {
          setIsVisible(false);
          return;
        }

        const text = selection.toString().trim();
        
        if (text && text.length > 3) { 
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          if (rect && rect.width > 0 && rect.height > 0) {
            setSelectedText(text);
            setPosition({
              x: Math.min(Math.max(rect.left + rect.width / 2, 100), window.innerWidth - 100), 
              y: Math.max(rect.top - 50, 10) 
            });
            setIsVisible(true);
          }
        } else {
          setIsVisible(false);
        }
      }, 10);
    };

    const handleMouseDown = (event: MouseEvent) => {
     
      if (tooltipRef.current && tooltipRef.current.contains(event.target as Node)) {
        return;
      }
      setIsVisible(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
     
      if (event.key === 'Escape') {
        clearSelection();
      }
    };

    const handleScroll = () => {
      
      setIsVisible(false);
    };

   
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('scroll', handleScroll, true); 
    
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [clearSelection]);

  const handleAddToFollowUp = useCallback(() => {
    onAddToFollowUp(selectedText);
    clearSelection();
  }, [selectedText, onAddToFollowUp, clearSelection]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      clearSelection();
      
      console.log('Text copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      
      try {
        const textArea = document.createElement('textarea');
        textArea.value = selectedText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        clearSelection();
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
    }
  }, [selectedText, clearSelection]);

  if (!isVisible || !selectedText) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] transform -translate-x-1/2 -translate-y-full pointer-events-auto"
      style={{ 
        left: position.x, 
        top: position.y,
      
        maxWidth: '300px'
      }}
    >
      <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-xl p-1 animate-in fade-in-0 zoom-in-95 duration-200">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={handleAddToFollowUp}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add to follow-up
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 hover:bg-muted transition-colors"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
