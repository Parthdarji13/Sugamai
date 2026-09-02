'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Language } from '@/types/chat';

export interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; name: string; email: string; language: string } | null;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => Promise<void> | void;
  onNewChat: () => void;
  onConversationDeleted?: (deletedId: string) => void;
  language: Language;
  refreshTrigger?: number;
}

const HISTORY_TEXT = {
  en: {
    title: 'Chat History',
    newChat: 'New Chat',
    loading: 'Loading conversations...',
    emptyTitle: 'No conversations yet',
    emptySubtitle: 'Your previous chats and answers will be saved here automatically.',
    errorTitle: 'Failed to load history',
    retry: 'Retry',
    today: 'Today',
    yesterday: 'Yesterday',
    close: 'Close history',
    delete: 'Delete conversation',
    deleteConfirmTitle: 'Delete Conversation?',
    deleteConfirmDesc: 'This conversation and all its messages will be permanently removed.',
    deleteButton: 'Delete',
    cancelButton: 'Cancel',
    deleting: 'Deleting...',
    deleteFailed: 'Failed to delete conversation. Please try again.',
  },
  hi: {
    title: 'बातचीत का इतिहास',
    newChat: 'नई बातचीत',
    loading: 'बातचीत लोड हो रही है...',
    emptyTitle: 'अभी तक कोई बातचीत नहीं',
    emptySubtitle: 'आपकी पिछली बातचीत और उत्तर यहां स्वचालित रूप से सहेजे जाएंगे।',
    errorTitle: 'इतिहास लोड करने में विफल',
    retry: 'पुनः प्रयास करें',
    today: 'आज',
    yesterday: 'कल',
    close: 'इतिहास बंद करें',
    delete: 'बातचीत हटाएं',
    deleteConfirmTitle: 'बातचीत हटाएं?',
    deleteConfirmDesc: 'यह बातचीत और इसके सभी संदेश स्थायी रूप से हटा दिए जाएंगे।',
    deleteButton: 'हटाएं',
    cancelButton: 'रद्द करें',
    deleting: 'हटाया जा रहा है...',
    deleteFailed: 'बातचीत हटाने में विफल। कृपया पुनः प्रयास करें।',
  },
  gu: {
    title: 'વાતચીતનો ઇતિહાસ',
    newChat: 'નવી વાતચીત',
    loading: 'વાતચીત લોડ થઈ રહી છે...',
    emptyTitle: 'હજી સુધી કોઈ વાતચીત નથી',
    emptySubtitle: 'તમારી અગાઉની વાતચીત અને જવાબો અહીં આપમેળે સાચવવામાં આવશે.',
    errorTitle: 'ઇતિહાસ લોડ કરવામાં નિષ્ફળ',
    retry: 'ફરી પ્રયાસ કરો',
    today: 'આજે',
    yesterday: 'ગઈકાલે',
    close: 'ઇતિહાસ બંધ કરો',
    delete: 'વાતચીત કાઢી નાખો',
    deleteConfirmTitle: 'વાતચીત કાઢી નાખો?',
    deleteConfirmDesc: 'આ વાતચીત અને તેના તમામ સંદેશાઓ કાયમ માટે કાઢી નાખવામાં આવશે.',
    deleteButton: 'કાઢી નાખો',
    cancelButton: 'રદ કરો',
    deleting: 'કાઢી રહ્યું છે...',
    deleteFailed: 'વાતચીત કાઢી નાખવામાં નિષ્ફળ. કૃપા કરીને ફરી પ્રયાસ કરો.',
  },
};

