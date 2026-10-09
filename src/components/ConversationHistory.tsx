'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  onOpenAuthModal?: () => void;
  language: Language;
  refreshTrigger?: number;
}

const HISTORY_TEXT = {
  en: {
    title: 'Chat History',
    newChat: 'New Chat',
    searchPlaceholder: 'Search conversations...',
    loading: 'Loading conversations...',
    emptyTitle: 'No conversations yet',
    emptySubtitle: 'Your previous chats and answers will be saved here automatically.',
    noSearchResults: 'No conversations match your search.',
    errorTitle: 'Failed to load history',
    retry: 'Retry',
    today: 'Today',
    yesterday: 'Yesterday',
    previousDays: 'Previous 7 Days',
    older: 'Older',
    close: 'Close history',
    rename: 'Rename',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete conversation',
    deleteConfirmTitle: 'Delete Conversation?',
    deleteConfirmDesc: 'This conversation and all its messages will be permanently removed.',
    deleteButton: 'Delete',
    cancelButton: 'Cancel',
    deleting: 'Deleting...',
    deleteFailed: 'Failed to delete conversation. Please try again.',
    clearAll: 'Clear all',
    clearAllTitle: 'Clear all history?',
    clearAllDesc: 'This will permanently delete all your saved conversations and messages.',
    clearing: 'Clearing...',
    guestTitle: 'Sign in to save your chats',
    guestSubtitle: 'Access your conversation history and verified government scheme guidance across all your devices.',
    signInButton: 'Sign In / Register',
    activeBadge: 'Active',
  },
  hi: {
    title: 'बातचीत का इतिहास',
    newChat: 'नई बातचीत',
    searchPlaceholder: 'बातचीत खोजें...',
    loading: 'बातचीत लोड हो रही है...',
    emptyTitle: 'अभी तक कोई बातचीत नहीं',
    emptySubtitle: 'आपकी पिछली बातचीत और उत्तर यहां स्वचालित रूप से सहेजे जाएंगे।',
    noSearchResults: 'आपकी खोज से मेल खाती कोई बातचीत नहीं मिली।',
    errorTitle: 'इतिहास लोड करने में विफल',
    retry: 'पुनः प्रयास करें',
    today: 'आज',
    yesterday: 'कल',
    previousDays: 'पिछले 7 दिन',
    older: 'पुराने',
    close: 'इतिहास बंद करें',
    rename: 'नाम बदलें',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'बातचीत हटाएं',
    deleteConfirmTitle: 'बातचीत हटाएं?',
    deleteConfirmDesc: 'यह बातचीत और इसके सभी संदेश स्थायी रूप से हटा दिए जाएंगे।',
    deleteButton: 'हटाएं',
    cancelButton: 'रद्द करें',
    deleting: 'हटाया जा रहा है...',
    deleteFailed: 'बातचीत हटाने में विफल। कृपया पुनः प्रयास करें।',
    clearAll: 'सब हटाएं',
    clearAllTitle: 'पूरा इतिहास हटाएं?',
    clearAllDesc: 'यह आपकी सभी सहेजी गई बातचीत और संदेशों को स्थायी रूप से हटा देगा।',
    clearing: 'साफ किया जा रहा है...',
    guestTitle: 'बातचीत सहेजने के लिए साइन इन करें',
    guestSubtitle: 'अपने सभी उपकरणों पर बातचीत का इतिहास और सत्यापित योजना मार्गदर्शन देखने के लिए साइन इन करें।',
    signInButton: 'साइन इन / रजिस्टर',
    activeBadge: 'सक्रिय',
  },
  gu: {
    title: 'વાતચીતનો ઇતિહાસ',
    newChat: 'નવી વાતચીત',
    searchPlaceholder: 'વાતચીત શોધો...',
    loading: 'વાતચીત લોડ થઈ રહી છે...',
    emptyTitle: 'હજી સુધી કોઈ વાતચીત નથી',
    emptySubtitle: 'તમારી અગાઉની વાતચીત અને જવાબો અહીં આપમેળે સાચવવામાં આવશે.',
    noSearchResults: 'કોઈ પરિણામ મળ્યું નથી.',
    errorTitle: 'ઇતિહાસ લોડ કરવામાં નિષ્ફળ',
    retry: 'ફરી પ્રયાસ કરો',
    today: 'આજે',
    yesterday: 'ગઈકાલે',
    previousDays: 'છેલ્લા 7 દિવસ',
    older: 'જૂના',
    close: 'ઇતિહાસ બંધ કરો',
    rename: 'નામ બદલો',
    save: 'સાચવો',
    cancel: 'રદ કરો',
    delete: 'વાતચીત કાઢી નાખો',
    deleteConfirmTitle: 'વાતચીત કાઢી નાખો?',
    deleteConfirmDesc: 'આ વાતચીત અને તેના તમામ સંદેશાઓ કાયમ માટે કાઢી નાખવામાં આવશે.',
    deleteButton: 'કાઢી નાખો',
    cancelButton: 'રદ કરો',
    deleting: 'કાઢી રહ્યું છે...',
    deleteFailed: 'વાતચીત કાઢી નાખવામાં નિષ્ફળ. કૃપા કરીને ફરી પ્રયાસ કરો.',
    clearAll: 'બધું સાફ કરો',
    clearAllTitle: 'બધો ઇતિહાસ કાઢી નાખવો છે?',
    clearAllDesc: 'આ તમારી તમામ સાચવેલી વાતચીત અને સંદેશાઓ કાયમ માટે કાઢી નાખશે.',
    clearing: 'સાફ કરી રહ્યું છે...',
    guestTitle: 'વાતચીત સાચવવા સાઇન ઇન કરો',
    guestSubtitle: 'તમારા તમામ ઉપકરણો પર વાતચીતનો ઇતિહાસ અને ચકાસાયેલ યોજના માર્ગદર્શન મેળવવા માટે સાઇન ઇન કરો.',
    signInButton: 'સાઇન ઇન / રજીસ્ટર',
    activeBadge: 'સક્રિય',
  },
};

