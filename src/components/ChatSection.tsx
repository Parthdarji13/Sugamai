'use client';

import React from 'react';
import AnimatedPage from '@/components/AnimatedPage';
import MessageBubble from '@/components/MessageBubble';
import TypingIndicator from '@/components/TypingIndicator';
import { Message, UIText } from '@/types/chat';

interface ChatSectionProps {
  messages: Message[];
  text: UIText;
  isLoading: boolean;
  input: string;
  setInput: (val: string) => void;
  handleSend: (textToSend: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onNewChat?: () => void;
  onBackToHome?: () => void;
}

export default function ChatSection({
  messages,
  text,
  isLoading,
  input,
  setInput,
  handleSend,
  messagesEndRef,
  inputRef,
  onNewChat,
  onBackToHome,
}: ChatSectionProps) {
  const showTypingIndicator =
    isLoading && (messages.length === 0 || messages[messages.length - 1].sender !== 'assistant');

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-between p-4 sm:p-6 min-h-[calc(100vh-80px)]">
      {/* Top action bar */}
      <div className="mb-4 flex justify-between items-center">
        <button
          type="button"
          onClick={onBackToHome || onNewChat}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-white hover:border-[rgba(255,255,255,0.2)]"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {text.backToHome}
        </button>

        {messages.length > 0 && onNewChat && (
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-3.5 py-1.5 text-xs font-semibold text-[var(--accent)] transition-all hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]"
            style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>{text.newChat}</span>
          </button>
        )}
      </div>

      {/* Main chat body */}
      <div className="flex-1 flex flex-col justify-center">
        {messages.length === 0 ? (
          /* New Chat Hero / Welcome Card */
          <div className="my-auto flex flex-col items-center justify-center py-8 text-center animate-fade-in">
            {/* Glowing Emblem */}
            <div
              className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(0,230,118,0.1) 100%)',
                borderColor: 'rgba(59,130,246,0.3)',
                boxShadow: '0 0 35px -5px rgba(59,130,246,0.25)',
              }}
            >
              <svg className="h-8 w-8" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[var(--background)]" />
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              {text.askBoxHeadline}
            </h2>
            <p className="max-w-md text-xs sm:text-sm text-[var(--text-secondary)] mb-8">
              {text.askBoxDesc}
            </p>

            {/* Quick Suggestion Chips */}
            <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3">
              {text.suggestions.map((suggestion: string, idx: number) => {
                const tag = text.suggestionTags?.[idx] || '';
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(suggestion)}
                    className="group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-200 hover:border-[var(--accent)] hover:bg-[rgba(59,130,246,0.06)] active:scale-[0.98]"
                    style={{
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
                      {tag}
                    </span>
                    <span className="mt-2 text-xs font-semibold leading-snug text-white/90 group-hover:text-white">
                      {suggestion}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <AnimatedPage>
            <div className="flex flex-col gap-6 py-4">
              {messages.map((message, idx) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  text={text}
                  assistantLabel={text.assistantLabel}
                  userLabel={text.userLabel}
                  isStreaming={isLoading && idx === messages.length - 1 && message.sender === 'assistant'}
                />
              ))}
              {showTypingIndicator && <TypingIndicator label={text.assistantLabel} />}
              <div ref={messagesEndRef} />
            </div>
          </AnimatedPage>
        )}
      </div>

      <div className="sticky bottom-4 z-10 mt-auto w-full border-t pt-4 bg-[var(--background)]" style={{ borderColor: 'var(--border)' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="animated-border search-focus-glow relative flex w-full items-center rounded-full p-1.5 transition-all"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center pl-4">
            <svg className="h-4 w-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !isLoading) {
                  handleSend(input);
                }
              }
            }}
            placeholder={text.placeholder}
            disabled={isLoading}
            rows={1}
            className="w-full resize-none overflow-y-auto bg-transparent py-3 pl-3 pr-14 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || isLoading}
            className="btn-press absolute right-2 flex h-9 w-9 items-center justify-center rounded-full transition-all disabled:opacity-30"
            style={{ background: 'var(--accent)' }}
          >
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
        <p className="mt-3 px-4 text-center text-[9px] font-medium leading-relaxed text-[var(--text-muted)]">
          ⚠️ {text.disclaimer}
        </p>
      </div>
    </div>
  );
}
