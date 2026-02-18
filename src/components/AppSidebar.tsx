'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES, UI_TEXT } from '@/lib/constants';
import UserProfile from './UserProfile';
import PWAInstallPrompt from './PWAInstallPrompt';
import { SidebarConversationListSkeleton, SidebarProfileSkeleton } from './Skeletons';
import {
  Leaf,
  Plus,
  Search,
  Image as ImageIcon,
  Trash2,
  X,
  MessageSquare,
  PanelLeftClose,
  Clock,
} from 'lucide-react';

interface ConversationItem {
  id: string;
  title: string;
  summary?: string;
  updated_at: string;
}

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  conversations?: ConversationItem[];
  currentConversationId?: string | null;
  onNewChat?: () => void;
  onLoadConversation?: (id: string) => void;
  onDeleteConversation?: (id: string, e: React.MouseEvent) => void;
  isLoadingUser?: boolean;
  isLoadingConversations?: boolean;
}

// Date grouping helper functions
function getDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= weekAgo) return 'Previous 7 Days';
  if (date >= monthAgo) return 'Previous 30 Days';
  return 'Older';
}

function groupConversationsByDate(conversations: ConversationItem[]): Map<string, ConversationItem[]> {
  const groups = new Map<string, ConversationItem[]>();
  const order = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Older'];
  
  // Initialize groups in order
  order.forEach(group => groups.set(group, []));
  
  conversations.forEach(conv => {
    const group = getDateGroup(conv.updated_at);
    const existing = groups.get(group) || [];
    existing.push(conv);
    groups.set(group, existing);
  });
  
  // Remove empty groups
  order.forEach(group => {
    if (groups.get(group)?.length === 0) {
      groups.delete(group);
    }
  });
  
  return groups;
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
  isLoadingUser = false,
  isLoadingConversations = false,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to check if we're on mobile viewport (< 1024px)
  const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth < 1024;

  // Only close sidebar on mobile, keep open on desktop
  const closeSidebarOnMobile = () => {
    if (isMobileViewport()) {
      onClose();
    }
  };

  const handleConversationClick = (id: string) => {
    if (onLoadConversation) {
      onLoadConversation(id);
    }
    // Only close on mobile - keep sidebar open on desktop
    closeSidebarOnMobile();
  };

  const handleConversationKeyDown = (id: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleConversationClick(id);
    }
  };

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    }
    // Only close on mobile - keep sidebar open on desktop
    closeSidebarOnMobile();
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      const query = searchQuery.toLowerCase();
      return (
        conversation.title.toLowerCase().includes(query) ||
        (conversation.summary && conversation.summary.toLowerCase().includes(query))
      );
    });
  }, [conversations, searchQuery]);

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    return groupConversationsByDate(filteredConversations);
  }, [filteredConversations]);

  const isGarden = pathname === ROUTES.GARDEN;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="sidebar-backdrop lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {/* Fixed Top Section */}
        <div className="sidebar-header-section">
          {/* App Branding with Close Button */}
          <div className="sidebar-branding">
            <Link href={ROUTES.CHAT} className="sidebar-logo-link" onClick={closeSidebarOnMobile}>
              <div className="sidebar-logo-icon">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="sidebar-logo-text">{UI_TEXT.APP_NAME}</span>
            </Link>
            
            {/* Close/Collapse Button - Always Visible */}
            <button
              onClick={onClose}
              className="sidebar-close-btn"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation */}
          <div className="sidebar-nav">
            {/* New Chat Button - Premium Style */}
            <button
              onClick={handleNewChat}
              className="sidebar-new-chat-btn"
              aria-label="Start new chat"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>

            {/* Garden Link */}
            <Link
              href={ROUTES.GARDEN}
              onClick={closeSidebarOnMobile}
              className={`sidebar-nav-link ${isGarden ? 'active' : ''}`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>My Garden</span>
            </Link>
          </div>
        </div>

        {/* Scrollable Section - Conversation History */}
        <div className="sidebar-content">
          <div className="sidebar-section-inner">
            {/* Section Header */}
            <div className="sidebar-section-header">
              <h3 className="sidebar-section-title">History</h3>
              {!showSearch && conversations.length > 0 && (
                <button
                  onClick={() => setShowSearch(true)}
                  className="sidebar-search-toggle"
                  aria-label="Search chats"
                  title="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Bar */}
            {showSearch && (
              <div className="sidebar-search-container animate-scale-in">
                <Search className="sidebar-search-icon" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowSearch(false);
                      setSearchQuery('');
                    }
                  }}
                  className="sidebar-search-input"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="sidebar-search-clear"
                  aria-label="Close search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Conversation List */}
            <div className="sidebar-conversation-list">
              {isLoadingConversations ? (
                <SidebarConversationListSkeleton count={4} />
              ) : filteredConversations.length === 0 ? (
                <div className="sidebar-empty-state">
                  <div className="sidebar-empty-icon">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="sidebar-empty-text">
                    {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                  </p>
                  <p className="sidebar-empty-subtext">
                    {searchQuery ? 'Try a different search term' : 'Start a new chat to begin'}
                  </p>
                </div>
              ) : (
                <div className="sidebar-groups animate-fade-in">
                  {Array.from(groupedConversations.entries()).map(([group, convs]) => (
                    <div key={group} className="sidebar-group">
                      <div className="sidebar-group-header">
                        <Clock className="w-3 h-3" />
                        <span>{group}</span>
                      </div>
                      <div className="sidebar-group-items">
                        {convs.map((conversation) => (
                          <div
                            key={conversation.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleConversationClick(conversation.id)}
                            onKeyDown={(e) => handleConversationKeyDown(conversation.id, e)}
                            className={`sidebar-conversation-item ${
                              conversation.id === currentConversationId ? 'active' : ''
                            }`}
                          >
                            <div className="sidebar-conversation-content">
                              <p className="sidebar-conversation-title">
                                {conversation.title || 'Untitled'}
                              </p>
                              {conversation.summary && (
                                <p className="sidebar-conversation-summary">
                                  {conversation.summary}
                                </p>
                              )}
                            </div>
                            {onDeleteConversation && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteConversation(conversation.id, e);
                                }}
                                className="sidebar-delete-btn"
                                aria-label="Delete conversation"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Profile - Fixed at Bottom */}
        <div className="sidebar-footer">
          {isLoadingUser ? (
            <SidebarProfileSkeleton />
          ) : userEmail ? (
            <div className="animate-fade-in">
              {/* PWA Install Prompt - Only on mobile */}
              <PWAInstallPrompt />
              <UserProfile userEmail={userEmail} userName={userName} />
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
