import Markdown from '@/components/ui/markdown';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isStreaming?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

// ...existing code...
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
          isUser 
            ? 'bg-[#4464f7] text-white max-w-[75%]' 
            : 'bg-white border border-gray-100 text-gray-800 max-w-[85%]'
        }`}
      >
        {message.text ? (
          <Markdown>
            {message.text.replace(/\\n/g, "\n")}
          </Markdown>
        ) : message.isStreaming ? (
          '…'
        ) : null}
        {message.isStreaming && (
          <span className="inline-block w-1 h-4 bg-[#4464f7] ml-1 animate-pulse rounded-full" />
        )}
      </div>
    </div>
  );
}