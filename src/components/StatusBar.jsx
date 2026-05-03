import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { statusAPI, uploadToCloudinary, optimizeCloudinaryUrl } from '../services/api';
import StatusViewer from './StatusViewer';
import { Plus, ImagePlus, Loader2 } from 'lucide-react';

const C = {
  primary: '#006b53', primaryContainer: '#00a884',
  onSurface: '#191c1e', onSurfaceVariant: '#3d4a44',
  surfaceHigh: '#e6e8eb', outlineVariant: '#bccac2',
  ringStart: '#ec4899', ringEnd: '#a855f7',
};

export default function StatusBar() {
  const { user } = useAuth();
  const [grouped, setGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerData, setViewerData] = useState(null);
  const fileRef = useRef(null);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await statusAPI.getFeed();
      groupByUser(res.data.data.statuses || []);
    } catch (err) { console.error('Status fetch error:', err); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatuses();
    const t = setInterval(fetchStatuses, 30000);
    return () => clearInterval(t);
  }, [fetchStatuses]);

  function groupByUser(list) {
    const map = list.reduce((acc, s) => {
      const uid = s.user._id || s.user;
      if (!acc[uid]) acc[uid] = { userId: uid, user: s.user, statuses: [] };
      acc[uid].statuses.push(s);
      return acc;
    }, {});
    const arr = Object.values(map);
    arr.sort((a, b) => {
      if (a.userId === user?.id) return -1;
      if (b.userId === user?.id) return 1;
      return new Date(b.statuses[0]?.createdAt) - new Date(a.statuses[0]?.createdAt);
    });
    setGrouped(arr);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Please select an image.');
    if (file.size > 5 * 1024 * 1024) return alert('Max 5MB.');
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      await statusAPI.upload(url);
      await fetchStatuses();
    } catch (err) { console.error(err); alert('Upload failed.'); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  const ini = n => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?';
  const ago = d => {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); return h < 24 ? `${h}h ago` : 'Yesterday';
  };

  const myGroup = grouped.find(g => g.userId === user?.id);
  const hasMyStatus = myGroup?.statuses.length > 0;

  function AvatarRing({ group, size = 60, isMe = false }) {
    const hasRing = isMe ? hasMyStatus : true;
    const u = group?.user || {};
    return (
      <div style={{ position: 'relative' }}>
        <div style={{
          width: size, height: size, borderRadius: '50%', padding: '3px',
          background: hasRing ? `linear-gradient(135deg, ${C.ringStart}, ${C.ringEnd})` : C.surfaceHigh,
          transition: 'transform 0.2s',
        }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
           onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #fff',
            background: `${C.primaryContainer}22`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: C.primary, overflow: 'hidden',
          }}>
            {u.avatar
              ? <img src={optimizeCloudinaryUrl(u.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : ini(isMe ? user?.displayName : u.displayName)}
          </div>
        </div>
        {isMe && (
          <button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }} disabled={uploading}
            style={{
              position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%',
              background: C.primary, border: '2px solid #fff', color: '#fff', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', padding: 0,
            }}>
            {uploading ? <Loader2 size={11} className="status-spin" /> : <Plus size={13} strokeWidth={3} />}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: C.onSurface, margin: 0 }}>Status</h3>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
            border: 'none', background: `${C.primary}11`, color: C.primary, fontSize: 12,
            fontWeight: 600, cursor: uploading ? 'wait' : 'pointer', fontFamily: 'inherit',
          }}>
          {uploading ? <Loader2 size={14} className="status-spin" /> : <ImagePlus size={14} />}
          {uploading ? 'Uploading...' : 'Add'}
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />

      {/* Scrollable avatars */}
      <div className="status-scroll-hide" style={{
        display: 'flex', gap: 16, padding: '8px 16px 16px', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none',
      }}>
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div className="shimmer-bg" style={{ width: 56, height: 56, borderRadius: '50%' }} />
            <div className="shimmer-bg" style={{ width: 40, height: 8, borderRadius: 4 }} />
          </div>
        )) : (
          <>
            {/* My status */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0, minWidth: 64 }}
              onClick={() => hasMyStatus ? setViewerData(myGroup) : fileRef.current?.click()}>
              <AvatarRing group={myGroup} isMe />
              <span style={{ fontSize: 11, color: C.onSurfaceVariant, fontWeight: 500 }}>My Status</span>
            </div>
            {/* Friends */}
            {grouped.filter(g => g.userId !== user?.id).map(g => (
              <div key={g.userId} onClick={() => setViewerData(g)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0, minWidth: 64, animation: 'statusFadeIn 0.3s ease' }}>
                <AvatarRing group={g} />
                <span style={{ fontSize: 11, color: C.onSurfaceVariant, fontWeight: 500, maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {g.user.displayName?.split(' ')[0] || 'User'}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Recent updates list */}
      <div style={{ flex: 1, overflowY: 'auto', borderTop: `1px solid ${C.outlineVariant}33` }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.onSurfaceVariant, padding: '12px 16px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Updates</p>
        {!loading && grouped.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <ImagePlus size={40} color={C.outlineVariant} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.6 }}>No status updates yet.<br />Tap "Add" to share your first status!</p>
          </div>
        )}
        {grouped.map(g => (
          <button key={g.userId} onClick={() => setViewerData(g)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', padding: 2, background: `linear-gradient(135deg, ${C.ringStart}, ${C.ringEnd})`, flexShrink: 0 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${C.primaryContainer}22`, fontSize: 13, fontWeight: 700, color: C.primary }}>
                {g.user.avatar ? <img src={optimizeCloudinaryUrl(g.user.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(g.user.displayName)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.onSurface, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {g.userId === user?.id ? 'My Status' : g.user.displayName}
              </p>
              <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: 0 }}>
                {g.statuses.length} update{g.statuses.length !== 1 ? 's' : ''} · {ago(g.statuses[0]?.createdAt)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {viewerData && (
        <StatusViewer
          group={viewerData}
          onClose={() => setViewerData(null)}
          isOwnStatus={viewerData.userId === user?.id}
          onDelete={async (statusId) => {
            try {
              await statusAPI.delete(statusId);
              // Remove from local state
              const updated = viewerData.statuses.filter(s => s._id !== statusId);
              if (updated.length === 0) {
                setViewerData(null);
              } else {
                setViewerData({ ...viewerData, statuses: updated });
              }
              // Refresh the full feed
              await fetchStatuses();
            } catch (err) {
              console.error('Delete failed:', err);
              alert('Failed to delete status.');
            }
          }}
        />
      )}
      <style>{`.status-scroll-hide::-webkit-scrollbar{display:none}.status-spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
