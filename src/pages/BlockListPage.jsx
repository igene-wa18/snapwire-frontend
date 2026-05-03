import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { ArrowLeft, Ban, UserX, Loader2, Search, X, Shield } from 'lucide-react';

/* ─── Design Tokens ─── */
const C = {
  primary:       '#c33797',
  surface:       '#ffffff',
  surfaceDim:    '#f7f7fb',
  bg:            '#f0f2f5',
  onSurface:     '#1a1a2e',
  onSurfaceVar:  '#6b7280',
  outline:       '#e5e7eb',
  danger:        '#ef4444',
  dangerLight:   '#fef2f2',
};

export default function BlockListPage() {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);
  const [searchQ, setSearchQ]           = useState('');
  const [showAddBlock, setShowAddBlock]     = useState(false);
  const [searchUserQ, setSearchUserQ]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [searching, setSearching]           = useState(false);
  const [blockingId, setBlockingId]         = useState(null);

  useEffect(() => {
    fetchBlocked();
  }, []);

  async function fetchBlocked() {
    setLoading(true);
    try {
      const res = await userAPI.getBlocked();
      setBlockedUsers(res.data.data.blockedUsers);
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
    }
    setLoading(false);
  }

  async function handleUnblock(userId) {
    setUnblockingId(userId);
    try {
      await userAPI.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
    } catch (err) {
      console.error('Unblock failed:', err);
    }
    setUnblockingId(null);
  }

  async function handleSearchUsers(q) {
    setSearchUserQ(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await userAPI.search(q, 10);
      setSearchResults(res.data.data.users);
    } catch (err) {
      console.error('Search failed:', err);
    }
    setSearching(false);
  }

  async function handleBlockUser(userId) {
    setBlockingId(userId);
    try {
      await userAPI.blockUser(userId);
      // Refresh blocked list
      await fetchBlocked();
      setSearchResults(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      console.error('Block failed:', err);
    }
    setBlockingId(null);
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  const filteredBlocked = searchQ
    ? blockedUsers.filter(u =>
        (u.displayName || '').toLowerCase().includes(searchQ.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(searchQ.toLowerCase())
      )
    : blockedUsers;

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      fontFamily: "'Inter', sans-serif",
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: '560px',
        background: C.surface,
        minHeight: '100vh',
        boxShadow: '0 0 40px rgba(0,0,0,0.06)',
      }}>
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 20px',
          borderBottom: `1px solid ${C.outline}`,
          position: 'sticky', top: 0, zIndex: 10,
          background: C.surface,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.onSurface, display: 'flex', padding: '4px',
            }}
          >
            <ArrowLeft size={22} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '1.25rem', fontWeight: 700, color: C.onSurface,
              margin: 0, display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Shield size={20} color={C.danger} />
              Block List
            </h1>
            <p style={{ fontSize: '0.78rem', color: C.onSurfaceVar, margin: '2px 0 0' }}>
              {blockedUsers.length} blocked user{blockedUsers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowAddBlock(!showAddBlock)}
            style={{
              padding: '8px 14px', borderRadius: '10px',
              background: showAddBlock ? C.dangerLight : C.surfaceDim,
              border: `1px solid ${showAddBlock ? C.danger + '33' : C.outline}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '0.8rem', fontWeight: 600,
              color: showAddBlock ? C.danger : C.onSurface,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {showAddBlock ? <X size={14} /> : <Ban size={14} />}
            {showAddBlock ? 'Close' : 'Block User'}
          </button>
        </div>

        {/* ── Add Block Panel ── */}
        {showAddBlock && (
          <div style={{
            padding: '16px 20px',
            background: C.dangerLight,
            borderBottom: `1px solid ${C.danger}22`,
            animation: 'modalIn 0.2s ease',
          }}>
            <p style={{ fontSize: '0.8rem', color: C.danger, margin: '0 0 10px', fontWeight: 500 }}>
              Search for a user to block:
            </p>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)', color: C.onSurfaceVar,
              }} />
              <input
                autoFocus
                value={searchUserQ}
                onChange={e => handleSearchUsers(e.target.value)}
                placeholder="Search by name or username..."
                style={{
                  width: '100%', padding: '9px 12px 9px 34px',
                  border: `1.5px solid ${C.danger}44`,
                  borderRadius: '10px', fontSize: '0.85rem',
                  color: C.onSurface, background: C.surface,
                  outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {searchResults.map(u => (
                  <div key={u._id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '10px',
                    background: C.surface,
                    border: `1px solid ${C.outline}`,
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: u.avatar ? 'none' : `${C.primary}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0,
                      fontSize: '0.75rem', fontWeight: 700, color: C.primary,
                    }}>
                      {u.avatar ? (
                        <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : getInitials(u.displayName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: C.onSurface, margin: 0 }}>
                        {u.displayName}
                      </p>
                      <p style={{ fontSize: '0.73rem', color: C.onSurfaceVar, margin: 0 }}>@{u.username}</p>
                    </div>
                    <button
                      onClick={() => handleBlockUser(u._id)}
                      disabled={blockingId === u._id}
                      style={{
                        padding: '5px 12px', borderRadius: '8px',
                        background: C.danger, color: '#fff',
                        border: 'none', cursor: 'pointer',
                        fontSize: '0.75rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontFamily: 'inherit',
                        opacity: blockingId === u._id ? 0.6 : 1,
                      }}
                    >
                      {blockingId === u._id ? (
                        <div style={{
                          width: '12px', height: '12px',
                          border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                        }} />
                      ) : (
                        <>
                          <Ban size={11} /> Block
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Filter blocked list ── */}
        {blockedUsers.length > 3 && (
          <div style={{ padding: '12px 20px 0' }}>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Filter blocked users..."
              style={{
                width: '100%', padding: '8px 12px',
                border: `1.5px solid ${C.outline}`,
                borderRadius: '10px', fontSize: '0.85rem',
                color: C.onSurface, background: C.surfaceDim,
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {/* ── Blocked Users List ── */}
        <div style={{ padding: '12px 20px 32px' }}>
          {loading ? (
            <div style={{
              display: 'flex', justifyContent: 'center', padding: '60px 0',
            }}>
              <div style={{
                width: '28px', height: '28px',
                border: `3px solid ${C.outline}`, borderTopColor: C.primary,
                borderRadius: '50%', animation: 'spin 0.7s linear infinite',
              }} />
            </div>
          ) : filteredBlocked.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              color: C.onSurfaceVar,
            }}>
              <Shield size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p style={{ fontSize: '0.95rem', fontWeight: 500, margin: '0 0 4px' }}>
                {searchQ ? 'No matching blocked users' : 'No blocked users'}
              </p>
              <p style={{ fontSize: '0.82rem', margin: 0 }}>
                {searchQ ? 'Try a different search' : 'Users you block will appear here'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {filteredBlocked.map((u, idx) => {
                const uid = u._id || u.id;
                return (
                  <div
                    key={uid}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', borderRadius: '12px',
                      background: C.surfaceDim,
                      border: `1px solid ${C.outline}`,
                      animation: `cardIn 0.2s ${idx * 0.04}s ease both`,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f0f5'}
                    onMouseLeave={e => e.currentTarget.style.background = C.surfaceDim}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: u.avatar ? 'none' : `${C.danger}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0,
                      fontSize: '0.85rem', fontWeight: 700, color: C.danger,
                    }}>
                      {u.avatar ? (
                        <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : getInitials(u.displayName)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '0.9rem', fontWeight: 600, color: C.onSurface,
                        margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {u.displayName}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: C.onSurfaceVar, margin: 0 }}>
                        @{u.username}
                      </p>
                    </div>

                    {/* Unblock */}
                    <button
                      onClick={() => handleUnblock(uid)}
                      disabled={unblockingId === uid}
                      style={{
                        padding: '7px 14px', borderRadius: '8px',
                        background: 'transparent',
                        border: `1.5px solid ${C.danger}55`,
                        color: C.danger,
                        cursor: 'pointer',
                        fontSize: '0.78rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                        opacity: unblockingId === uid ? 0.5 : 1,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = C.dangerLight;
                        e.currentTarget.style.borderColor = C.danger;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = `${C.danger}55`;
                      }}
                    >
                      {unblockingId === uid ? (
                        <div style={{
                          width: '12px', height: '12px',
                          border: `1.5px solid ${C.danger}44`, borderTopColor: C.danger,
                          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                        }} />
                      ) : (
                        <>
                          <UserX size={13} /> Unblock
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
