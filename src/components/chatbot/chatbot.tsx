// src/components/Chatbot.tsx
import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Plus, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./bubble";
import type { Message } from "./bubble";
import { chatbot } from "@/services/generate";

interface ChatbotProps {
  executionId: string;
}

export default function Chatbot({ executionId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al enviar o recibir mensajes
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: "1",
        text: "Hi! How can I assist you today?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
    setThreadId(null);
    setInputValue("");
    setIsLoading(false);
  }, [executionId]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;
    const content = inputValue.trim();

    // 1) Añadir mensaje del usuario
    const userMsg: Message = {
      id: Date.now().toString(),
      text: content,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    // 2) Añadir placeholder para el bot
    const botMessageId = (Date.now() + 1).toString();
    const botMsg: Message = {
      id: botMessageId,
      text: "",
      sender: "bot",
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, botMsg]);

    // 3) Usar el servicio chatbot
    chatbot({
      executionId,
      user_message: content,
      threadId: threadId || undefined,
      onData: (text: string) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? { ...msg, text: (msg.text || "") + text, isStreaming: true }
              : msg
          )
        );
      },
      onThreadId: (newThreadId: string) => {
        setThreadId(newThreadId);
      },
      onError: (error: Event) => {
        console.error("Error en chatbot:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
        setIsLoading(false);
      },
      onClose: () => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
        setIsLoading(false);
      },
    });
  };

  const handleClearConversation = () => {
    setMessages([
      {
        id: "1",
        text: "Hi! How can I assist you today?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
    setThreadId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Botón burbuja */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full bg-primary hover:bg-secondary hover:cursor-pointer text-white shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Ventana de chat */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 z-50 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded
              ? 'w-[min(100vw-4rem,1100px)] h-[min(100vh-6rem,900px)]'
              : 'w-[520px] h-[600px]'
          }`}
        >
          {/* Header */}
          <div className="bg-primary text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">Wisecore AI</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                size="sm"
                variant="ghost"
                className="text-white hover:text-gray-200 hover:bg-primary/20 hover:cursor-pointer h-8 w-8 p-0"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                onClick={handleClearConversation}
                size="sm"
                variant="ghost"
                className="text-white hover:text-gray-200 hover:bg-primary/20 hover:cursor-pointer h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mensajes */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            aria-live="polite"
          >
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={endRef} />
          </div>

            {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-end space-x-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Write your message..."
                disabled={isLoading}
                rows={1}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none overflow-hidden min-h-[38px] max-h-32"
                style={{
                  height: "auto",
                  minHeight: "38px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 128) + "px";
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                className="bg-primary hover:bg-secondary hover:cursor-pointer text-white px-3 py-2 disabled:opacity-50 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
