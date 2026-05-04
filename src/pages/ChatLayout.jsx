import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { chatAPI } from '../services/api';
import { getSocket, joinChat, leaveChat } from '../services/socket';

export default function ChatLayout() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatData, setActiveChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSidebarMobile, setShowSidebarMobile] = useState(true);

  // ─── FETCH CHATS ──────────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    try {
      const res = await chatAPI.getAll();
      setChats(res.data.data.chats);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // ─── SOCKET LISTENERS ─────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleNewMessage(data) {
      setChats(prev => {
        const targetChatId = data.chatId || data.chat;
        const chatExists = prev.some(c => c._id === targetChatId);

        if (!chatExists) {
          // We don't have this chat in our list yet. Fetch it!
          setTimeout(() => fetchChats(), 0);
          return prev;
        }

        const updated = prev.map(chat => {
          if (chat._id === targetChatId) {
            return {
              ...chat,
              lastMessage: {
                messageId: data._id,
                content: data.content,
                sender: data.sender,
                type: data.type,
                sentAt: data.createdAt,
              },
              updatedAt: data.createdAt,
            };
          }
          return chat;
        });
        // Sort by most recent message
        return updated.sort((a, b) => {
          const aTime = a.lastMessage?.sentAt || a.updatedAt;
          const bTime = b.lastMessage?.sentAt || b.updatedAt;
          return new Date(bTime) - new Date(aTime);
        });
      });
    }

    function handleNewChat(data) {
      setChats(prev => {
        if (prev.find(c => c._id === data.chat._id)) return prev;
        return [data.chat, ...prev];
      });
    }

    socket.on('message:new', handleNewMessage);
    socket.on('chat:new', handleNewChat);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('chat:new', handleNewChat);
    };
  }, []);

  // ─── CHAT SELECTION ───────────────────────────────────────────────
  async function handleSelectChat(chatId) {
    // Leave previous chat room
    if (activeChat) leaveChat(activeChat);

    setActiveChat(chatId);
    setShowSidebarMobile(false);

    // Join new chat room
    joinChat(chatId);

    // Mark as read
    try {
      await chatAPI.markRead(chatId);
      setChats(prev =>
        prev.map(c => {
          if (c._id === chatId) {
            const newUnread = { ...c.unreadCounts };
            return { ...c, unreadCounts: newUnread };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Failed to mark chat as read:', err);
    }

    // Fetch full chat data
    try {
      const res = await chatAPI.getById(chatId);
      setActiveChatData(res.data.data.chat);
    } catch (err) {
      console.error('Failed to fetch chat:', err);
    }
  }

  function handleBackToSidebar() {
    setShowSidebarMobile(true);
    setActiveChat(null);
    setActiveChatData(null);
  }

  async function handleChatCreated(chat) {
    // Add to chat list
    setChats(prev => {
      if (prev.find(c => c._id === chat._id)) return prev;
      return [chat, ...prev];
    });

    // Join the socket room for the new chat
    joinChat(chat._id);

    // Fetch full chat data with populated participants
    try {
      const res = await chatAPI.getById(chat._id);
      const fullChat = res.data.data.chat;

      // Update the chat in the list with full data
      setChats(prev =>
        prev.map(c => c._id === fullChat._id ? fullChat : c)
      );

      setActiveChat(fullChat._id);
      setActiveChatData(fullChat);
      setShowSidebarMobile(false);
    } catch (err) {
      console.error('Failed to fetch new chat data:', err);
      // Fallback: select with what we have
      handleSelectChat(chat._id);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#fff' }}>

      {/* ─── SIDEBAR ─── */}
      <div
        style={{
          display: showSidebarMobile ? 'flex' : 'none',
          flexDirection: 'column',
          width: '365px',
          minWidth: '320px',
          maxWidth: '420px',
          borderRight: '1px solid #d1d7db',
          flexShrink: 0,
          background: '#fff',
          height: '100vh',
        }}
        className="sidebar-container"
      >
        <style>{`
          @media (max-width: 768px) {
            .sidebar-container { width: 100% !important; max-width: 100% !important; }
            .chat-container-hide { display: none !important; }
          }
          @media (min-width: 769px) {
            .sidebar-container { display: flex !important; }
            .chat-container-hide { display: flex !important; }
          }
        `}</style>
        <Sidebar
          chats={chats}
          activeChat={activeChat}
          onSelectChat={handleSelectChat}
          onChatCreated={handleChatCreated}
          loading={loading}
        />
      </div>

      {/* ─── CHAT WINDOW ─── */}
      <div
        style={{
          display: !showSidebarMobile ? 'flex' : 'none',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          background: '#fff',
          position: 'relative',
          height: '100vh',
        }}
        className="chat-container-hide"
      >
        {activeChat && activeChatData ? (
          <ChatWindow
            chat={activeChatData}
            onBack={handleBackToSidebar}
            onRefreshChats={fetchChats}
          />
        ) : (
          /* ─── EMPTY STATE ─── */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0f2f5 0%, #e8eaed 100%)',
            borderBottom: '6px solid var(--color-primary, #006b53)',
            fontFamily: "'Inter', sans-serif",
          }}>
            <div style={{ textAlign: 'center', maxWidth: '460px', animation: 'fadeIn 0.3s ease' }}>
              <div style={{
                width: '320px',
                height: '200px',
                marginBottom: '32px',
                backgroundImage: `url('/logo.png')`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                margin: '0 auto 32px',
              }} />
              <h2 style={{
                fontSize: '1.875rem', fontWeight: 400, marginBottom: '8px',
                background: 'linear-gradient(90deg, #2563eb 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
                display: 'inline-block'
              }}>synapsis for Desktop</h2>
              <p style={{ fontSize: '1.1rem', color: '#54656f', fontWeight: 500, marginBottom: '24px' }}>let you connect.</p>
              <p style={{ color: '#8696a0', fontSize: '0.875rem', lineHeight: 1.7 }}>
                Select a conversation from the sidebar or search for users to start a new chat.<br/>
                Messages are end-to-end encrypted.*
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
