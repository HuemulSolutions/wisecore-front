import Markdown from '@/components/ui/markdown';
import { AlertCircle } from 'lucide-react';
import type { ChatMessage } from '@/types/chatbot';

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
// Message bubble
// ========================================

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isPending = message.status === 'pending';
  const isError = message.status === 'error';

  // Pending assistant message with no content → show typing dots
  if (!isUser && isPending && !message.content) {
    return (
      <div className="flex justify-start">
        <div className="px-3 py-2 rounded-2xl text-sm shadow-sm bg-white border border-gray-100 text-gray-800 max-w-[85%]">
          <TypingIndicator />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
          isUser
            ? 'bg-[#4464f7] text-white max-w-[75%]'
            : isError
              ? 'bg-white border border-red-200 text-gray-800 max-w-[85%]'
              : 'bg-white border border-gray-100 text-gray-800 max-w-[85%]'
        }`}
      >
        {message.content ? (
          <Markdown>
            {message.content.replace(/\\n/g, '\n')}
          </Markdown>
        ) : null}

        {/* Error indicator */}
        {isError && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {message.metadata?.error || 'An error occurred while generating the response.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
