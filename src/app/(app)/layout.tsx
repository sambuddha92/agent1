'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }
    loadUser();
  }, []);

  // Load conversations
  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch(API_ENDPOINTS.CONVERSATIONS);
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (error) {
        console.error('[layout] Failed to load conversations:', error);
      }
    }
    loadConversations();

    // Listen for conversation updates from chat page
    const handleConversationCreated = () => {
      loadConversations();
    };

    window.addEventListener('conversationCreated', handleConversationCreated);
    
    return () => {
      window.removeEventListener('conversationCreated', handleConversationCreated);
    };
  }, []);

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
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onLoadConversation={handleLoadConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main Content */}
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
