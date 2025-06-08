import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { FileAttachment } from '@/types/chat';
import { Copy, Download, File, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageRendererProps {
  content: string;
  attachments?: FileAttachment[];
  isStreaming?: boolean;
}

export function MessageRenderer({ content, attachments, isStreaming }: MessageRendererProps) {
  const { theme } = useTheme();

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // TODO: Show success toast
  };

  return (
    <div className="space-y-4">
      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 p-2 border rounded-lg bg-background"
            >
              {attachment.type.startsWith('image/') ? (
                <div className="space-y-2">
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="max-w-sm max-h-64 rounded object-cover"
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Image className="w-4 h-4" />
                    <span>{attachment.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4" />
                  <span className="text-sm">{attachment.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => window.open(attachment.url, '_blank')}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Message Content */}
      <div className={cn(isStreaming && "animate-pulse")}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const code = String(children).replace(/\n$/, '');

              return !inline && match ? (
                <div className="relative group">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted text-muted-foreground text-sm border border-b-0 rounded-t-lg">
                    <span>{language}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyCode(code)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <SyntaxHighlighter
                    style={theme === 'dark' ? oneDark : oneLight}
                    language={language}
                    PreTag="div"
                    className="!mt-0 !rounded-t-none"
                    {...props}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code
                  className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            table({ children }) {
              return (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    {children}
                  </table>
                </div>
              );
            },
            th({ children }) {
              return (
                <th className="border border-border px-3 py-2 bg-muted text-left font-medium">
                  {children}
                </th>
              );
            },
            td({ children }) {
              return (
                <td className="border border-border px-3 py-2">
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
                  className="text-primary hover:underline"
                >
                  {children}
                </a>
              );
            },
            blockquote({ children }) {
              return (
                <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
                  {children}
                </blockquote>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
        
        {isStreaming && content === '' && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          </div>
        )}
      </div>
    </div>
  );
}