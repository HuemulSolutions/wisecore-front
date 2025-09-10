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
        className={`px-3 py-2 rounded-lg text-sm ${
          isUser 
            ? 'bg-primary text-white max-w-xs' 
            : 'bg-gray-100 text-gray-800 max-w-md md:max-w-md lg:max-w-md'
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
          <span className="inline-block w-1 h-4 bg-gray-400 ml-1 animate-pulse" />
        )}
      </div>
    </div>
  );
}