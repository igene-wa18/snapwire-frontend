import { useState, useCallback } from 'react';
import { friendsAPI, userAPI } from '../services/api';
import { getSocket } from '../services/socket';
import {
  UserPlus, Clock, Check, X, MessageSquare,
  UserMinus, ShieldOff, Loader2,
} from 'lucide-react';

/* ─── Design Tokens ─── */
const C = {
  primary:      '#c33797',
  primaryDark:  '#a12d7f',
  primaryLight: '#f8e0f0',
  surface:      '#ffffff',
  surfaceDim:   '#f7f7fb',
  onSurface:    '#1a1a2e',
  onSurfaceVar: '#6b7280',
  outline:      '#e5e7eb',
  success:      '#22c55e',
  danger:       '#ef4444',
  dangerLight:  '#fef2f2',
  pending:      '#f59e0b',
};

/**
 * Friendship Status State Machine
 * ─────────────────────────────────────────────────
 *  none              → "Add Friend"
 *  pending_sent      → "Requested" (with cancel option)
 *  pending_received  → "Accept" + "Decline"
 *  friends           → "Message" + "Unfriend"
 *  blocked           → "Unblock"
 * ─────────────────────────────────────────────────
 *
 * Props:
 *  status          : string  — one of the 5 states above
 *  targetUserId    : string
 *  requestId       : string|null — the FriendRequest document _id (for accept/decline/cancel)
 *  onStatusChange  : fn(newStatus, newRequestId?)  — parent updater
 *  onMessage       : fn()           — navigate to chat
 */
export default function RelationshipButton({
  status,
  targetUserId,
  requestId,
  onStatusChange,
  onMessage,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  /* ── Generic action runner with optimistic update + rollback ── */
  const run = useCallback(async (optimisticStatus, apiFn, args, socketEvent) => {
    const previousStatus = status;
    onStatusChange(optimisticStatus);       // ← optimistic flip
    setLoading(true);
    setError('');

    try {
      const res = await apiFn(...args);

      // If the API returns a new requestId, pass it up
      const newRequestId = res?.data?.data?.request?._id || null;
      if (newRequestId) {
        onStatusChange(optimisticStatus, newRequestId);
      }

      // Emit socket event if configured
      if (socketEvent) {
        const socket = getSocket();
        if (socket) socket.emit(socketEvent.event, socketEvent.data);
      }
    } catch (err) {
      onStatusChange(previousStatus);        // ← rollback
      const msg = err?.response?.data?.message || 'Something went wrong';
      setError(msg);
      setTimeout(() => setError(''), 3500);
    } finally {
      setLoading(false);
    }
  }, [status, onStatusChange]);

  /* ── Shared button base style ── */
  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '7px', borderRadius: '12px', fontFamily: 'inherit',
    fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
    padding: '10px 18px', border: 'none', transition: 'all 0.18s ease',
    whiteSpace: 'nowrap',
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          ...btnBase,
          background: C.surfaceDim, color: C.onSurfaceVar,
          border: `1.5px solid ${C.outline}`, cursor: 'default',
          minWidth: '130px',
        }}>
          <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />
          Processing…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ────────────── NONE ────────────── */
  if (status === 'none') {
    return (
      <>
        {error && <ErrorToast msg={error} />}
        <button
          style={{
            ...btnBase, width: '100%',
            background: `linear-gradient(135deg, ${C.primary}, #7c3aed)`,
            color: '#fff',
            boxShadow: `0 4px 14px ${C.primary}40`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 7px 22px ${C.primary}55`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 4px 14px ${C.primary}40`;
          }}
          onClick={() => run(
            'pending_sent',
            friendsAPI.sendRequest,
            [targetUserId],
            { event: 'friend_request_sent', data: { to: targetUserId } }
          )}
        >
          <UserPlus size={15} />
          Add Friend
        </button>
      </>
    );
  }

  /* ────────────── PENDING SENT ────────────── */
  if (status === 'pending_sent') {
    return (
      <>
        {error && <ErrorToast msg={error} />}
        <button
          style={{
            ...btnBase, width: '100%',
            background: C.surfaceDim,
            color: C.onSurfaceVar,
            border: `1.5px solid ${C.outline}`,
            cursor: 'default',
          }}
          disabled
        >
          <Clock size={15} color={C.pending} />
          Requested
        </button>
        {/* Cancel option */}
        {requestId && (
          <button
            onClick={() => run('none', friendsAPI.cancelRequest, [requestId])}
            style={{
              marginTop: '6px', background: 'none', border: 'none',
              color: C.danger, fontSize: '0.75rem', cursor: 'pointer',
              textDecoration: 'underline', fontFamily: 'inherit',
              display: 'block', textAlign: 'center', width: '100%',
            }}
          >
            Cancel Request
          </button>
        )}
      </>
    );
  }

  /* ────────────── PENDING RECEIVED ────────────── */
  if (status === 'pending_received') {
    return (
      <>
        {error && <ErrorToast msg={error} />}
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {/* Accept */}
          <button
            style={{
              ...btnBase, flex: 1,
              background: `linear-gradient(135deg, ${C.success}, #16a34a)`,
              color: '#fff',
              boxShadow: `0 4px 12px ${C.success}40`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 18px ${C.success}50`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${C.success}40`;
            }}
            onClick={() => run(
              'friends',
              friendsAPI.acceptRequest,
              [requestId],
              { event: 'friend_request_accepted', data: { to: targetUserId } }
            )}
          >
            <Check size={15} />
            Accept
          </button>

          {/* Decline */}
          <button
            style={{
              ...btnBase, flex: 1,
              background: C.dangerLight,
              color: C.danger,
              border: `1.5px solid ${C.danger}25`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = C.dangerLight;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => run('none', friendsAPI.declineRequest, [requestId])}
          >
            <X size={15} />
            Decline
          </button>
        </div>
      </>
    );
  }

  /* ────────────── FRIENDS ────────────── */
  if (status === 'friends') {
    return (
      <>
        {error && <ErrorToast msg={error} />}
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button
            style={{
              ...btnBase, flex: 1,
              background: `linear-gradient(135deg, ${C.primary}, #7c3aed)`,
              color: '#fff',
              boxShadow: `0 4px 14px ${C.primary}40`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 7px 22px ${C.primary}55`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 14px ${C.primary}40`;
            }}
            onClick={onMessage}
          >
            <MessageSquare size={15} />
            Message
          </button>

          <button
            style={{
              ...btnBase,
              background: C.dangerLight,
              color: C.danger,
              border: `1.5px solid ${C.danger}25`,
              padding: '10px 14px',
            }}
            title="Unfriend"
            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.dangerLight; }}
            onClick={() => run('none', friendsAPI.unfriend, [targetUserId])}
          >
            <UserMinus size={15} />
          </button>
        </div>
      </>
    );
  }

  /* ────────────── BLOCKED ────────────── */
  if (status === 'blocked') {
    return (
      <>
        {error && <ErrorToast msg={error} />}
        <button
          style={{
            ...btnBase, width: '100%',
            background: C.dangerLight,
            color: C.danger,
            border: `1.5px solid ${C.danger}30`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.dangerLight; }}
          onClick={() => run('none', userAPI.unblockUser, [targetUserId])}
        >
          <ShieldOff size={15} />
          Unblock
        </button>
      </>
    );
  }

  return null;
}

function ErrorToast({ msg }) {
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444',
      padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem',
      marginBottom: '8px', textAlign: 'center',
      animation: 'slideDown 0.2s ease',
    }}>
      {msg}
    </div>
  );
}
