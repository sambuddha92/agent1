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
  Trash2,
  X,
  MessageSquare,
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
    onClose();
  };

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    }
    onClose();
  };

  const filteredConversations = conversations.filter(conversation => {
    const query = searchQuery.toLowerCase();
    return (
      conversation.title.toLowerCase().includes(query) ||
      (conversation.summary && conversation.summary.toLowerCase().includes(query))
    );
  });

  const isGarden = pathname === ROUTES.GARDEN;

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
        {/* Fixed Top Section */}
        <div className="sidebar-fixed-section">
          {/* App Branding - Minimalist */}
          <div className="px-4 py-6 border-b border-white/10">
            <Link href={ROUTES.CHAT} className="flex items-center gap-2 group" onClick={onClose}>
              <Leaf className="icon-xl text-white group-hover:animate-pulse-soft flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-lg font-bold text-white truncate">{UI_TEXT.APP_NAME}</h2>
              </div>
            </Link>
          </div>

          {/* Primary Navigation - ChatGPT Style */}
          <div className="px-3 py-4 space-y-2 border-b border-white/10">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/15 hover:bg-white/20 rounded-lg transition-all font-medium text-white text-sm active-press"
              aria-label="Start new chat"
            >
              <Plus className="icon-lg text-white flex-shrink-0" />
              <span className="truncate">New Chat</span>
            </button>

            {/* Primary Nav Items - Clean Single Line */}
            <Link
              href={ROUTES.GARDEN}
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium truncate ${
                isGarden
                  ? 'bg-white/15 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ImageIcon className="icon-md text-white flex-shrink-0" />
              <span className="truncate">My Garden</span>
            </Link>

          </div>
        </div>

        {/* Scrollable Section - Conversation History */}
        <div className="sidebar-scrollable-section">
          <div className="px-3 py-4">
            {/* Section Header - Uppercase, Muted (ChatGPT Style) */}
            <div className="flex items-center justify-between mb-3 px-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide">
                Chats
              </h3>
              {!showSearch && conversations.length > 0 && (
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  aria-label="Search chats"
                  title="Search"
                >
                  <Search className="icon-sm text-white/40 hover:text-white/60" />
                </button>
              )}
            </div>

            {/* Search Bar */}
            {showSearch && (
              <div className="relative mx-4 mb-4 group transition-all duration-200 animate-scale-in">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowSearch(false);
                      setSearchQuery('');
                    }
                  }}
                  className="w-full px-3 py-2 bg-white/15 text-white rounded-md placeholder:text-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded transition-colors"
                  aria-label="Close search"
                >
                  <X className="icon-sm text-white/40 hover:text-white/70" />
                </button>
              </div>
            )}

            {/* Conversation List */}
            <div className="space-y-1">
              {filteredConversations.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <MessageSquare className="icon-md text-white/20 mx-auto mb-2" />
                  <p className="text-xs text-white/40">
                    {searchQuery ? 'No matches' : 'No chats yet'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    className={`w-full flex items-start gap-2 px-3 py-2.5 rounded-md transition-all text-left group overflow-hidden ${
                      conversation.id === currentConversationId
                        ? 'bg-white/15 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex-1 min-w-0 mt-0.5">
                      <p className="text-xs font-medium truncate leading-snug">
                        {conversation.title || 'Untitled'}
                      </p>
                      {conversation.summary && (
                        <p className="text-xs text-white/50 mt-0.5 line-clamp-1">
                          {conversation.summary}
                        </p>
                      )}
                    </div>
                    {onDeleteConversation && (
                      <button
                        onClick={(e) => onDeleteConversation(conversation.id, e)}
                        className="flex-shrink-0 p-1.5 rounded hover:bg-red-500/20 text-white/30 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Delete conversation"
                        title="Delete"
                      >
                        <Trash2 className="icon-xs" />
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
