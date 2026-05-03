import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Plus,
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
import { WisyContextChips } from './wisy-context-chips';
import { useChatbotContext } from '@/contexts/chatbot-context';
import { useGlobalPanel } from '@/contexts/global-panel-context';
import { getDefaultLLM, getLLMs } from '@/services/llms';

// ========================================
// Welcome empty state
// ========================================

function WelcomeMessage() {
  const { t } = useTranslation('chatbot');
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center mb-4">
        <Sparkles className="w-6 h-6 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{t('wisy.welcome')}</p>
      <p className="text-xs text-muted-foreground">
        {t('wisy.welcomeSubtext')}
      </p>
    </div>
  );
}

// ========================================
// Wisy Panel
// ========================================

export function WisyPanel() {
  const endRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('chatbot');
  const { closePanel } = useGlobalPanel();
  const [isDragOver, setIsDragOver] = useState(false);
  const {
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
    workingContextItems,
    addWorkingContextItem,
    removeWorkingContextItem,
    currentPageContext,
  } = useChatbotContext();

  // Check if the current page context is already added
  const isPageContextAdded = currentPageContext
    ? workingContextItems.some(
        (i) => i.type === currentPageContext.type && i.id === currentPageContext.id
      )
    : false;

  // ── Drop handlers ─────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('application/wisy-context')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only reset when leaving the panel boundary
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData('application/wisy-context');
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as { type: string; id: string; name: string };
      if (data.type && data.id && data.name) {
        addWorkingContextItem(data);
      }
    } catch { /* ignore malformed data */ }
  }, [addWorkingContextItem]);

  const { data: llms = [], isLoading: isLoadingLlms } = useQuery({
    queryKey: ['llms'],
    queryFn: getLLMs,
    staleTime: 5 * 60 * 1000,
  });

  const { data: defaultLLM, isLoading: isLoadingDefaultLLM } = useQuery({
    queryKey: ['default-llm'],
    queryFn: getDefaultLLM,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  useEffect(() => {
    const hasSelectedModel =
      selectedLlmId !== undefined && llms.some((llm) => llm.id === selectedLlmId);

    if (hasSelectedModel) return;

    const nextLlmId = defaultLLM?.id ?? llms[0]?.id;

    if (nextLlmId) {
      setSelectedLlmId(nextLlmId);
    }
  }, [defaultLLM?.id, llms, selectedLlmId, setSelectedLlmId]);

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

  return (
    <div
      className={`flex flex-col h-full border-l border-border transition-colors ${isDragOver ? 'ring-2 ring-inset ring-primary bg-primary/5' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{t('wisy.name')}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {/* History toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleToggleHistory}
                size="sm"
                variant="ghost"
                className={`hover:cursor-pointer h-7 w-7 p-0 transition-colors ${
                  view === 'history'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
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
                className="text-muted-foreground hover:text-foreground hover:cursor-pointer h-7 w-7 p-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t('actions.newConversation')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Close */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={closePanel}
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground hover:cursor-pointer h-7 w-7 p-0 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t('actions.close')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content area */}
      {view === 'history' ? (
        // ── History view ──────────────────────────────────────
        <div className="flex-1 flex flex-col overflow-hidden">
          <ConversationList
            onSelectConversation={handleSelectConversation}
            activeConversationId={conversationId}
            onDeletedActiveConversation={handleNewConversation}
          />
        </div>
      ) : (
        // ── Chat view ─────────────────────────────────────────
        <>
          {/* Drop overlay */}
          {isDragOver && (
            <div className="flex items-center justify-center py-3 px-4 bg-primary/5 border-b border-primary/20 text-primary text-xs font-medium">
              {t('context.dropHint')}
            </div>
          )}

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            aria-live="polite"
          >
            {isLoadingConversation ? (
              <div className="flex-1 flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
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
          <div className="border-t border-border bg-background px-4 py-3 shrink-0">
            {/* Working context chips + current page badge */}
            <WisyContextChips
              items={workingContextItems}
              onRemove={removeWorkingContextItem}
              currentPageContext={!isPageContextAdded ? currentPageContext : null}
              onAddCurrentPage={currentPageContext ? () => addWorkingContextItem(currentPageContext) : undefined}
            />

            <div className="flex items-end gap-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('input.placeholder')}
                disabled={isInputDisabled}
                rows={1}
                className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm resize-none overflow-hidden min-h-[36px] max-h-28 bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  height: 'auto',
                  minHeight: '36px',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 112) + 'px';
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isInputDisabled}
                size="sm"
                className="hover:cursor-pointer disabled:opacity-50 disabled:hover:cursor-not-allowed flex-shrink-0 h-[36px] min-w-[36px] transition-all"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <div className="mt-1.5 flex items-center gap-2 px-0.5">
              <Bot className="h-3 w-3 shrink-0 text-muted-foreground" />

              <Select
                value={selectedLlmId}
                onValueChange={setSelectedLlmId}
                disabled={isModelSelectorDisabled}
              >
                <SelectTrigger
                  className="h-7 min-w-[120px] max-w-[160px] border-transparent bg-transparent px-2 text-[11px] text-muted-foreground shadow-none transition-colors hover:cursor-pointer hover:border-border hover:bg-accent/50 focus:ring-ring/15 disabled:hover:cursor-not-allowed"
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <SelectValue placeholder={isLoadingLlms ? t('model.loading') : t('model.selectModel')} />
                  </div>
                </SelectTrigger>
                <SelectContent className="border-border bg-popover">
                  {llms.map((llm) => (
                    <SelectItem
                      key={llm.id}
                      value={llm.id}
                      className="text-xs hover:cursor-pointer"
                    >
                      <div className="flex w-full items-center justify-between gap-2 pr-3">
                        <span className="truncate">{llm.name}</span>
                        {defaultLLM?.id === llm.id && (
                          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
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
  );
}
