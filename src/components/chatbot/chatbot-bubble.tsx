import Markdown from '@/components/ui/markdown';
import { AlertCircle, Loader2, FileText, FolderClosed, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ChatMessage, WorkingContextItem } from '@/types/chatbot';

// ========================================
// Typing indicator (animated dots)
// ========================================

function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 px-0.5 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
          style={{
            animation: 'typing-bounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ========================================
// Context chips shown on user messages
// ========================================

const CONTEXT_ICON: Record<string, typeof FileText> = {
  document: FileText,
  folder: FolderClosed,
  execution: Zap,
};

function MessageContextChips({ items }: { items: WorkingContextItem[] }) {
  return (
    <div className="flex flex-wrap gap-1 mb-1.5">
      {items.map((item) => {
        const Icon = CONTEXT_ICON[item.type] ?? FileText;
        return (
          <span
            key={`${item.type}:${item.id}`}
            className="inline-flex items-center gap-1 max-w-[160px] rounded-sm bg-white/15 px-1.5 py-0.5 text-[10px] leading-tight text-primary-foreground/90"
          >
            <Icon className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{item.name}</span>
          </span>
        );
      })}
    </div>
  );
}

// ========================================
// Message bubble
// ========================================

interface MessageBubbleProps {
  message: ChatMessage;
}

function AssistantStatusLine({ message }: MessageBubbleProps) {
  const { t } = useTranslation('chatbot');
  const toolMessage = message.metadata?.progress?.tool_message;
  const statusMessage = toolMessage || t('status.thinking');

  return (
    <div className="flex items-center gap-1.5 mb-2 text-[11px] text-muted-foreground animate-in fade-in duration-200">
      <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin text-primary/70" />
      <span className="leading-none">{statusMessage}</span>
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { t } = useTranslation('chatbot');
  const isUser = message.role === 'user';
  const isPending = message.status === 'pending';
  const isError = message.status === 'error';

  // Pending assistant message with no content → show subtle status
  if (!isUser && isPending && !message.content) {
    return (
      <div className="flex justify-start">
        <div className="px-3.5 py-2.5 rounded-md text-[13px] bg-card border border-border text-foreground max-w-[85%]">
          <AssistantStatusLine message={message} />
          <div className="opacity-70">
            <TypingIndicator />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`px-3.5 py-2.5 rounded-md text-[13px] ${
          isUser
            ? 'bg-primary text-primary-foreground max-w-[75%]'
            : isError
              ? 'bg-card border border-red-200 text-foreground max-w-[85%]'
              : 'bg-card border border-border text-foreground max-w-[85%]'
        }`}
      >
        {!isUser && isPending && <AssistantStatusLine message={message} />}

        {/* Working context chips on user messages */}
        {isUser && message.working_context_items && message.working_context_items.length > 0 && (
          <MessageContextChips items={message.working_context_items} />
        )}

        {message.content ? (
          <div className="[&_p]:text-[13px] [&_p]:leading-relaxed [&_li]:text-[13px] [&_li]:leading-relaxed [&_ul]:text-[13px] [&_ol]:text-[13px] [&_code]:text-xs">
            <Markdown>
              {message.content.replace(/\\n/g, '\n')}
            </Markdown>
          </div>
        ) : null}

        {/* Error indicator */}
        {isError && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {message.metadata?.error || t('status.errorDefault')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
