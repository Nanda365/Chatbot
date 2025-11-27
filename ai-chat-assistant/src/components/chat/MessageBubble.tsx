import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  status?: 'sending' | 'delivered' | 'error';
}

export function MessageBubble({ content, role, timestamp, status }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 animate-slide-up',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-subtle">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-3 shadow-subtle transition-all',
          isUser
            ? 'bg-chat-bubble-user text-white rounded-br-md'
            : 'bg-chat-bubble-assistant text-foreground rounded-bl-md'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>
        {timestamp && (
          <div className={cn(
            'mt-1 text-xs flex items-center gap-1',
            isUser ? 'text-white/70 justify-end' : 'text-muted-foreground'
          )}>
            <span>{timestamp}</span>
            {status && isUser && (
              <span className={cn(
                status === 'sending' && 'text-white/50',
                status === 'error' && 'text-red-300'
              )}>
                {status === 'sending' && '•'}
                {status === 'delivered' && '✓'}
                {status === 'error' && '✗'}
              </span>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-subtle">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}
