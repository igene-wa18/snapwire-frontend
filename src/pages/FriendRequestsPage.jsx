import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendsAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { ArrowLeft, BellRing, UserCheck } from 'lucide-react';

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

export default function FriendRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchRequests();

    const socket = getSocket();
    if (socket) {
      const handleRequestReceived = (data) => {
        // Optimistically add the new request if we get real-time ping
        // Normally the data contains { from: userId, requestId }, but we need the full user object
        // To be safe and show full details, we re-fetch the list when a ping arrives
        fetchRequests();
      };
      socket.on('friend_request_received', handleRequestReceived);
      return () => {
        socket.off('friend_request_received', handleRequestReceived);
      };
    }
  }, []);

  async function fetchRequests() {
    try {
      const res = await friendsAPI.getIncoming();
      setRequests(res.data.data.requests);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
    setLoading(false);
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/discover')}
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
              <BellRing size={20} color={C.primary} />
              Friend Requests
            </h1>
            <p style={{ fontSize: '0.8rem', color: C.onSurfaceVar, margin: '2px 0 0' }}>
              People who want to connect with you
            </p>
          </div>
        </div>
      </div>

      {/* ── Requests Grid ── */}
      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                height: '200px', borderRadius: '16px',
                animation: `shimmer 1.5s infinite`,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
              }} />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: C.onSurfaceVar,
          }}>
            <UserCheck size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 4px' }}>
              No pending requests
            </p>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>
              When someone sends you a friend request, it will appear here.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}>
            {requests.map((req, idx) => {
              const u = req.from;
              return (
                <div
                  key={req._id}
                  onClick={() => navigate(`/user/${u._id}`)}
                  style={{
                    background: C.surface,
                    borderRadius: '16px',
                    border: `1.5px solid ${C.primary}33`,
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
                    e.currentTarget.style.boxShadow = `0 8px 24px ${C.primary}15`;
                    e.currentTarget.style.borderColor = C.primary;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = `${C.primary}33`;
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: u.avatar ? 'none' : `linear-gradient(135deg, ${C.primary}33, #7c3aed33)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    border: `2px solid ${C.primaryLight}`,
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
                    
                    <div style={{
                      background: C.surfaceDim,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      color: C.onSurfaceVar,
                      marginTop: '8px',
                      display: 'inline-block'
                    }}>
                      Wants to be friends
                    </div>
                  </div>

                  <button
                    style={{
                      width: '100%', padding: '9px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: `linear-gradient(135deg, ${C.primary}, #7c3aed)`,
                      color: '#fff',
                      fontSize: '0.825rem', fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      marginTop: '4px',
                      fontFamily: 'inherit',
                    }}
                  >
                    View Profile
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
    </div>
  );
}
