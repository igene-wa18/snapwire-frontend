import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { messageAPI, chatAPI, userAPI, optimizeCloudinaryUrl } from '../services/api';
import { getSocket, startTyping, stopTyping } from '../services/socket';
import MessageBubble from './MessageBubble';
import GroupProfileModal from './GroupProfileModal';
import {
  ArrowLeft,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Search,
  Users,
  Mic,
  AlertTriangle,
} from 'lucide-react';
 
// ─── DESIGN TOKENS (matching reference HTML) ──────────────────────────────────
const C = {
  primary:                '#006b53',
  primaryContainer:       '#00a884',
  onPrimary:              '#ffffff',
  surface:                '#f7f9fc',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f2f4f7',
  surfaceContainerHigh:   '#e6e8eb',
  secondaryContainer:     '#c6e9c0',
  onSurface:              '#191c1e',
  onSurfaceVariant:       '#3d4a44',
  outlineVariant:         '#bccac2',
  ambientShadow:          '0 12px 32px rgba(25,28,30,0.06)',
};
 
// ─── INLINE STYLES ────────────────────────────────────────────────────────────
const styles = {
  // Chat wallpaper: dotted radial-gradient pattern
  chatBg: {
    backgroundColor: C.surface,
    backgroundImage: `radial-gradient(${C.outlineVariant} 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
  },
  // Date separator pill
  datePill: {
    background: C.surfaceContainerLow,
    padding: '5px 16px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 500,
    color: C.onSurfaceVariant,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    boxShadow: '0 1px 3px rgba(25,28,30,0.08)',
  },
};
 
 
 
// ─── TYPING DOTS ─────────────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
      <div style={{ maxWidth: '65%' }}>
        <div style={{ ...styles.bubbleReceived, padding: '12px 18px' }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '14px' }}>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: C.onSurfaceVariant,
                  opacity: 0.4,
                  display: 'inline-block',
                  animation: `typingBounce 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
 
// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ChatWindow({ chat, onBack, onRefreshChats }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showGroupProfile, setShowGroupProfile] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const menuRef = useRef(null);
 
  const chatId = chat._id;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);
 
  // ─── HELPERS ──────────────────────────────────────────────────────
  function getChatName() {
    if (chat.isGroup) return chat.name || 'Group Chat';
    const other = chat.participants?.find(p => p._id !== user?.id);
    return other?.displayName || 'Unknown';
  }

  function getChatAvatar() {
    if (chat.isGroup) return chat.groupIcon;
    const other = chat.participants?.find(p => p._id !== user?.id);
    return other?.avatar;
  }
 
  function getChatStatus() {
    if (chat.isGroup) return `${chat.participants?.length || 0} members`;
    const other = chat.participants?.find(p => p._id !== user?.id);
    if (other?.isOnline) return 'online';
    if (other?.lastSeen) {
      const d = new Date(other.lastSeen);
      return `last seen ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return 'offline';
  }
 
  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
 
  // ─── FETCH MESSAGES ───────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await messageAPI.getMessages(chatId);
      setMessages(res.data.data.messages);
      setHasMore(res.data.data.hasMore);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
    setLoading(false);
  }, [chatId]);
 
  useEffect(() => {
    fetchMessages();
    setNewMessage('');
    setTypingUsers([]);
  }, [fetchMessages]);
 
  // Auto-scroll to bottom
  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);
 
  // ─── SOCKET LISTENERS ─────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
 
    function handleNewMessage(data) {
      if (data.chatId === chatId || data.chat === chatId) {
        setMessages(prev => {
          if (prev.find(m => m._id === data._id)) return prev;
          return [...prev, data];
        });
        if (data.sender?._id !== user?.id && data.sender !== user?.id) {
          chatAPI.markRead(chatId).catch(() => {});
        }
      }
    }
 
    function handleTyping(data) {
      if (data.chatId === chatId && data.userId !== user?.id) {
        if (data.isTyping) {
          setTypingUsers(prev => prev.includes(data.userId) ? prev : [...prev, data.userId]);
        } else {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      }
    }
 
    function handleStatusUpdate(data) {
      if (data.chatId === chatId) {
        setMessages(prev =>
          prev.map(msg => {
            if (data.messageIds?.includes(msg._id) || data.messageId === msg._id) {
              return { ...msg, status: data.status };
            }
            return msg;
          })
        );
      }
    }
 
    socket.on('message:new', handleNewMessage);
    socket.on('typing:indicator', handleTyping);
    socket.on('message:status_update', handleStatusUpdate);
 
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:indicator', handleTyping);
      socket.off('message:status_update', handleStatusUpdate);
    };
  }, [chatId, user?.id]);
 
  // ─── SEND MESSAGE ─────────────────────────────────────────────────
  async function handleSend(e) {
    e?.preventDefault();
    const content = newMessage.trim();
    if (!content || sending) return;
 
    setSending(true);
    setNewMessage('');
    handleStopTyping();
 
    try {
      const res = await messageAPI.send(chatId, {
        content,
        type: 'text',
        tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });
      const message = res.data.data.message;
      setMessages(prev => {
        if (prev.find(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      if (err.response?.status === 403) {
        alert(err.response?.data?.message || 'You cannot send a message to this user.');
      }
    }
    setSending(false);
  }
 
  // ─── TYPING INDICATOR ─────────────────────────────────────────────
  function handleTypingInput(e) {
    setNewMessage(e.target.value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      startTyping(chatId);
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => handleStopTyping(), 2000);
  }
 
  function handleStopTyping() {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      stopTyping(chatId);
    }
    clearTimeout(typingTimeoutRef.current);
  }
 
  // Handle Enter key
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
 
  // ─── LOAD MORE ────────────────────────────────────────────────────
  async function handleLoadMore() {
    if (!hasMore || messages.length === 0) return;
    try {
      const oldest = messages[0];
      const res = await messageAPI.getMessages(chatId, oldest._id, 30);
      const olderMessages = res.data.data.messages;
      setHasMore(res.data.data.hasMore);
      setMessages(prev => [...olderMessages, ...prev]);
    } catch (err) {
      console.error('Failed to load more:', err);
    }
  }
 
  // ─── GROUP MESSAGES BY DATE ────────────────────────────────────────
  function groupByDate(msgs) {
    const groups = [];
    let currentDate = '';
    msgs.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString([], {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ type: 'date', date });
      }
      groups.push({ type: 'message', data: msg });
    });
    return groups;
  }
 
  const grouped = groupByDate(messages);
  const isOnline = chat.isGroup
    ? false
    : chat.participants?.find(p => p._id !== user?.id)?.isOnline;

  const isBlockedByMe = !chat.isGroup && user?.blockedUsers?.some((b) => {
    const blockedId = typeof b === 'object' ? b._id : b;
    const otherId = chat.participants?.find(p => p._id !== user?.id)?._id;
    return blockedId === otherId;
  });

  return (
    <>
      {/* Keyframe for typing bounce */}
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
        .chat-scroll::-webkit-scrollbar { width: 5px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: ${C.outlineVariant}; border-radius: 999px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: ${C.onSurfaceVariant}; }
        .send-btn-pulse { transition: transform 0.12s ease, opacity 0.12s ease; }
        .send-btn-pulse:active { transform: scale(0.9); }
        .load-more-btn { transition: box-shadow 0.2s ease, transform 0.1s ease; }
        .load-more-btn:hover { box-shadow: 0 4px 14px rgba(0,107,83,0.18); transform: translateY(-1px); }
      `}</style>
 
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', fontFamily: "'Inter', sans-serif" }}>
 
        {/* ─── HEADER ─── */}
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 1px 0 rgba(25,28,30,0.08)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 20,
        }}>
          {/* Left: back + avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {/* Back button (mobile) */}
            <button
              onClick={onBack}
              className="md:hidden"
              style={{
                padding: '8px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: C.onSurfaceVariant,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.surfaceContainerHigh}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <ArrowLeft size={22} />
            </button>
 
            {/* Avatar */}
            <div 
              onClick={() => {
                if (chat.isGroup) {
                  setShowGroupProfile(true);
                } else {
                  const other = chat.participants?.find(p => p._id !== user?.id);
                  if (other?._id) navigate(`/user/${other._id}`);
                }
              }}
              style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: `${C.primaryContainer}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: C.primary,
              position: 'relative',
            }}>
              {getChatAvatar() ? (
                <img src={optimizeCloudinaryUrl(getChatAvatar())} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : chat.isGroup ? (
                <Users size={18} color={C.primary} />
              ) : (
                getInitials(getChatName())
              )}
              {/* Online dot */}
              {isOnline && (
                <span style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '1px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid white',
                }} />
              )}
            </div>
 
            {/* Name & status */}
            <div 
              onClick={() => {
                if (chat.isGroup) {
                  setShowGroupProfile(true);
                } else {
                  const other = chat.participants?.find(p => p._id !== user?.id);
                  if (other?._id) navigate(`/user/${other._id}`);
                }
              }}
              style={{ minWidth: 0, cursor: 'pointer' }}
            >
              <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                color: C.onSurface,
                margin: 0,
                lineHeight: '1.2',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {getChatName()}
              </h3>
              <p style={{
                fontSize: '12px',
                color: typingUsers.length > 0 ? C.primary : (isOnline ? C.primaryContainer : C.onSurfaceVariant),
                margin: 0,
                lineHeight: '1.3',
                fontWeight: typingUsers.length > 0 ? 500 : 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {typingUsers.length > 0 ? 'typing...' : getChatStatus()}
              </p>
            </div>
          </div>
 
          {/* Right: action icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setShowMenu(prev => !prev)}
              style={{
                padding: '8px',
                borderRadius: '50%',
                background: showMenu ? C.surfaceContainerHigh : 'transparent',
                border: 'none',
                color: showMenu ? C.primary : C.onSurfaceVariant,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.surfaceContainerHigh; e.currentTarget.style.color = C.primary; }}
              onMouseLeave={e => { if (!showMenu) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.onSurfaceVariant; } }}
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div style={{
                position: 'absolute',
                top: '48px',
                right: '0',
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '160px',
                overflow: 'hidden',
                zIndex: 50,
              }}>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (chat.isGroup) {
                      setShowGroupProfile(true);
                    } else {
                      const other = chat.participants?.find(p => p._id !== user?.id);
                      if (other?._id) navigate(`/user/${other._id}`);
                    }
                  }}
                  style={{
                    width: '100%', padding: '12px 16px', textAlign: 'left',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: '14px', color: C.onSurface, transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surfaceContainerHigh}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Profile View
                </button>

                {!chat.isGroup && (
                  <button
                    onClick={async () => {
                      setShowMenu(false);
                      const other = chat.participants?.find(p => p._id !== user?.id);
                      if (other?._id) {
                         if (confirm('Are you sure you want to block this user?')) {
                            try {
                               await userAPI.blockUser(other._id);
                               alert('User blocked');
                               onBack();
                            } catch (e) {
                               console.error(e);
                               alert('Failed to block user');
                            }
                         }
                      }
                    }}
                    style={{
                      width: '100%', padding: '12px 16px', textAlign: 'left',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      fontSize: '14px', color: '#ef4444', transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Block User
                  </button>
                )}

                {chat.isGroup && (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowExitModal(true);
                      }}
                      style={{
                        width: '100%', padding: '12px 16px', textAlign: 'left',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        fontSize: '14px', color: '#ef4444', transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      Exit Group
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        if (confirm('Are you sure you want to report this group?')) {
                          alert('Group reported successfully. Our team will review it shortly.');
                        }
                      }}
                      style={{
                        width: '100%', padding: '12px 16px', textAlign: 'left',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        fontSize: '14px', color: '#ef4444', transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      Report Group
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
 
        {/* ─── MESSAGES AREA ─── */}
        <div
          ref={messagesContainerRef}
          className="chat-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 5% 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            position: 'relative',
            zIndex: 10,
            ...styles.chatBg,
          }}
        >
          {/* Load more */}
          {hasMore && messages.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <button
                onClick={handleLoadMore}
                className="load-more-btn"
                style={{
                  background: C.surfaceContainerLowest,
                  border: 'none',
                  borderRadius: '999px',
                  padding: '6px 18px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: C.onSurfaceVariant,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(25,28,30,0.1)',
                }}
              >
                Older messages
              </button>
            </div>
          )}
 
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, paddingTop: '80px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: `3px solid ${C.outlineVariant}`,
                borderTopColor: C.primary,
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : messages.length === 0 ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1,
              paddingTop: '80px',
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '12px',
                padding: '24px 32px',
                textAlign: 'center',
                boxShadow: C.ambientShadow,
              }}>
                <p style={{ fontSize: '13.5px', color: C.onSurfaceVariant, margin: 0 }}>
                  No messages here yet. Say hi 👋
                </p>
              </div>
            </div>
          ) : (
            <>
              {grouped.map((item, i) => {
                if (item.type === 'date') {
                  return (
                    <div key={`date-${item.date}-${i}`} style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
                      <span style={styles.datePill}>{item.date}</span>
                    </div>
                  );
                }
                const msg = item.data;
                const isMine = msg.sender?._id === user?.id || msg.sender === user?.id;
                // Consecutive message spacing: check prev item
                const prevItem = grouped[i - 1];
                const prevMsg = prevItem?.type === 'message' ? prevItem.data : null;
                const prevIsMine = prevMsg
                  ? (prevMsg.sender?._id === user?.id || prevMsg.sender === user?.id)
                  : null;
                const sameAuthor = prevMsg && prevIsMine === isMine;
 
                return (
                  <div
                    key={msg._id}
                    style={{ marginTop: sameAuthor ? '2px' : '10px' }}
                  >
                    <MessageBubble
                      message={msg}
                      isMine={isMine}
                      isGroup={chat.isGroup}
                    />
                  </div>
                );
              })}
 
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <TypingBubble />
                </div>
              )}
            </>
          )}
 
          <div ref={messagesEndRef} style={{ height: '4px' }} />
        </div>
 
        {/* ─── INPUT AREA ─── */}
        <div style={{
          padding: '8px 20px 16px',
          background: 'transparent',
          flexShrink: 0,
          position: 'relative',
          zIndex: 20,
          /* Fade the wallpaper behind input */
          backgroundImage: `linear-gradient(to top, ${C.surface} 80%, transparent)`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: C.surfaceContainerLowest,
            borderRadius: '14px',
            padding: '10px 14px',
            border: `1px solid ${C.outlineVariant}22`,
            boxShadow: '0 2px 12px rgba(25,28,30,0.07)',
          }}>
            {/* Emoji */}
            <button
              type="button"
              style={{
                flexShrink: 0,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C.onSurfaceVariant,
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.primary}
              onMouseLeave={e => e.currentTarget.style.color = C.onSurfaceVariant}
            >
              <Smile size={24} strokeWidth={1.5} />
            </button>
 
            {/* Attach */}
            <button
              type="button"
              style={{
                flexShrink: 0,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C.onSurfaceVariant,
                padding: '4px',
                marginRight: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.primary}
              onMouseLeave={e => e.currentTarget.style.color = C.onSurfaceVariant}
            >
              <Paperclip size={22} strokeWidth={1.5} />
            </button>
 
            {/* Text input */}
            <input
              type="text"
              value={newMessage}
              onChange={handleTypingInput}
              onKeyDown={handleKeyDown}
              placeholder={isBlockedByMe ? "You blocked this user." : "Type a message..."}
              disabled={isBlockedByMe}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: isBlockedByMe ? C.outlineVariant : C.onSurface,
                padding: '2px 0',
                fontFamily: 'inherit',
                cursor: isBlockedByMe ? 'not-allowed' : 'text',
              }}
            />
 
            {/* Send / Mic */}
            {newMessage.trim() ? (
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="send-btn-pulse"
                style={{
                  flexShrink: 0,
                  background: C.primary,
                  border: 'none',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.6 : 1,
                  marginLeft: '4px',
                  boxShadow: `0 2px 8px ${C.primary}55`,
                  transition: 'background 0.15s, opacity 0.15s, transform 0.12s',
                }}
                onMouseEnter={e => { if (!sending) e.currentTarget.style.background = '#005642'; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.primary; }}
              >
                <Send size={17} color="#fff" style={{ position: 'relative', right: '-1px', transform: 'rotate(-45deg)' }} />
              </button>
            ) : (
              <button
                type="button"
                style={{
                  flexShrink: 0,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: C.onSurfaceVariant,
                  padding: '4px',
                  marginLeft: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = C.primary}
                onMouseLeave={e => e.currentTarget.style.color = C.onSurfaceVariant}
              >
                <Mic size={22} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
 
      </div>

      {showGroupProfile && (
        <GroupProfileModal
          chat={chat}
          onClose={() => setShowGroupProfile(false)}
          onRefreshChats={onRefreshChats}
        />
      )}

      {/* ── Exit Group Confirmation Modal ── */}
      {showExitModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'20px', fontFamily:"'Inter', sans-serif" }} onClick={() => setShowExitModal(false)}>
          <div style={{ background:C.surfaceContainerLowest, borderRadius:'20px', padding:'28px 24px', maxWidth:'360px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation:'modalPop 0.22s cubic-bezier(0.16,1,0.3,1)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:'56px',height:'56px',borderRadius:'50%',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
              <AlertTriangle size={26} color="#ef4444"/>
            </div>
            <h2 style={{textAlign:'center',fontSize:'1.1rem',fontWeight:700,color:C.onSurface,margin:'0 0 8px'}}>Exit "{chat.name}"?</h2>
            <p style={{textAlign:'center',fontSize:'0.875rem',color:C.onSurfaceVariant,margin:'0 0 24px',lineHeight:1.5}}>You won't be able to send or receive messages in this group anymore.</p>
            <div style={{display:'flex',gap:'10px'}}>
              <button 
                onClick={() => setShowExitModal(false)} 
                style={{flex:1,padding:'12px',borderRadius:'12px',border:`1.5px solid #d1d5db`,background:'none',cursor:'pointer',fontSize:'0.9rem',fontWeight:600,color:C.onSurface,fontFamily:'inherit'}}
              >
                Stay
              </button>
              <button 
                onClick={async () => {
                  try {
                    await chatAPI.delete(chat._id);
                    setShowExitModal(false);
                    if (onRefreshChats) onRefreshChats(); // Refresh sidebar automatically
                    onBack(); // Navigate out of the chat
                  } catch (e) {
                    console.error(e);
                    alert('Failed to exit group');
                  }
                }} 
                style={{flex:1,padding:'12px',borderRadius:'12px',border:'none',background:'#ef4444',cursor:'pointer',fontSize:'0.9rem',fontWeight:600,color:'#fff',fontFamily:'inherit',boxShadow:`0 4px 12px rgba(239, 68, 68, 0.4)`}}
              >Exit anyway
              </button>
            </div>
          </div>
          <style>{`
            @keyframes modalPop{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}
          `}</style>
        </div>
      )}
    </>
  );
}
 