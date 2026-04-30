import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  MessageCircle,
  X,
  Send,
  Plus,
  Maximize2,
  Minimize2,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { MessageBubble } from './chatbot-bubble';
import { ConversationList } from './conversation-list';
import { ChatbotProvider, useChatbotContext, useOptionalChatbotContext } from '@/contexts/chatbot-context';
import { getDefaultLLM, getLLMs } from '@/services/llms';

// ========================================
// Types
// ========================================

interface ChatbotProps {
  /** Execution/version ID — if provided, sent as reference with every message */
  executionId?: string;
  /** Document ID — used as fallback reference when no executionId is available */
  documentId?: string;
}

// ========================================
// Welcome empty state
// ========================================

function WelcomeMessage() {
  const { t } = useTranslation('chatbot');
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="w-12 h-12 bg-[#4464f7]/10 rounded-full flex items-center justify-center mb-4">
        <MessageCircle className="w-6 h-6 text-[#4464f7]" />
      </div>
      <p className="text-sm text-gray-500">
        {t('welcome.message')}
      </p>
    </div>
  );
}

// ========================================
// Chatbot component
// ========================================

function ChatbotContent() {
  const endRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('chatbot');
  const {
    isOpen,
    setIsOpen,
    isExpanded,
    setIsExpanded,
    inputValue,
    setInputValue,
    view,
    setView,
    selectedLlmId,
    setSelectedLlmId,
    conversationId,
    messages,
    isTyping,
    sendMessage,
    startNewConversation,
    loadConversation,
    isSending,
    isLoadingConversation,
  } = useChatbotContext();

  const { data: llms = [], isLoading: isLoadingLlms } = useQuery({
    queryKey: ['llms'],
    queryFn: getLLMs,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: defaultLLM, isLoading: isLoadingDefaultLLM } = useQuery({
    queryKey: ['default-llm'],
    queryFn: getDefaultLLM,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  useEffect(() => {
    if (!isOpen) return;

    const hasSelectedModel =
      selectedLlmId !== undefined && llms.some((llm) => llm.id === selectedLlmId);

    if (hasSelectedModel) return;

    const nextLlmId = defaultLLM?.id ?? llms[0]?.id;

    if (nextLlmId) {
      setSelectedLlmId(nextLlmId);
    }
  }, [defaultLLM?.id, isOpen, llms, selectedLlmId, setSelectedLlmId]);

  // ── Auto-scroll on new messages ─────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Handlers ────────────────────────────────────────────────
  const handleSendMessage = () => {
    if (!inputValue.trim() || isSending || isTyping) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleNewConversation = () => {
    startNewConversation();
    setView('chat');
  };

  const handleToggleHistory = () => {
    setView(view === 'chat' ? 'history' : 'chat');
  };

  const handleSelectConversation = (selectedConversationId: string) => {
    loadConversation(selectedConversationId);
    setView('chat');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isInputDisabled = isSending || isTyping || isLoadingConversation;
  const isModelSelectorDisabled =
    isInputDisabled || isLoadingLlms || isLoadingDefaultLLM || llms.length === 0;
  const modelSelectorHint = isTyping || isSending
    ? t('model.lockedWhileGenerating')
    : isLoadingConversation
      ? t('model.lockedWhileLoading')
      : llms.length === 0
        ? t('model.noModels')
        : t('model.appliesToNext');

  return (
    <>
      {/* Floating trigger button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Chat window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded
              ? 'w-[min(100vw-4rem,1100px)] h-[min(100vh-6rem,900px)]'
              : 'w-[520px] h-[600px]'
          }`}
        >
          {/* Header */}
          <div className="bg-[#4464f7] text-white px-5 py-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold text-base">{t('header.title')}</h3>
            </div>
            <div className="flex items-center space-x-1">
              {/* Expand / Collapse */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:text-white hover:bg-white/20 hover:cursor-pointer h-8 w-8 p-0 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{isExpanded ? t('actions.collapse') : t('actions.expand')}</p>
                </TooltipContent>
              </Tooltip>

              {/* History toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleToggleHistory}
                    size="sm"
                    variant="ghost"
                    className={`text-white hover:text-white hover:cursor-pointer h-8 w-8 p-0 rounded-lg transition-colors ${
                      view === 'history'
                        ? 'bg-white/20'
                        : 'hover:bg-white/20'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t('actions.conversationHistory')}</p>
                </TooltipContent>
              </Tooltip>

              {/* New conversation */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleNewConversation}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:text-white hover:bg-white/20 hover:cursor-pointer h-8 w-8 p-0 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t('actions.newConversation')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Content area */}
          {view === 'history' ? (
            // ── History view ──────────────────────────────────────
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 animate-in fade-in duration-300">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                activeConversationId={conversationId}
              />
            </div>
          ) : (
            // ── Chat view ─────────────────────────────────────────
            <>
              {/* Messages area */}
              <div
                className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50/50"
                aria-live="polite"
              >
                {isLoadingConversation ? (
                  <div className="flex-1 flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 text-[#4464f7] animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <WelcomeMessage />
                ) : (
                  messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))
                )}
                <div ref={endRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-gray-100 bg-white px-5 py-4">
                <div className="flex items-end space-x-3">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('input.placeholder')}
                    disabled={isInputDisabled}
                    rows={1}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4464f7] focus:border-transparent text-sm resize-none overflow-hidden min-h-[44px] max-h-32 bg-gray-50 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      height: 'auto',
                      minHeight: '38px',
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isInputDisabled}
                    size="sm"
                    className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-white px-4 py-3 disabled:opacity-50 disabled:hover:cursor-not-allowed flex-shrink-0 rounded-xl h-[44px] min-w-[44px] transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                <div className="mt-2 flex items-center gap-2 px-1">
                  <Bot className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                  <Select
                    value={selectedLlmId}
                    onValueChange={setSelectedLlmId}
                    disabled={isModelSelectorDisabled}
                  >
                    <SelectTrigger
                      aria-label={modelSelectorHint}
                      className="h-8 min-w-[132px] max-w-[180px] rounded-lg border-transparent bg-transparent px-2 text-xs text-slate-500 shadow-none transition-colors hover:cursor-pointer hover:border-slate-200 hover:bg-slate-50/70 focus:ring-[#4464f7]/15 disabled:hover:cursor-not-allowed"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <SelectValue placeholder={isLoadingLlms ? t('model.loading') : t('model.selectModel')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 bg-white shadow-xl">
                      {llms.map((llm) => (
                        <SelectItem
                          key={llm.id}
                          value={llm.id}
                          className="rounded-lg text-sm text-slate-700 hover:cursor-pointer"
                        >
                          <div className="flex w-full items-center justify-between gap-3 pr-4">
                            <span className="truncate">{llm.name}</span>
                            {defaultLLM?.id === llm.id && (
                              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-500">
                                {t('model.default')}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default function Chatbot({ executionId, documentId }: ChatbotProps) {
  const existingContext = useOptionalChatbotContext();

  if (existingContext) {
    return <ChatbotContent />;
  }

  if (executionId || documentId) {
    return (
      <ChatbotProvider executionId={executionId} documentId={documentId}>
        <ChatbotContent />
      </ChatbotProvider>
    );
  }

  return (
    <ChatbotProvider>
      <ChatbotContent />
    </ChatbotProvider>
  );
}
