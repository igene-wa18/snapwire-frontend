import { useState } from 'react';
import { userAPI, chatAPI } from '../services/api';
import { X, Search, UserPlus, Users, ArrowLeft, Check } from 'lucide-react';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  primary:                '#006b53',
  primaryContainer:       '#00a884',
  onPrimary:              '#ffffff',
  onSurface:              '#191c1e',
  onSurfaceVariant:       '#3d4a44',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f2f4f7',
  surfaceContainerHigh:   '#e6e8eb',
  secondaryContainer:     '#c6e9c0',
  outlineVariant:         '#bccac2',
  error:                  '#ba1a1a',
  errorContainer:         '#ffdad6',
};

export default function NewChatModal({ onClose, onChatCreated, initialMode = 'search' }) {
  const [mode, setMode]               = useState(initialMode); // 'search' | 'group'
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [creating, setCreating]       = useState(false);
  const [error, setError]             = useState('');
  const [groupName, setGroupName]     = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // ─── SEARCH ──────────────────────────────────────────────────────
  async function handleSearch(value) {
    setQuery(value);
    setError('');
    if (value.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await userAPI.search(value);
      setResults(res.data.data.users);
    } catch { /* silent */ }
    setLoading(false);
  }

  // ─── START DIRECT CHAT ───────────────────────────────────────────
  async function handleStartChat(userId) {
    setCreating(true);
    setError('');
    try {
      const res = await chatAPI.create({ participantIds: [userId], isGroup: false });
      onChatCreated(res.data.data.chat);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create chat');
    }
    setCreating(false);
  }

  // ─── GROUP SELECTION ─────────────────────────────────────────────
  function toggleUser(u) {
    setSelectedUsers(prev => {
      const exists = prev.find(x => x._id === u._id);
      return exists ? prev.filter(x => x._id !== u._id) : [...prev, u];
    });
  }

  // ─── CREATE GROUP ────────────────────────────────────────────────
  async function handleCreateGroup() {
    if (!groupName.trim() || selectedUsers.length < 2) {
      setError('Group needs a name and at least 2 members');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await chatAPI.create({
        participantIds: selectedUsers.map(u => u._id),
        isGroup: true,
        name: groupName,
      });
      onChatCreated(res.data.data.chat);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    }
    setCreating(false);
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  // ─── REUSABLE INPUT STYLE ────────────────────────────────────────
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: C.surfaceContainerLow,
    border: `1px solid ${C.outlineVariant}44`,
    borderRadius: '10px',
    fontSize: '14px',
    color: C.onSurface,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(25,28,30,0.55)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      padding: '16px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        .modal-scroll::-webkit-scrollbar { width: 4px; }
        .modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-scroll::-webkit-scrollbar-thumb { background: ${C.outlineVariant}; border-radius: 999px; }
      `}</style>

      <div style={{
        background: C.surfaceContainerLowest,
        borderRadius: '16px',
        boxShadow: '0 24px 60px rgba(25,28,30,0.22)',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '82vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'modalIn 0.18s ease',
        overflow: 'hidden',
      }}>

        {/* ─── HEADER ─── */}
        <div style={{
          background: C.primary,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}>
          {mode === 'group' && (
            <button
              onClick={() => setMode('search')}
              style={{
                padding: '6px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: C.onPrimary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.15s',
                opacity: 0.85,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h3 style={{
            flex: 1,
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 700,
            color: C.onPrimary,
            margin: 0,
          }}>
            {mode === 'search' ? 'New Chat' : 'New Group'}
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              color: C.onPrimary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.15s',
              opacity: 0.85,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── MODE TABS ─── */}
        {mode === 'search' && (
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${C.outlineVariant}44`,
            flexShrink: 0,
          }}>
            {[
              { key: 'search', label: 'Direct Chat', Icon: UserPlus },
              { key: 'group',  label: 'New Group',   Icon: Users    },
            ].map(({ key, label, Icon }) => {
              const active = mode === key;
              return (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: active ? `2px solid ${C.primary}` : '2px solid transparent',
                    color: active ? C.primary : C.onSurfaceVariant,
                    fontWeight: active ? 600 : 400,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontFamily: 'inherit',
                    transition: 'color 0.15s, border-color 0.15s',
                    marginBottom: '-1px',
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── INPUTS ─── */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${C.outlineVariant}33`,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {mode === 'group' && (
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              style={{ ...inputStyle, fontWeight: 600, fontSize: '15px' }}
              onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primary}18`; }}
              onBlur={e => { e.target.style.borderColor = `${C.outlineVariant}44`; e.target.style.boxShadow = 'none'; }}
            />
          )}

          {/* Search input with icon */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: '13px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: C.onSurfaceVariant,
              pointerEvents: 'none',
              display: 'flex',
            }}>
              <Search size={17} />
            </div>
            <input
              type="text"
              placeholder="Search users by name or username..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
              autoFocus
              style={{ ...inputStyle, paddingLeft: '38px' }}
              onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primary}18`; }}
              onBlur={e => { e.target.style.borderColor = `${C.outlineVariant}44`; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* ─── ERROR ─── */}
        {error && (
          <div style={{
            margin: '8px 20px 0',
            padding: '10px 14px',
            background: C.errorContainer,
            color: C.error,
            borderRadius: '8px',
            fontSize: '13px',
            flexShrink: 0,
          }}>
            {error}
          </div>
        )}

        {/* ─── SELECTED USERS CHIPS (group mode) ─── */}
        {mode === 'group' && selectedUsers.length > 0 && (
          <div style={{
            padding: '8px 20px',
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            borderBottom: `1px solid ${C.outlineVariant}33`,
            flexShrink: 0,
          }}>
            {selectedUsers.map(u => (
              <span
                key={u._id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: C.secondaryContainer,
                  color: C.primary,
                  padding: '4px 10px 4px 10px',
                  borderRadius: '999px',
                  fontSize: '12.5px',
                  fontWeight: 500,
                }}
              >
                {u.displayName}
                <button
                  onClick={() => toggleUser(u)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.primary,
                    display: 'flex',
                    padding: '1px',
                    opacity: 0.7,
                    marginLeft: '2px',
                  }}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* ─── RESULTS LIST ─── */}
        <div className="modal-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{
                width: '26px', height: '26px',
                border: `3px solid ${C.outlineVariant}`,
                borderTopColor: C.primary,
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : results.length > 0 ? (
            results.map(u => {
              const isSelected = !!selectedUsers.find(s => s._id === u._id);
              return (
                <button
                  key={u._id}
                  onClick={() => mode === 'group' ? toggleUser(u) : handleStartChat(u._id)}
                  disabled={creating && mode !== 'group'}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '11px 20px',
                    background: isSelected ? `${C.secondaryContainer}55` : 'transparent',
                    border: 'none',
                    cursor: creating && mode !== 'group' ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.surfaceContainerLow; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSelected ? `${C.secondaryContainer}55` : 'transparent'; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: '50%',
                    background: `${C.primaryContainer}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: C.primary,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    {u.avatar
                      ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : getInitials(u.displayName)
                    }
                  </div>

                  {/* Name + username */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14.5px', fontWeight: 600, color: C.onSurface, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.displayName}
                    </p>
                    <p style={{ fontSize: '12.5px', color: C.onSurfaceVariant, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      @{u.username}
                    </p>
                  </div>

                  {/* Group checkbox */}
                  {mode === 'group' && (
                    <div style={{
                      width: '22px', height: '22px',
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? C.primary : C.outlineVariant}`,
                      background: isSelected ? C.primary : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.15s, border-color 0.15s',
                    }}>
                      {isSelected && <Check size={13} color="#fff" />}
                    </div>
                  )}
                </button>
              );
            })
          ) : query.length >= 2 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px 0', fontSize: '13px', color: C.onSurfaceVariant }}>
              No users found for "{query}"
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 24px 0', fontSize: '13px', color: C.onSurfaceVariant }}>
              Type at least 2 characters to search
            </div>
          )}
        </div>

        {/* ─── CREATE GROUP BUTTON ─── */}
        {mode === 'group' && (
          <div style={{
            padding: '12px 20px 16px',
            borderTop: `1px solid ${C.outlineVariant}33`,
            flexShrink: 0,
          }}>
            {/* Helper text when not enough members */}
            {selectedUsers.length < 2 && (
              <p style={{
                fontSize: '12px',
                color: C.onSurfaceVariant,
                textAlign: 'center',
                marginBottom: '8px',
                margin: '0 0 8px',
              }}>
                {selectedUsers.length === 0
                  ? 'Search and select at least 2 members to create a group'
                  : 'Select at least 1 more member'}
              </p>
            )}
            <button
              onClick={handleCreateGroup}
              disabled={creating || selectedUsers.length < 2 || !groupName.trim()}
              style={{
                width: '100%',
                padding: '13px',
                background: (creating || selectedUsers.length < 2 || !groupName.trim()) ? `${C.primary}55` : C.primary,
                color: C.onPrimary,
                border: 'none',
                borderRadius: '12px',
                fontSize: '14.5px',
                fontWeight: 600,
                cursor: (creating || selectedUsers.length < 2 || !groupName.trim()) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: (selectedUsers.length >= 2 && groupName.trim()) ? `0 4px 16px ${C.primary}40` : 'none',
                transition: 'background 0.15s, transform 0.1s, box-shadow 0.15s',
                opacity: (creating || selectedUsers.length < 2 || !groupName.trim()) ? 0.85 : 1,
              }}
              onMouseEnter={e => { if (!creating && selectedUsers.length >= 2 && groupName.trim()) e.currentTarget.style.background = '#005642'; }}
              onMouseLeave={e => { if (!creating && selectedUsers.length >= 2 && groupName.trim()) e.currentTarget.style.background = C.primary; else e.currentTarget.style.background = `${C.primary}55`; }}
              onMouseDown={e => { if (selectedUsers.length >= 2 && groupName.trim()) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {creating ? (
                <div style={{
                  width: '20px', height: '20px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
              ) : (
                <>
                  <Users size={16} />
                  {selectedUsers.length >= 2
                    ? `Create Group · ${selectedUsers.length} members`
                    : 'Create Group'}
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}