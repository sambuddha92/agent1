'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES, UI_TEXT } from '@/lib/constants';
import UserProfile from './UserProfile';
import {
  Leaf,
  Plus,
  Search,
  Image as ImageIcon,
  Map,
  Trash2,
  X,
} from 'lucide-react';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  conversations?: Array<{
    id: string;
    title: string;
    summary?: string;
    updated_at: string;
  }>;
  currentConversationId?: string | null;
  onNewChat?: () => void;
  onLoadConversation?: (id: string) => void;
  onDeleteConversation?: (id: string, e: React.MouseEvent) => void;
}

export default function AppSidebar({
  isOpen,
  onClose,
  userEmail,
  userName,
  conversations = [],
  currentConversationId,
  onNewChat,
  onLoadConversation,
  onDeleteConversation,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleConversationClick = (id: string) => {
    if (onLoadConversation) {
      onLoadConversation(id);
    }
    // Close drawer on mobile
    onClose();
  };

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    }
    // Close drawer on mobile
    onClose();
  };

  const filteredConversations = conversations.filter(conversation => {
    const query = searchQuery.toLowerCase();
    return (
      conversation.title.toLowerCase().includes(query) ||
      (conversation.summary && conversation.summary.toLowerCase().includes(query))
    );
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="app-sidebar-backdrop lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Fixed Top Section - Never Scrolls */}
        <div className="sidebar-fixed-section">
          {/* App Branding */}
          <div className="px-4 py-5 border-b border-white/10">
            <Link href={ROUTES.CHAT} className="flex items-center gap-3 group" onClick={onClose}>
              <Leaf className="icon-xl text-white group-hover:animate-pulse-soft" />
              <div>
                <h2 className="font-display text-xl font-bold">{UI_TEXT.APP_NAME}</h2>
                <p className="text-xs text-white/70 mt-0.5">{UI_TEXT.APP_TAGLINE}</p>
              </div>
            </Link>
          </div>

          {/* Primary Actions */}
          <div className="px-3 py-4 space-y-2 border-b border-white/10">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/15 hover:bg-white/20 rounded-lg transition-all font-semibold"
              aria-label="Start new chat"
            >
              <Plus className="icon-lg text-white" />
              <span>New Chat</span>
            </button>

            <Link
              href="/images"
              onClick={onClose}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all text-sm font-semibold text-white hover:text-white"
            >
              <ImageIcon className="icon-md text-white" />
              <span>My Garden</span>
            </Link>

            <Link
              href={ROUTES.BLOOM}
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm ${
                pathname === ROUTES.BLOOM
                  ? 'bg-white/15 text-white font-medium'
                  : 'hover:bg-white/10 text-white hover:text-white'
              }`}
            >
              <Map className="icon-md text-white" />
              <span>Neighborhood</span>
            </Link>
          </div>
        </div>

        {/* Scrollable Section */}
        <div className="sidebar-scrollable-section">
          {/* Your Chats Section */}
          <div className="px-3 py-4">
            <h3 className="px-4 text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Your Chats
            </h3>
            {showSearch ? (
              <div className="relative mx-4 mb-3 group transition-all duration-200">
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setShowSearch(false)}
                  className="w-full px-10 py-2.5 bg-white/15 text-white rounded-lg placeholder:text-white/50 pr-10 focus:outline-none focus:ring-2 focus:ring-white/30"
                  autoFocus
                />
                <Search className="absolute left-3 top-2.5 icon-md text-white/50 transition-colors" />
                <button
                  onClick={() => setShowSearch(false)}
                  className="absolute right-3 top-2.5 p-1 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Close search"
                >
                  <X className="icon-md text-white/50 hover:text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all text-sm font-semibold text-white hover:text-white mb-3"
                aria-label="Search chats"
              >
                <Search className="icon-lg text-white" />
                <span>Search Chats</span>
              </button>
            )}
            <div className="space-y-1">
              {filteredConversations.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-white/50">
                    {searchQuery ? 'No matches found' : 'No conversations yet'}
                  </p>
                  <p className="text-xs text-white/40 mt-2">
                    {searchQuery ? 'Try a different search' : 'Start chatting to begin!'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    className={`w-full flex items-start px-4 py-3 rounded-lg transition-all text-left group ${
                      conversation.id === currentConversationId
                        ? 'bg-white/15 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium truncate block">
                          {conversation.title || 'Untitled conversation'}
                        </span>
                        <span className="text-xs text-white/40 flex-shrink-0">
                          {formatDate(conversation.updated_at)}
                        </span>
                      </div>
                      {conversation.summary && (
                        <p className="text-xs text-white/50 mt-1 line-clamp-2">
                          {conversation.summary}
                        </p>
                      )}
                    </div>
                    {onDeleteConversation && (
                      <button
                        onClick={(e) => onDeleteConversation(conversation.id, e)}
                        className="flex-shrink-0 flex items-center justify-center rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Delete conversation"
                        title="Delete"
                      >
                        <Trash2 className="icon-sm" />
                      </button>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User Profile - Fixed at Bottom */}
        <div className="sidebar-footer">
          {userEmail && (
            <UserProfile userEmail={userEmail} userName={userName} />
          )}
        </div>
      </aside>
    </>
  );
}
