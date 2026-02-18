'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { API_ENDPOINTS } from '@/lib/constants';
import AppSidebar from '@/components/AppSidebar';
import DeleteConfirmModal from '@/app/(app)/my-garden/components/DeleteConfirmModal';
import type { User } from '@supabase/supabase-js';
import type { Conversation } from '@/types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Initialize sidebar based on viewport: closed on mobile/tablet (< 1024px), open on desktop
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

  // Set sidebar default state based on viewport on mount
  useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    setIsMenuOpen(isDesktop);
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

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(conversationId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.CONVERSATIONS}/${deleteConfirmId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== deleteConfirmId));
        
        if (deleteConfirmId === currentConversationId) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('[layout] Error deleting conversation:', error);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="app-layout">
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
        {/* Sidebar edge handle - drawer pull indicator (only visible when sidebar is collapsed) */}
        {!isMenuOpen && (
          <button
            onClick={handleMenuToggle}
            className="sidebar-edge-handle"
            aria-label="Open sidebar"
            title="Tap to open menu"
          />
        )}
        {children}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <DeleteConfirmModal
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmId(null)}
          isDeleting={false}
        />
      )}
    </div>
  );
}