interface GroupedConversations {
  today: ConversationItem[];
  yesterday: ConversationItem[];
  previousDays: ConversationItem[];
  older: ConversationItem[];
}

function groupConversations(items: ConversationItem[]): GroupedConversations {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfSevenDaysAgo = startOfToday - 7 * 86400000;

  const groups: GroupedConversations = {
    today: [],
    yesterday: [],
    previousDays: [],
    older: [],
  };

  for (const item of items) {
    const timestamp = new Date(item.updatedAt || item.createdAt).getTime();
    if (timestamp >= startOfToday) {
      groups.today.push(item);
    } else if (timestamp >= startOfYesterday) {
      groups.yesterday.push(item);
    } else if (timestamp >= startOfSevenDaysAgo) {
      groups.previousDays.push(item);
    } else {
      groups.older.push(item);
    }
  }

  return groups;
}

export default function ConversationHistory({
  isOpen,
  onClose,
  user,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onConversationDeleted,
  onOpenAuthModal,
  language,
  refreshTrigger = 0,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingConvId, setLoadingConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Inline rename state
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Single deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<ConversationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Clear all modal state
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

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

  // Fetch conversations whenever drawer opens, user changes, or refreshTrigger updates
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

  // Handle keyboard events (Esc key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingConvId) {
          setEditingConvId(null);
        } else if (deleteTarget && !isDeleting) {
          setDeleteTarget(null);
          setDeleteError(null);
        } else if (showClearAllModal && !isClearingAll) {
          setShowClearAllModal(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deleteTarget, isDeleting, showClearAllModal, isClearingAll, editingConvId, onClose]);

  const handleItemClick = async (id: string) => {
    if (loadingConvId || isDeleting || editingConvId) return;
    try {
      setLoadingConvId(id);
      await onSelectConversation(id);
      onClose();
    } finally {
      setLoadingConvId(null);
    }
  };

  const handleNewChatClick = () => {
    onNewChat();
    onClose();
  };

  const startRename = (conv: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = async (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTitle = editingTitle.trim();
    if (!cleanTitle || isRenaming) return;

    setIsRenaming(true);
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: cleanTitle }),
      });

      if (!res.ok) {
        throw new Error('Failed to update title');
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, title: cleanTitle, updatedAt: new Date().toISOString() } : c
        )
      );
      setEditingConvId(null);
    } catch (err) {
      console.error('Rename failed:', err);
    } finally {
      setIsRenaming(false);
    }
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
      setConversations((prev) => prev.filter((c) => c.id !== deletedId));
      onConversationDeleted?.(deletedId);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setDeleteError(t.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmClearAll = async () => {
    if (isClearingAll) return;

    setIsClearingAll(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to clear conversations');
      }

      setConversations([]);
      setShowClearAllModal(false);
      onConversationDeleted?.(activeConversationId || '');
    } catch (err) {
      console.error('Failed to clear all conversations:', err);
    } finally {
      setIsClearingAll(false);
    }
  };

  // Filtered and grouped conversations
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase().trim();
    return conversations.filter((c) => (c.title || '').toLowerCase().includes(query));
  }, [conversations, searchQuery]);

  const grouped = useMemo(() => groupConversations(filtered), [filtered]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />

        {/* Slide-over Drawer — Deep Navy Glass */}
        <aside
          role="dialog"
          aria-label={t.title}
          aria-modal="true"
          className="slide-in-left relative z-10 flex h-full w-84 max-w-[88vw] flex-col border-r shadow-2xl"
          style={{
            background: 'var(--sidebar-bg)',
            borderColor: 'rgba(232, 89, 12, 0.1)',
            boxShadow: '10px 0 60px -5px rgba(0,0,0,0.7), 0 0 40px -10px rgba(232,89,12,0.08)',
          }}
        >
          {/* Saffron accent line at the top of sidebar */}
          <div style={{ height: '2px', background: 'linear-gradient(90deg, #E8590C, #C2410C, transparent)' }} />

          {/* Top Header */}
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: 'linear-gradient(135deg, rgba(232,89,12,0.2), rgba(232,89,12,0.08))', color: '#E8590C' }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold tracking-tight text-white">{t.title}</h2>
              {conversations.length > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: 'rgba(232,89,12,0.15)', color: '#FB923C' }}
                >
                  {conversations.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {conversations.length > 1 && user && (
                <button
                  onClick={() => setShowClearAllModal(true)}
                  aria-label={t.clearAll}
                  title={t.clearAll}
                  className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              )}

              <button
                onClick={onClose}
                aria-label={t.close}
                className="rounded-full p-1 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* New Chat Button & Search Bar */}
          <div className="p-3 space-y-2">
            <button
              onClick={handleNewChatClick}
              className="btn-press flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-xs font-bold transition-all shadow-sm"
              style={{
                borderColor: 'rgba(232,89,12,0.3)',
                background: 'rgba(232,89,12,0.08)',
                color: '#FB923C',
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>{t.newChat}</span>
            </button>

            {/* Quick Filter Search */}
            {conversations.length > 3 && (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full rounded-lg border px-3 py-1.5 pl-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E8590C]"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
                />
                <svg
                  className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-gray-400 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Conversation List / Guest Prompt */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {!user ? (
              <div
                className="mx-2 my-4 flex flex-col items-center justify-center rounded-2xl border p-5 text-center"
                style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
              >
                <div
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(232,89,12,0.12)', color: '#E8590C' }}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-white mb-1.5">{t.guestTitle}</h3>
                <p className="text-[11px] leading-relaxed text-gray-400 mb-4">{t.guestSubtitle}</p>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuthModal();
                    }}
                    className="btn-cta btn-press flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white"
                  >
                    <span>{t.signInButton}</span>
                  </button>
                )}
              </div>
            ) : isLoading && conversations.length === 0 ? (
              <div className="flex flex-col gap-2 p-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-12 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <p className="text-xs text-red-400">{error}</p>
                <button
                  onClick={fetchConversations}
                  className="mt-3 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-300 hover:border-[#E8590C] hover:text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  {t.retry}
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
                >
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.84-.84c.143-.88.46-1.7.927-2.42A7.848 7.848 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-gray-300">
                  {searchQuery ? t.noSearchResults : t.emptyTitle}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                  {searchQuery ? '' : t.emptySubtitle}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Render grouped sections */}
                {(
                  [
                    { key: 'today', title: t.today, items: grouped.today },
                    { key: 'yesterday', title: t.yesterday, items: grouped.yesterday },
                    { key: 'previousDays', title: t.previousDays, items: grouped.previousDays },
                    { key: 'older', title: t.older, items: grouped.older },
                  ] as const
                ).map((group) => {
                  if (group.items.length === 0) return null;

                  return (
                    <div key={group.key} className="space-y-1">
                      <div
                        className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: '#E8590C' }}
                      >
                        {group.title}
                      </div>

                      {group.items.map((conv) => {
                        const isActive = activeConversationId === conv.id;
                        const isLoadingThis = loadingConvId === conv.id;
                        const isEditingThis = editingConvId === conv.id;

                        return (
                          <div
                            key={conv.id}
                            className="group relative flex items-center justify-between gap-1.5 rounded-xl p-2.5 transition-all"
                            style={{
                              background: isActive
                                ? 'rgba(232, 89, 12, 0.12)'
                                : 'transparent',
                              border: isActive
                                ? '1px solid rgba(232, 89, 12, 0.3)'
                                : '1px solid transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                              }
                            }}
                          >
                            {isEditingThis ? (
                              <form
                                onSubmit={(e) => handleSaveRename(conv.id, e)}
                                className="flex flex-1 items-center gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  disabled={isRenaming}
                                  autoFocus
                                  className="flex-1 rounded-lg border px-2 py-1 text-xs text-white focus:outline-none focus:border-[#E8590C]"
                                  style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
                                />
                                <button
                                  type="submit"
                                  disabled={isRenaming || !editingTitle.trim()}
                                  title={t.save}
                                  className="p-1 text-emerald-400 hover:text-emerald-300"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingConvId(null)}
                                  disabled={isRenaming}
                                  title={t.cancel}
                                  className="p-1 text-gray-500 hover:text-white"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </form>
                            ) : (
                              <>
                                {/* Clickable body to select conversation */}
                                <button
                                  onClick={() => handleItemClick(conv.id)}
                                  disabled={isLoadingThis || isDeleting}
                                  className="flex-1 flex flex-col gap-0.5 text-left min-w-0"
                                >
                                  <div className="flex items-center gap-1.5">
                                    {isActive && (
                                      <span
                                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{ background: '#E8590C', boxShadow: '0 0 6px rgba(232,89,12,0.5)' }}
                                      />
                                    )}
                                    <span
                                      className="truncate text-xs font-semibold"
                                      style={{ color: isActive ? '#FFFFFF' : '#CBD5E1' }}
                                    >
                                      {conv.title || 'New conversation'}
                                    </span>
                                  </div>

                                  {isLoadingThis && (
                                    <div className="mt-0.5 flex items-center gap-1 text-[10px]" style={{ color: '#E8590C' }}>
                                      <span className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
                                      <span>Loading...</span>
                                    </div>
                                  )}
                                </button>

                                {/* Action icons: Rename & Delete */}
                                <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                  {/* Rename button */}
                                  <button
                                    onClick={(e) => startRename(conv, e)}
                                    title={t.rename}
                                    aria-label={`${t.rename} ${conv.title}`}
                                    className="p-1 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                  </button>

                                  {/* Delete button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteTarget(conv);
                                      setDeleteError(null);
                                    }}
                                    disabled={isDeleting}
                                    title={t.delete}
                                    aria-label={`${t.delete} ${conv.title}`}
                                    className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer info */}
          {user && (
            <div className="p-3 text-[11px]" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #E8590C, #C2410C)' }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="truncate text-white font-semibold text-[11px]">{user.name}</span>
                  <span className="truncate text-gray-500 text-[10px]">{user.email}</span>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Single Conversation Deletion Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
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
              background: 'linear-gradient(145deg, #0F1A3C 0%, #0A1128 100%)',
              borderColor: 'rgba(239, 68, 68, 0.25)',
              boxShadow: '0 20px 50px -10px rgba(0,0,0,0.8), 0 0 30px -5px rgba(239,68,68,0.1)',
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
                <p id="delete-dialog-desc" className="mt-1 text-xs text-gray-400 leading-relaxed">
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
                className="rounded-xl border px-3.5 py-2 text-xs font-semibold text-gray-400 transition-colors hover:text-white disabled:opacity-50"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
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

      {/* Clear All Conversations Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!isClearingAll) setShowClearAllModal(false);
            }}
            aria-hidden="true"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border p-5 shadow-2xl transition-all sm:p-6"
            style={{
              background: 'linear-gradient(145deg, #0F1A3C 0%, #0A1128 100%)',
              borderColor: 'rgba(239, 68, 68, 0.25)',
              boxShadow: '0 20px 50px -10px rgba(0,0,0,0.8), 0 0 30px -5px rgba(239,68,68,0.1)',
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
                <h3 className="text-sm font-bold text-white">{t.clearAllTitle}</h3>
                <p className="mt-1 text-xs text-gray-400 leading-relaxed">{t.clearAllDesc}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isClearingAll}
                onClick={() => setShowClearAllModal(false)}
                className="rounded-xl border px-3.5 py-2 text-xs font-semibold text-gray-400 transition-colors hover:text-white disabled:opacity-50"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              >
                {t.cancelButton}
              </button>
              <button
                type="button"
                disabled={isClearingAll}
                onClick={handleConfirmClearAll}
                className="btn-press flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  boxShadow: '0 4px 15px -2px rgba(239,68,68,0.4)',
                }}
              >
                {isClearingAll ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    <span>{t.clearing}</span>
                  </>
                ) : (
                  <span>{t.clearAll}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