function formatDisplayDate(dateStr: string, t: typeof HISTORY_TEXT['en']): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) return t.today;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return t.yesterday;

    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function ConversationHistory({
  isOpen,
  onClose,
  user,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onConversationDeleted,
  language,
  refreshTrigger = 0,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingConvId, setLoadingConvId] = useState<string | null>(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<ConversationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const t = HISTORY_TEXT[language] || HISTORY_TEXT.en;

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/conversations');
      if (res.status === 401) {
        setConversations([]);
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error('Error fetching conversation history:', err);
      setError(t.errorTitle);
    } finally {
      setIsLoading(false);
    }
  }, [user, t.errorTitle]);

  // Fetch conversations whenever user changes, drawer opens, or refreshTrigger updates
  useEffect(() => {
    let isCurrent = true;
    if (isOpen && user) {
      (async () => {
        try {
          const res = await fetch('/api/conversations');
          if (!isCurrent) return;
          if (res.status === 401) {
            setConversations([]);
            return;
          }
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();
          if (isCurrent) {
            if (Array.isArray(data)) {
              setConversations(data);
            } else {
              setConversations([]);
            }
            setError(null);
          }
        } catch (err) {
          console.error('Error fetching conversation history:', err);
          if (isCurrent) setError(t.errorTitle);
        } finally {
          if (isCurrent) setIsLoading(false);
        }
      })();
    }
    return () => {
      isCurrent = false;
    };
  }, [isOpen, user, refreshTrigger, t.errorTitle]);

  // Close on Escape key (closes confirmation dialog first if open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteTarget && !isDeleting) {
          setDeleteTarget(null);
          setDeleteError(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deleteTarget, isDeleting, onClose]);

  const handleItemClick = async (id: string) => {
    if (loadingConvId || isDeleting) return; // Prevent double-clicks
    try {
      setLoadingConvId(id);
      await onSelectConversation(id);
      onClose(); // Automatically close mobile drawer
    } finally {
      setLoadingConvId(null);
    }
  };

  const handleNewChatClick = () => {
    onNewChat();
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/conversations/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || t.deleteFailed);
      }

      const deletedId = deleteTarget.id;

      // 1. Remove from local history list immediately
      setConversations((prev) => prev.filter((c) => c.id !== deletedId));

      // 2. Notify parent if active conversation was deleted
      onConversationDeleted?.(deletedId);

      // 3. Close confirmation modal
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setDeleteError(t.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />

        {/* Slide-over Drawer */}
        <aside
          role="dialog"
          aria-label={t.title}
          aria-modal="true"
          className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col border-r shadow-2xl transition-transform duration-300"
          style={{
            background: 'linear-gradient(180deg, rgba(16,19,26,0.98) 0%, rgba(10,12,18,0.99) 100%)',
            borderColor: 'var(--border-strong)',
            boxShadow: '10px 0 40px -5px rgba(0,0,0,0.8)',
          }}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between border-b px-4 py-3.5" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-sm font-bold tracking-tight text-white">{t.title}</h2>
            </div>

            <button
              onClick={onClose}
              aria-label={t.close}
              className="rounded-full p-1 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button
              onClick={handleNewChatClick}
              className="btn-press flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-xs font-bold transition-all hover:border-[var(--accent)] hover:text-white"
              style={{
                borderColor: 'var(--border-strong)',
                background: 'rgba(59,130,246,0.06)',
                color: 'var(--accent-strong)',
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>{t.newChat}</span>
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {isLoading && conversations.length === 0 ? (
              <div className="flex flex-col gap-2 p-3">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-14 animate-pulse rounded-xl"
                    style={{ background: 'var(--surface)' }}
                  />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <p className="text-xs text-red-400">{error}</p>
                <button
                  onClick={fetchConversations}
                  className="mt-3 rounded-lg border px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {t.retry}
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-[var(--text-muted)]">
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.84-.84c.143-.88.46-1.7.927-2.42A7.848 7.848 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                    />
                  </svg>
                </div>
                <p className="text-xs font-bold text-[var(--text-secondary)]">{t.emptyTitle}</p>
                <p className="mt-1 text-[11px] leading-relaxed">{t.emptySubtitle}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {conversations.map((conv) => {
                  const isActive = activeConversationId === conv.id;
                  const isLoadingThis = loadingConvId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      className={`group flex items-center justify-between gap-1.5 rounded-xl p-2.5 transition-all ${
                        isActive
                          ? 'border bg-[rgba(59,130,246,0.12)] text-white shadow-sm'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-white'
                      }`}
                      style={{
                        borderColor: isActive ? 'rgba(59,130,246,0.4)' : 'transparent',
                      }}
                    >
                      {/* Clickable body to select conversation */}
                      <button
                        onClick={() => handleItemClick(conv.id)}
                        disabled={isLoadingThis || isDeleting}
                        className="flex-1 flex flex-col gap-1 text-left min-w-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold">
                            {conv.title || 'New conversation'}
                          </span>
                          <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                            {formatDisplayDate(conv.updatedAt, t)}
                          </span>
                        </div>

                        {isLoadingThis && (
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--accent)]">
                            <span className="h-2.5 w-2.5 animate-spin rounded-full border border-current border-t-transparent" />
                            <span>Loading...</span>
                          </div>
                        )}
                      </button>

                      {/* Delete icon button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(conv);
                          setDeleteError(null);
                        }}
                        disabled={isDeleting}
                        aria-label={`${t.delete} ${conv.title}`}
                        title={t.delete}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 shrink-0"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer info */}
          {user && (
            <div className="border-t p-3 text-[11px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!isDeleting) {
                setDeleteTarget(null);
                setDeleteError(null);
              }
            }}
            aria-hidden="true"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border p-5 shadow-2xl transition-all sm:p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(16,19,26,0.99) 0%, rgba(12,14,21,1) 100%)',
              borderColor: 'rgba(239, 68, 68, 0.25)',
              boxShadow: '0 20px 50px -10px rgba(0,0,0,0.9), 0 0 30px -5px rgba(239,68,68,0.15)',
            }}
          >
            <div className="flex items-start gap-3.5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 id="delete-dialog-title" className="text-sm font-bold text-white">
                  {t.deleteConfirmTitle}
                </h3>
                <p id="delete-dialog-desc" className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  {deleteTarget.title ? `"${deleteTarget.title}". ` : ''}
                  {t.deleteConfirmDesc}
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                className="rounded-xl border px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-white disabled:opacity-50"
                style={{ borderColor: 'var(--border)' }}
              >
                {t.cancelButton}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="btn-press flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  boxShadow: '0 4px 15px -2px rgba(239,68,68,0.4)',
                }}
              >
                {isDeleting ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    <span>{t.deleting}</span>
                  </>
                ) : (
                  <span>{t.deleteButton}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
