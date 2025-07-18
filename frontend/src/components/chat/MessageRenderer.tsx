import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { FileAttachment } from '@/types/chat';
import { Copy, Download, File, Image, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { mathRenderer } from '@/services/math/katex-renderer';

interface MessageRendererProps {
  content: string;
  attachments?: FileAttachment[];
  isStreaming?: boolean;
}

export function MessageRenderer({ content, attachments, isStreaming }: MessageRendererProps) {
  const { theme } = useTheme();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Enhanced processing for electronics content
  const processElectronicsContent = (text: string): string => {
    // Process inline math expressions
    let processedText = mathRenderer.renderInlineExpressions(text);
    
    // Process circuit analysis patterns
    processedText = processedText.replace(
      /\b(KCL|KVL|Ohm's Law|BJT|MOSFET|voltage divider|current divider|amplifier|RC circuit|LC circuit|RLC circuit)\b/gi,
      '<span class="electronics-term">$1</span>'
    );
    
    // Process value patterns (e.g., "10kΩ", "5V", "2.5mA")
    processedText = processedText.replace(
      /(\d+(?:\.\d+)?)\s*([kmugMGnpμ]?)([VIAWΩΩFHzs])/g,
      '<span class="electronics-value">$1$2$3</span>'
    );
    
    return processedText;
  };

  return (
    <div className="space-y-4">
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-muted hover:shadow-sm transition-shadow"
            >
              {attachment.type.startsWith('image/') ? (
                <div className="space-y-2">
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="max-w-xs max-h-48 object-cover rounded-t-lg"
                  />
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Image className="w-3 h-3" />
                      <span>{attachment.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3">
                  <File className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{attachment.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={cn("prose prose-base max-w-none dark:prose-invert electronics-content")}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const code = String(children).replace(/\n$/, '');
              const inline = !match;

              return !inline && match ? (
                <div className="group relative my-4 overflow-hidden rounded-lg border border-border bg-muted/50">
                  <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border/50">
                    <span className="text-xs font-medium text-muted-foreground">
                      {language || 'code'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyCode(code)}
                    >
                      {copiedCode === code ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <SyntaxHighlighter
                      style={theme === 'dark' ? (oneDark as { [key: string]: React.CSSProperties }) : (oneLight as { [key: string]: React.CSSProperties })}
                      language={language}
                      PreTag="div"
                      className="!mt-0 !mb-0 !bg-transparent"
                      customStyle={{
                        margin: 0,
                        padding: '12px',
                        background: 'transparent',
                        fontSize: '13px',
                        lineHeight: '1.4',
                      }}
                    >
                      {code}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ) : (
                <code
                  className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            },

            ol({ children, ...props }) {
              return (
                <ol className="space-y-1 pl-6 my-3 list-decimal" {...props}>
                  {children}
                </ol>
              );
            },
            ul({ children, ...props }) {
              return (
                <ul className="space-y-1 pl-6 my-3 list-disc" {...props}>
                  {children}
                </ul>
              );
            },
            li({ children, ...props }) {
              return (
                <li className="text-foreground leading-relaxed" {...props}>
                  {children}
                </li>
              );
            },

            table({ children }) {
              return (
                <div className="my-4 overflow-hidden rounded-lg border border-border">
                  <table className="w-full border-collapse">
                    {children}
                  </table>
                </div>
              );
            },
            th({ children }) {
              return (
                <th className="border-b border-border px-3 py-2 bg-muted text-left font-medium text-sm text-foreground">
                  {children}
                </th>
              );
            },
            td({ children }) {
              return (
                <td className="border-b border-border px-3 py-2 text-sm text-foreground">
                  {children}
                </td>
              );
            },

            a({ href, children }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline underline-offset-2"
                >
                  {children}
                </a>
              );
            },

            blockquote({ children }) {
              return (
                <blockquote className="my-4 border-l-4 border-border bg-muted/50 pl-4 py-2 italic text-foreground">
                  {children}
                </blockquote>
              );
            },

            h1({ children }) {
              return <h1 className="text-xl font-semibold mt-6 mb-3 text-foreground">{children}</h1>;
            },
            h2({ children }) {
              return <h2 className="text-lg font-semibold mt-5 mb-2 text-foreground">{children}</h2>;
            },
            h3({ children }) {
              return <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>;
            },

            p({ children }) {
              return <p className="leading-relaxed text-foreground my-2">{children}</p>;
            },
          }}
        >
          {processElectronicsContent(content)}
        </ReactMarkdown>

        {isStreaming && content === '' && (
          <div className="flex items-center gap-1 py-2">
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
          </div>
        )}
      </div>
      
      {/* Electronics-specific styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .electronics-content .electronics-term {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 600;
            position: relative;
          }
          
          .electronics-content .electronics-value {
            background: #f0f9ff;
            color: #0369a1;
            padding: 0.125rem 0.375rem;
            border-radius: 0.375rem;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 0.875em;
            border: 1px solid #0ea5e9;
            font-weight: 500;
          }
          
          .dark .electronics-content .electronics-value {
            background: #0c4a6e;
            color: #7dd3fc;
            border-color: #0ea5e9;
          }
          
          .electronics-content .math-solution {
            margin: 1rem 0;
            padding: 1rem;
            background: #fafafa;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
          }
          
          .dark .electronics-content .math-solution {
            background: #1f2937;
            border-color: #374151;
          }
          
          .electronics-content .circuit-container {
            margin: 1rem 0;
            padding: 1rem;
            background: #ffffff;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .dark .electronics-content .circuit-container {
            background: #111827;
            border-color: #374151;
          }
        `
      }} />
    </div>
  );
}
