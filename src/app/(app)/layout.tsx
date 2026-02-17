'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { API_ENDPOINTS } from '@/lib/constants';
import MobileHeader from '@/components/MobileHeader';
import AppSidebar from '@/components/AppSidebar';
import type { User } from '@supabase/supabase-js';
import type { Conversation } from '@/types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  // Load conversations function (memoized for reuse)
  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CONVERSATIONS);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('[layout] Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Load user and conversations in parallel on mount
  useEffect(() => {
    async function loadInitialData() {
      // Fetch user and conversations in parallel for faster loading
      const [currentUser] = await Promise.all([
        getCurrentUser(),
        loadConversations()
      ]);
      setUser(currentUser);
      setIsLoadingUser(false);
    }
    loadInitialData();
  }, [loadConversations]);

  // Listen for conversation updates from chat page
  useEffect(() => {
    const handleConversationCreated = () => {
      loadConversations();
    };

    window.addEventListener('conversationCreated', handleConversationCreated);
    
    return () => {
      window.removeEventListener('conversationCreated', handleConversationCreated);
    };
  }, [loadConversations]);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    router.push('/chat');
  };

  const handleLoadConversation = (id: string) => {
    setCurrentConversationId(id);
    router.push(`/chat?id=${id}`);
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        
        if (conversationId === currentConversationId) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('[layout] Error deleting conversation:', error);
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <MobileHeader onMenuToggle={handleMenuToggle} isMenuOpen={isMenuOpen} />

      {/* Sidebar/Drawer */}
      <AppSidebar
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        userEmail={user?.email || ''}
        userName={user?.user_metadata?.full_name}
        conversations={conversations.map(conv => ({
          id: conv.id,
          title: conv.title || 'Untitled',
          summary: conv.summary || undefined,
          updated_at: conv.updated_at
        }))}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onLoadConversation={handleLoadConversation}
        onDeleteConversation={handleDeleteConversation}
        isLoadingUser={isLoadingUser}
        isLoadingConversations={isLoadingConversations}
      />

      {/* Main Content */}
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
