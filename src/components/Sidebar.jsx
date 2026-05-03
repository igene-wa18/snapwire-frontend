import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSocket } from '../services/socket';
import NewChatModal from './NewChatModal';
import StatusBar from './StatusBar';
import {
  Search,
  MoreVertical,
  Users,
  X,
  Settings,
  CheckCheck,
  PenSquare,
  Radio,
  MessagesSquare,
  MessageCircle,
} from 'lucide-react';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  primary:                '#006b53',
  primaryContainer:       '#00a884',
  onSurface:              '#191c1e',
  onSurfaceVariant:       '#3d4a44',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f2f4f7',
  surfaceContainerHigh:   '#e6e8eb',
  secondaryContainer:     '#c6e9c0',
  outlineVariant:         '#bccac2',
  surface:                '#f7f9fc',
};

// ─── NAV TABS CONFIG ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'chats',       label: 'Chats',       Icon: MessageCircle },
  { key: 'status',      label: 'Status',       Icon: Radio },
];

export default function Sidebar({ chats, activeChat, onSelectChat, onChatCreated, loading }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch]       = useState('');
  const [showMenu, setShowMenu]   = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatMode, setNewChatMode] = useState('search');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [activeTab, setActiveTab] = useState('chats');

  // ─── SOCKET: track online users ──────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const on  = d => setOnlineUsers(prev => new Set([...prev, d.userId]));
    const off = d => setOnlineUsers(prev => { const s = new Set(prev); s.delete(d.userId); return s; });
    socket.on('user:online',  on);
    socket.on('user:offline', off);
    return () => { socket.off('user:online', on); socket.off('user:offline', off); };
  }, []);

  // ─── HELPERS ─────────────────────────────────────────────────────
  const filteredChats = chats.filter(chat => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (chat.name) return chat.name.toLowerCase().includes(q);
    const other = chat.participants?.find(p => p._id !== user?.id);
    return other?.displayName?.toLowerCase().includes(q);
  });

  function getChatName(chat) {
    if (chat.isGroup) return chat.name || 'Group Chat';
    const other = chat.participants?.find(p => p._id !== user?.id);
    return other?.displayName || 'Unknown User';
  }

  function getChatAvatar(chat) {
    if (chat.isGroup) return chat.groupIcon;
    return chat.participants?.find(p => p._id !== user?.id)?.avatar;
  }

  function isOtherOnline(chat) {
    if (chat.isGroup) return false;
    const other = chat.participants?.find(p => p._id !== user?.id);
    return other?.isOnline || onlineUsers.has(other?._id);
  }

  function getUnread(chat) {
    if (!chat.unreadCounts || !user?.id) return 0;
    return typeof chat.unreadCounts === 'object' ? (chat.unreadCounts[user.id] || 0) : 0;
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diffDays = Math.floor((Date.now() - date) / 86400000);
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function getPreview(chat) {
    if (!chat.lastMessage) return 'No messages yet';
    const { content, type } = chat.lastMessage;
    if (type === 'system') return content;
    if (type === 'image')  return '📷 Photo';
    if (type === 'video')  return '🎥 Video';
    if (type === 'audio')  return '🎵 Audio';
    if (type === 'file')   return '📎 File';
    return content || 'Message';
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  // ─── ICON BUTTON ─────────────────────────────────────────────────
  function IconBtn({ onClick, children, title }) {
    return (
      <button
        onClick={onClick}
        title={title}
        style={{
          padding: '8px',
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          color: C.onSurfaceVariant,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.surfaceContainerHigh; e.currentTarget.style.color = C.primary; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.onSurfaceVariant; }}
      >
        {children}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.surfaceContainerLow, fontFamily: "'Inter', sans-serif" }}>

      {/* ─── HEADER ─── */}
      <div style={{
        height: '64px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: C.surfaceContainerLow,
        flexShrink: 0,
      }}>
        {/* User avatar + label */}
        <div
          onClick={() => navigate('/profile')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          title="View profile"
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `${C.primaryContainer}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            color: C.primary,
            overflow: 'hidden',
            flexShrink: 0,
            transition: 'box-shadow 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${C.primary}44`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : getInitials(user?.displayName)
            }
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: C.onSurface, margin: 0, lineHeight: 1.2 }}>Conversations</p>
            <p style={{ fontSize: '11px', color: C.onSurfaceVariant, margin: 0, lineHeight: 1.3 }}>{user?.displayName || ''}</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <IconBtn onClick={() => { setNewChatMode('group'); setShowNewChat(true); }} title="New group">
            <Users size={20} />
          </IconBtn>
          <IconBtn onClick={() => { setNewChatMode('search'); setShowNewChat(true); }} title="New chat">
            <PenSquare size={20} />
          </IconBtn>

          {/* Menu */}
          <div style={{ position: 'relative' }}>
            <IconBtn onClick={() => setShowMenu(v => !v)} title="Menu">
              <MoreVertical size={20} />
            </IconBtn>
            {showMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '44px',
                background: C.surfaceContainerLowest,
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(25,28,30,0.15)',
                padding: '6px 0',
                minWidth: '160px',
                zIndex: 50,
                animation: 'fadeIn 0.12s ease',
              }}>
                <button
                  onClick={() => { logout(); setShowMenu(false); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 20px',
                    background: 'none',
                    border: 'none',
                    fontSize: '14px',
                    color: C.onSurface,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surfaceContainerLow}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── SEARCH BAR ─── */}
      <div style={{ padding: '6px 12px 8px', background: C.surfaceContainerLow, flexShrink: 0 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{
            position: 'absolute',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
            color: C.onSurfaceVariant,
          }}>
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '38px',
              paddingRight: search ? '36px' : '12px',
              paddingTop: '8px',
              paddingBottom: '8px',
              background: C.surfaceContainerLowest,
              border: `1px solid ${C.outlineVariant}22`,
              borderRadius: '12px',
              fontSize: '13.5px',
              color: C.onSurface,
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'box-shadow 0.15s',
            }}
            onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${C.primary}22`}
            onBlur={e => e.target.style.boxShadow = 'none'}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C.onSurfaceVariant,
                display: 'flex',
                padding: '2px',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ─── NAV TABS ─── */}
      <div style={{
        display: 'flex',
        padding: '2px 8px 6px',
        gap: '4px',
        background: C.surfaceContainerLow,
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: '1 0 auto',
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: active ? C.surfaceContainerLowest : 'transparent',
                color: active ? C.primary : C.onSurfaceVariant,
                fontSize: '12px',
                fontWeight: active ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'background 0.15s, color 0.15s',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                boxShadow: active ? '0 1px 4px rgba(25,28,30,0.08)' : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${C.surfaceContainerHigh}88`; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ─── CONTENT AREA (Chat List or Status) ─── */}
      {activeTab === 'status' ? (
        <div style={{ flex: 1, overflowY: 'auto', background: C.surfaceContainerLow }}>
          <StatusBar />
        </div>
      ) : (
      <div style={{ flex: 1, overflowY: 'auto', background: C.surfaceContainerLow }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '80px' }}>
            <div style={{
              width: '28px', height: '28px',
              border: `3px solid ${C.outlineVariant}`,
              borderTopColor: C.primary,
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>
          </div>
        ) : filteredChats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px 0' }}>
            <p style={{ fontSize: '13px', color: C.onSurfaceVariant }}>
              {search ? 'No chats found' : 'No conversations yet. Start a new chat!'}
            </p>
          </div>
        ) : (
          filteredChats.map(chat => {
            const isActive = activeChat === chat._id;
            const unread   = getUnread(chat);
            const online   = isOtherOnline(chat);
            const name     = getChatName(chat);
            const avatar   = getChatAvatar(chat);
            const preview  = getPreview(chat);
            const time     = formatTime(chat.lastMessage?.sentAt || chat.updatedAt);

            return (
              <button
                key={chat._id}
                onClick={() => onSelectChat(chat._id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: isActive ? C.surfaceContainerHigh : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.surfaceContainerHigh; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: chat.isGroup ? `${C.outlineVariant}55` : `${C.primaryContainer}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: chat.isGroup ? C.onSurfaceVariant : C.primary,
                    overflow: 'hidden',
                  }}>
                    {avatar
                      ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : chat.isGroup
                        ? <Users size={20} />
                        : getInitials(name)
                    }
                  </div>
                  {online && (
                    <span style={{
                      position: 'absolute',
                      bottom: '1px',
                      right: '1px',
                      width: '11px',
                      height: '11px',
                      background: '#22c55e',
                      borderRadius: '50%',
                      border: `2px solid ${C.surfaceContainerLow}`,
                    }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Row 1: name + time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: unread > 0 ? 700 : 600,
                      color: C.onSurface,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {name}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: unread > 0 ? C.primary : C.onSurfaceVariant,
                      fontWeight: unread > 0 ? 600 : 400,
                      marginLeft: '8px',
                      flexShrink: 0,
                    }}>
                      {time}
                    </span>
                  </div>

                  {/* Row 2: preview + unread badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {/* Read receipt tick for sent messages */}
                    {chat.lastMessage && !chat.isGroup && (
                      <CheckCheck size={14} color={unread === 0 ? C.primaryContainer : C.onSurfaceVariant} style={{ flexShrink: 0, opacity: 0.7 }} />
                    )}
                    <p style={{
                      fontSize: '13px',
                      color: unread > 0 ? C.onSurface : C.onSurfaceVariant,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      fontWeight: unread > 0 ? 500 : 400,
                    }}>
                      {preview}
                    </p>
                    {unread > 0 && (
                      <span style={{
                        background: C.primary,
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '999px',
                        minWidth: '19px',
                        height: '19px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                        flexShrink: 0,
                      }}>
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
      )}

      {/* ─── FOOTER ─── */}
      <div style={{
        padding: '10px 12px',
        background: C.surfaceContainerLow,
        flexShrink: 0,
        borderTop: `1px solid ${C.outlineVariant}33`,
      }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: C.onSurfaceVariant,
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'inherit',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.surfaceContainerHigh; e.currentTarget.style.color = C.onSurface; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.onSurfaceVariant; }}
        >
          <Settings size={18} />
          Settings
        </button>
        <button
          onClick={() => navigate('/discover')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: C.onSurfaceVariant,
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'inherit',
            transition: 'background 0.15s, color 0.15s',
            marginTop: '2px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.surfaceContainerHigh; e.currentTarget.style.color = C.onSurface; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.onSurfaceVariant; }}
        >
          <Users size={18} />
          Discover People
        </button>
      </div>

      {/* ─── NEW CHAT MODAL ─── */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onChatCreated={chat => { onChatCreated(chat); setShowNewChat(false); }}
          initialMode={newChatMode}
          currentUser={user}
        />
      )}

      {/* Close menu on outside click */}
      {showMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
}