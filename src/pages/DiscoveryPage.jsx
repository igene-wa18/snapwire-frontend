import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI, friendsAPI } from '../services/api';
import { getSocket } from '../services/socket';
import {
  UserPlus, Check, RefreshCw, MessageCircle, Search, ArrowLeft,
  Users, Sparkles, Bell,
} from 'lucide-react';

/* ─── Design Tokens ─── */
const C = {
  primary:       '#c33797',
  primaryDark:   '#a12d7f',
  primaryLight:  '#f8e0f0',
  surface:       '#ffffff',
  surfaceDim:    '#f7f7fb',
  bg:            '#f0f2f5',
  onSurface:     '#1a1a2e',
  onSurfaceVar:  '#6b7280',
  outline:       '#e5e7eb',
  success:       '#22c55e',
};

export default function DiscoveryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [requestedSet, setRequestedSet] = useState(new Set());
  const [addingId, setAddingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQ, setSearchQ]   = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchDiscover();
    fetchPendingRequests();
    fetchOutgoingRequests();

    const socket = getSocket();
    if (socket) {
      const handleRequestReceived = () => {
        setPendingCount(prev => prev + 1);
      };
      socket.on('friend_request_received', handleRequestReceived);
      return () => {
        socket.off('friend_request_received', handleRequestReceived);
      };
    }
  }, []);

  async function fetchPendingRequests() {
    try {
      const res = await friendsAPI.getIncoming();
      setPendingCount(res.data.data.requests.length);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    }
  }

  async function fetchOutgoingRequests() {
    try {
      const res = await friendsAPI.getOutgoing();
      const outgoingIds = res.data.data.requests.map(req => req.to._id || req.to);
      setRequestedSet(new Set(outgoingIds));
    } catch (err) {
      console.error('Failed to fetch outgoing requests:', err);
    }
  }

  async function fetchDiscover() {
    setLoading(true);
    try {
      const res = await userAPI.discover(12);
      setUsers(res.data.data.users);
    } catch (err) {
      console.error('Discovery fetch failed:', err);
    }
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    setSearchQ('');
    setSearchResults(null);
    try {
      const res = await userAPI.discover(12);
      setUsers(res.data.data.users);
    } catch (err) {
      console.error('Refresh failed:', err);
    }
    setRefreshing(false);
  }

  async function handleAddFriend(userId) {
    setAddingId(userId);
    try {
      await friendsAPI.sendRequest(userId);
      setRequestedSet(prev => new Set([...prev, userId]));
    } catch (err) {
      console.error('Send friend request failed:', err);
      const msg = err?.response?.data?.message || 'Failed to send request. You might already be friends.';
      setToastMsg(msg);
      setTimeout(() => setToastMsg(''), 3000);
    }
    setAddingId(null);
  }

  async function handleSearch(q) {
    setSearchQ(q);
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await userAPI.search(q, 20);
      setSearchResults(res.data.data.users.filter(u => u._id !== user?.id));
    } catch (err) {
      console.error('Search failed:', err);
    }
    setSearching(false);
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  const displayUsers = searchResults !== null ? searchResults : users;

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── Header ── */}
      <div style={{
        background: C.surface,
        borderBottom: `1px solid ${C.outline}`,
        position: 'sticky', top: 0, zIndex: 10,
        padding: '16px 20px 12px',
      }}>
        {toastMsg && (
          <div style={{
            position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)',
            background: C.onSurface, color: '#fff', padding: '8px 18px', borderRadius: '20px',
            fontSize: '0.82rem', fontWeight: 500, zIndex: 50, whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)', animation: 'slideDown 0.2s ease',
          }}>
            {toastMsg}
          </div>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.onSurface, display: 'flex', padding: '4px',
              }}
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 style={{
                fontSize: '1.375rem', fontWeight: 700, color: C.onSurface,
                margin: 0, letterSpacing: '-0.02em',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Sparkles size={20} color={C.primary} />
                Discover People
              </h1>
              <p style={{ fontSize: '0.8rem', color: C.onSurfaceVar, margin: '2px 0 0' }}>
                Find new friends to chat with
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => navigate('/requests')}
              style={{
                position: 'relative',
                padding: '8px 14px', borderRadius: '10px',
                background: C.surfaceDim, border: `1px solid ${C.outline}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.8rem', fontWeight: 500, color: C.onSurface,
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.outline}
            >
              <Bell size={14} color={C.onSurfaceVar} />
              Requests
              {pendingCount > 0 && (
                <div style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: C.primary, color: '#fff', fontSize: '0.65rem',
                  fontWeight: 700, borderRadius: '10px', padding: '2px 6px',
                  boxShadow: `0 2px 8px ${C.primary}50`
                }}>
                  {pendingCount}
                </div>
              )}
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: '8px 14px', borderRadius: '10px',
                background: C.surfaceDim, border: `1px solid ${C.outline}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.8rem', fontWeight: 500, color: C.onSurface,
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              <RefreshCw
                size={14}
                style={{
                  transition: 'transform 0.5s',
                  transform: refreshing ? 'rotate(360deg)' : 'none',
                }}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', color: C.onSurfaceVar,
            pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchQ}
            onChange={e => handleSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 38px',
              border: `1.5px solid ${C.outline}`,
              borderRadius: '12px', fontSize: '0.875rem',
              color: C.onSurface, background: C.surfaceDim,
              outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = C.outline}
          />
        </div>
      </div>

      {/* ── User Grid ── */}
      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                height: '220px', borderRadius: '16px',
                animation: `shimmer 1.5s infinite`,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
              }} />
            ))}
          </div>
        ) : displayUsers.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: C.onSurfaceVar,
          }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 4px' }}>
              {searchQ ? 'No users found' : 'No new users to discover'}
            </p>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>
              {searchQ ? 'Try a different search term' : 'Check back later for new members!'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}>
            {displayUsers.map((u, idx) => {
              const isRequested = requestedSet.has(u._id);
              const isAdding = addingId === u._id;

              return (
                <div
                  key={u._id}
                  onClick={() => navigate(`/user/${u._id}`)}
                  style={{
                    background: C.surface,
                    borderRadius: '16px',
                    border: `1px solid ${C.outline}`,
                    padding: '24px 20px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '10px',
                    animation: `cardIn 0.3s ${idx * 0.05}s cubic-bezier(0.16,1,0.3,1) both`,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = `${C.primary}44`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = C.outline;
                  }}
                >
                  {/* Online indicator */}
                  {u.isOnline && (
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: C.success,
                      boxShadow: `0 0 0 2px ${C.surface}`,
                    }} />
                  )}

                  {/* Gradient top border */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${C.primary}, #7c3aed)`,
                    opacity: 0.6,
                  }} />

                  {/* Avatar */}
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: u.avatar ? 'none' : `linear-gradient(135deg, ${C.primary}33, #7c3aed33)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    border: `2px solid ${C.outline}`,
                  }}>
                    {u.avatar ? (
                      <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{
                        fontSize: '1.25rem', fontWeight: 700,
                        color: C.primary,
                      }}>
                        {getInitials(u.displayName)}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div style={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
                    <p style={{
                      fontSize: '0.95rem', fontWeight: 700, color: C.onSurface,
                      margin: '0 0 1px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {u.displayName}
                    </p>
                    <p style={{
                      fontSize: '0.8rem', color: C.primary, margin: '0 0 6px',
                      opacity: 0.7, fontWeight: 500,
                    }}>
                      @{u.username}
                    </p>
                    {(u.about || u.vibe) && (
                      <p style={{
                        fontSize: '0.78rem', color: C.onSurfaceVar,
                        margin: 0, lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {u.vibe || u.about}
                      </p>
                    )}
                  </div>

                  {/* Add Friend button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isRequested) handleAddFriend(u._id);
                    }}
                    disabled={isRequested || isAdding}
                    style={{
                      width: '100%', padding: '9px 16px',
                      borderRadius: '10px',
                      border: isRequested ? `1.5px solid ${C.outline}` : 'none',
                      background: isRequested
                        ? C.surfaceDim
                        : `linear-gradient(135deg, ${C.primary}, #7c3aed)`,
                      color: isRequested ? C.onSurfaceVar : '#fff',
                      fontSize: '0.825rem', fontWeight: 600,
                      cursor: isRequested ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'all 0.2s ease',
                      marginTop: '4px',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => {
                      if (!isRequested) {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = `0 3px 12px ${C.primary}33`;
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {isAdding ? (
                      <div style={{
                        width: '14px', height: '14px',
                        border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                      }} />
                    ) : isRequested ? (
                      <>
                        <Check size={14} /> Requested
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} /> Add Friend
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{
        position: 'sticky', bottom: 0,
        padding: '16px 20px',
        background: `linear-gradient(transparent, ${C.bg} 30%)`,
        display: 'flex', justifyContent: 'center',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '14px 32px',
            background: C.surface,
            border: `2px solid ${C.primary}`,
            borderRadius: '14px',
            color: C.primary,
            fontSize: '0.95rem', fontWeight: 600,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = C.primary;
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = C.surface;
            e.currentTarget.style.color = C.primary;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <MessageCircle size={18} />
          Start Chatting
        </button>
      </div>

      {/* Keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
