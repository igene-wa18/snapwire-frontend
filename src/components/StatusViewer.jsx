import { useState, useEffect, useRef, useCallback } from 'react';
import { optimizeCloudinaryUrl, statusAPI } from '../services/api';
import { X, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';

const DURATION = 5000; // 5 seconds per status
const TICK = 50;       // Progress bar update interval

export default function StatusViewer({ group, onClose, isOwnStatus = false, onDelete }) {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const timerRef = useRef(null);
  const statuses = group.statuses || [];
  const total = statuses.length;
  const current = statuses[idx];

  // ── Auto-advance timer with setInterval ──────────────────────────
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + (TICK / DURATION) * 100;
        if (next >= 100) {
          // Move to next status or close
          setIdx(i => {
            if (i + 1 >= total) {
              clearInterval(timerRef.current);
              setTimeout(onClose, 100);
              return i;
            }
            return i + 1;
          });
          return 0;
        }
        return next;
      });
    }, TICK);
  }, [total, onClose]);

  useEffect(() => {
    if (imgLoaded && !paused) startTimer();
    return () => clearInterval(timerRef.current);
  }, [idx, imgLoaded, paused, startTimer]);

  // Reset progress + image loaded state on index change
  useEffect(() => {
    setProgress(0);
    setImgLoaded(false);
    setShowViewers(false);
  }, [idx]);

  // Mark status as viewed
  useEffect(() => {
    if (!current || isOwnStatus) return;
    statusAPI.markViewed(current._id).catch(console.error);
  }, [current, isOwnStatus]);

  // Pause timer if viewers panel is open
  useEffect(() => {
    if (showViewers) setPaused(true);
    else setPaused(false);
  }, [showViewers]);

  // ── Keyboard navigation ─────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx]);

  function goNext() {
    clearInterval(timerRef.current);
    if (idx + 1 >= total) { onClose(); return; }
    setIdx(i => i + 1);
  }

  function goPrev() {
    clearInterval(timerRef.current);
    if (idx <= 0) { setProgress(0); startTimer(); return; }
    setIdx(i => i - 1);
  }

  // ── Time ago helper ─────────────────────────────────────────────
  function timeAgo(d) {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : 'Yesterday';
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  if (!current) return null;
  const u = group.user || {};

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex', flexDirection: 'column',
      animation: 'statusViewerIn 0.25s ease',
    }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Progress bars ── */}
      <div style={{
        display: 'flex', gap: 3, padding: '10px 16px 0',
        flexShrink: 0,
      }}>
        {statuses.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: 'rgba(255,255,255,0.25)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%',
              height: '100%',
              background: 'linear-gradient(90deg, #ec4899, #a855f7)',
              borderRadius: 2,
              transition: i === idx ? 'none' : 'width 0.3s',
            }} />
          </div>
        ))}
      </div>

      {/* ── User info bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          overflow: 'hidden', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.15)',
          fontSize: 13, fontWeight: 700, color: '#fff',
          flexShrink: 0,
        }}>
          {u.avatar
            ? <img src={optimizeCloudinaryUrl(u.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : getInitials(u.displayName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>{u.displayName || 'User'}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{timeAgo(current.createdAt)}</p>
        </div>
        {/* Delete button (own status only) */}
        {isOwnStatus && onDelete && (
          <button
            onClick={async () => {
              if (deleting) return;
              if (!confirm('Delete this status?')) return;
              setDeleting(true);
              clearInterval(timerRef.current);
              await onDelete(current._id);
              setDeleting(false);
            }}
            disabled={deleting}
            style={{
              background: deleting ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.15)',
              border: 'none', borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: deleting ? 'wait' : 'pointer', color: '#f87171', flexShrink: 0,
              transition: 'background 0.15s', marginRight: 4,
            }}
            onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { if (!deleting) e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
            title="Delete this status"
          >
            <Trash2 size={17} />
          </button>
        )}
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none',
          borderRadius: '50%', width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff', flexShrink: 0,
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Image area with click zones ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', position: 'relative',
        overflow: 'hidden', minHeight: 0,
      }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Left click zone */}
        <div onClick={goPrev} style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%',
          cursor: idx > 0 ? 'pointer' : 'default', zIndex: 2,
          display: 'flex', alignItems: 'center', paddingLeft: 8,
        }}>
          {idx > 0 && <ChevronLeft size={28} color="rgba(255,255,255,0.6)" />}
        </div>

        {/* Right click zone */}
        <div onClick={goNext} style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%',
          cursor: 'pointer', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
        }}>
          <ChevronRight size={28} color="rgba(255,255,255,0.6)" />
        </div>

        {/* Status image */}
        {!imgLoaded && (
          <div style={{
            width: 40, height: 40,
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#ec4899',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            position: 'absolute',
          }} />
        )}
        <img
          key={current._id}
          src={optimizeCloudinaryUrl(current.imageUrl)}
          alt="Status"
          onLoad={() => setImgLoaded(true)}
          style={{
            maxWidth: '100%', maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: 8,
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
      </div>

      {/* ── Viewers Button (Own Status Only) ── */}
      {isOwnStatus && (
        <div style={{
          position: 'absolute', bottom: 30, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', zIndex: 10,
        }}>
          <button
            onClick={() => setShowViewers(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,0,0,0.6)', border: 'none',
              padding: '8px 16px', borderRadius: 20, color: '#fff',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
          >
            <Eye size={18} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{current.viewers?.length || 0}</span>
          </button>
        </div>
      )}

      {/* ── Viewers Panel Overlay ── */}
      {showViewers && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
          maxHeight: '60%', display: 'flex', flexDirection: 'column',
          zIndex: 20, animation: 'slideUp 0.3s ease',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px', borderBottom: '1px solid #eee',
          }}>
            <h4 style={{ margin: 0, fontSize: 16, color: '#111' }}>Viewed by {current.viewers?.length || 0}</h4>
            <button onClick={() => setShowViewers(false)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', color: '#555',
            }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
            {current.viewers?.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '20px 0', fontSize: 14 }}>
                No views yet
              </p>
            ) : (
              current.viewers?.map((v, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: '#eee',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#006b53',
                  }}>
                    {v.user?.avatar
                      ? <img src={optimizeCloudinaryUrl(v.user.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : getInitials(v.user?.displayName)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#222' }}>{v.user?.displayName}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{timeAgo(v.viewedAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Counter ── */}
      <div style={{
        padding: '8px 16px 16px',
        textAlign: 'center', flexShrink: 0, opacity: showViewers ? 0 : 1, transition: 'opacity 0.2s',
      }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          {idx + 1} / {total}
        </span>
      </div>

      <style>{`
        @keyframes statusViewerIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
