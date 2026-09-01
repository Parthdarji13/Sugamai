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
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setLastMatchedSourceId: (id: string | null) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function ChatSection({
  messages,
  text,
  isLoading,
  input,
  setInput,
  handleSend,
  setMessages,
  setLastMatchedSourceId,
  messagesEndRef,
  inputRef,
}: ChatSectionProps) {
  const showTypingIndicator =
    isLoading && (messages.length === 0 || messages[messages.length - 1].sender !== 'assistant');

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center p-4 sm:p-6">
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => {
            setMessages([]);
            setLastMatchedSourceId(null);
          }}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-white hover:border-[rgba(255,255,255,0.2)]"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {text.backToHome}
        </button>
      </div>

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
