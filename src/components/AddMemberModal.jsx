import { useState } from 'react';
import { userAPI, chatAPI } from '../services/api';
import { X, Search, Check } from 'lucide-react';

const C = {
  primary:                '#006b53',
  primaryContainer:       '#00a884',
  onPrimary:              '#ffffff',
  onSurface:              '#191c1e',
  onSurfaceVariant:       '#3d4a44',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f2f4f7',
  secondaryContainer:     '#c6e9c0',
  outlineVariant:         '#bccac2',
  error:                  '#ba1a1a',
  errorContainer:         '#ffdad6',
};

export default function AddMemberModal({ chatId, currentParticipants = [], onClose, onMemberAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  // ─── SEARCH ──────────────────────────────────────────────────────
  async function handleSearch(value) {
    setQuery(value);
    setError('');
    if (value.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await userAPI.search(value);
      // Filter out users who are already in the group
      const participantIds = currentParticipants.map(p => p._id || p);
      const filtered = res.data.data.users.filter(u => !participantIds.includes(u._id));
      setResults(filtered);
    } catch { /* silent */ }
    setLoading(false);
  }

  // ─── ADD MEMBER ──────────────────────────────────────────────────
  async function handleAddMember(userId) {
    setAdding(true);
    setError('');
    try {
      await chatAPI.addMember(chatId, userId);
      onMemberAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
    setAdding(false);
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

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
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(25,28,30,0.55)', backdropFilter: 'blur(6px)',
      padding: '16px', fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-scroll::-webkit-scrollbar { width: 4px; }
        .modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-scroll::-webkit-scrollbar-thumb { background: ${C.outlineVariant}; border-radius: 999px; }
      `}</style>

      <div style={{
        background: C.surfaceContainerLowest, borderRadius: '16px',
        boxShadow: '0 24px 60px rgba(25,28,30,0.22)',
        width: '100%', maxWidth: '420px', maxHeight: '82vh',
        display: 'flex', flexDirection: 'column',
        animation: 'modalIn 0.18s ease', overflow: 'hidden',
      }}>
        {/* ─── HEADER ─── */}
        <div style={{
          background: C.primary, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
        }}>
          <h3 style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: 700, color: C.onPrimary, margin: 0 }}>
            Add Member
          </h3>
          <button onClick={onClose} style={{
            padding: '6px', borderRadius: '50%', background: 'transparent',
            border: 'none', color: C.onPrimary, cursor: 'pointer',
            display: 'flex', alignItems: 'center', opacity: 0.85, transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── INPUTS ─── */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.outlineVariant}33`, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: C.onSurfaceVariant, pointerEvents: 'none', display: 'flex' }}>
              <Search size={17} />
            </div>
            <input
              type="text"
              placeholder="Search users to add..."
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
          <div style={{ margin: '8px 20px 0', padding: '10px 14px', background: C.errorContainer, color: C.error, borderRadius: '8px', fontSize: '13px', flexShrink: 0 }}>
            {error}
          </div>
        )}

        {/* ─── RESULTS LIST ─── */}
        <div className="modal-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{
                width: '26px', height: '26px', border: `3px solid ${C.outlineVariant}`, borderTopColor: C.primary,
                borderRadius: '50%', animation: 'spin 0.7s linear infinite',
              }} />
            </div>
          ) : results.length > 0 ? (
            results.map(u => (
              <button
                key={u._id}
                onClick={() => handleAddMember(u._id)}
                disabled={adding}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '11px 20px',
                  background: 'transparent', border: 'none', cursor: adding ? 'not-allowed' : 'pointer',
                  textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.surfaceContainerLow}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', background: `${C.primaryContainer}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700,
                  color: C.primary, overflow: 'hidden', flexShrink: 0,
                }}>
                  {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(u.displayName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14.5px', fontWeight: 600, color: C.onSurface, margin: '0 0 2px' }}>{u.displayName}</p>
                  <p style={{ fontSize: '12.5px', color: C.onSurfaceVariant, margin: 0 }}>@{u.username}</p>
                </div>
              </button>
            ))
          ) : query.length >= 2 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px 0', fontSize: '13px', color: C.onSurfaceVariant }}>
              No eligible users found for "{query}"
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 24px 0', fontSize: '13px', color: C.onSurfaceVariant }}>
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
