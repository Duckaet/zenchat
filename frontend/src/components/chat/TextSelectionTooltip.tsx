import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Copy } from 'lucide-react';

interface TextSelectionTooltipProps {
  onAddToFollowUp: (text: string) => void;
  onCheckSources: (text: string) => void;
}

export function TextSelectionTooltip({ onAddToFollowUp, onCheckSources }: TextSelectionTooltipProps) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length > 0) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        
        if (rect) {
          setSelectedText(text);
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          });
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddToFollowUp = () => {
    onAddToFollowUp(selectedText);
    setIsVisible(false);
    window.getSelection()?.removeAllRanges();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      setIsVisible(false);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isVisible || !selectedText) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 transform -translate-x-1/2 -translate-y-full"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={handleAddToFollowUp}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add to follow-up
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={handleCopy}
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
