import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI, uploadToCloudinary } from '../services/api';
import { Camera, X, Users, Edit2, Check, UserPlus } from 'lucide-react';
import AddMemberModal from './AddMemberModal';

const C = {
  primary:                '#006b53',
  primaryContainer:       '#00a884',
  onPrimary:              '#ffffff',
  surface:                '#ffffff',
  surfaceDim:             '#f7f7fb',
  onSurface:              '#1a1a2e',
  onSurfaceVariant:       '#6b7280',
  outline:                '#d1d5db',
  error:                  '#ef4444',
};

export default function GroupProfileModal({ chat, onClose, onRefreshChats }) {
  const { user } = useAuth();
  const fileRef = useRef(null);

  const [description, setDescription] = useState(chat.description || '');
  const [isEditingMoto, setIsEditingMoto] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(chat.groupIcon || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingMoto, setSavingMoto] = useState(false);
  const [error, setError] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  const isAdmin = chat.admins?.some(admin => {
    const adminId = typeof admin === 'string' ? admin : admin._id;
    return adminId === user?.id;
  });

  async function handleFileChange(e) {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }

    setUploadingAvatar(true);
    setError('');
    try {
      const avatarUrl = await uploadToCloudinary(file);
      setAvatarPreview(avatarUrl);
      
      // Update group in backend
      await chatAPI.update(chat._id, { groupIcon: avatarUrl });
      if (onRefreshChats) onRefreshChats();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to upload image.');
      setAvatarPreview(chat.groupIcon || null);
    }
    setUploadingAvatar(false);
  }

  async function handleSaveMoto() {
    if (description.trim() === chat.description) {
      setIsEditingMoto(false);
      return;
    }

    setSavingMoto(true);
    setError('');
    try {
      await chatAPI.update(chat._id, { description: description.trim() });
      if (onRefreshChats) onRefreshChats();
      setIsEditingMoto(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update moto');
    }
    setSavingMoto(false);
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <>
      <div
        className="animate-backdrop-in"
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10, 10, 30, 0.6)',
          backdropFilter: 'blur(8px)',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          className="animate-modal-in"
          style={{
            width: '100%', maxWidth: '420px',
            background: C.surface,
            borderRadius: '20px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ── HEADER ── */}
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.outline}44` }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.onSurface, margin: 0 }}>Group Info</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVariant }}>
              <X size={22} />
            </button>
          </div>

          <div className="modal-scroll" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {/* ── AVATAR ── */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div
                onClick={() => isAdmin && fileRef.current?.click()}
                style={{
                  width: '120px', height: '120px', borderRadius: '50%',
                  background: avatarPreview ? 'none' : `linear-gradient(135deg, ${C.primaryContainer}44, ${C.surfaceDim})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: isAdmin ? 'pointer' : 'default', position: 'relative', overflow: 'hidden',
                  animation: uploadingAvatar ? 'avatarPulse 1.5s infinite' : 'none',
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Group Icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Users size={48} color={C.primary} style={{ opacity: 0.8 }} />
                )}
                
                {/* Camera overlay */}
                {isAdmin && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: avatarPreview ? 0 : 0.7, transition: 'opacity 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = avatarPreview ? '0' : '0.7'}
                  >
                    <Camera size={26} color="#fff" />
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
            </div>

            <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, margin: '0 0 4px', color: C.onSurface }}>
              {chat.name}
            </h2>
            <p style={{ textAlign: 'center', fontSize: '13px', color: C.onSurfaceVariant, margin: '0 0 24px' }}>
              Group · {chat.participants?.length || 0} members
            </p>

            {/* ── MOTO / DESCRIPTION ── */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Group Moto
                </span>
                {isAdmin && !isEditingMoto && (
                  <button onClick={() => setIsEditingMoto(true)} style={{ background: 'none', border: 'none', color: C.onSurfaceVariant, cursor: 'pointer', padding: '4px' }}>
                    <Edit2 size={16} />
                  </button>
                )}
              </div>

              {isEditingMoto ? (
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Add group description..."
                    maxLength={200}
                    rows={3}
                    style={{
                      width: '100%', padding: '12px', border: `1px solid ${C.primary}`,
                      borderRadius: '12px', fontSize: '14px', color: C.onSurface,
                      background: C.surfaceDim, outline: 'none', resize: 'none', boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button onClick={() => { setIsEditingMoto(false); setDescription(chat.description || ''); }} style={{ background: 'none', border: 'none', color: C.onSurfaceVariant, cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                      Cancel
                    </button>
                    <button onClick={handleSaveMoto} disabled={savingMoto} style={{ background: C.primaryContainer, color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', fontWeight: 600, cursor: savingMoto ? 'not-allowed' : 'pointer' }}>
                      {savingMoto ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ background: C.surfaceDim, padding: '16px', borderRadius: '12px', fontSize: '14px', color: description ? C.onSurface : C.onSurfaceVariant, lineHeight: 1.5 }}>
                  {description || 'No moto set for this group.'}
                </div>
              )}
            </div>

            {error && (
              <div style={{ marginBottom: '16px', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: C.error, fontSize: '13px' }}>
                {error}
              </div>
            )}

            {/* ── MEMBERS LIST ── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Members
                </span>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAddMember(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    <UserPlus size={16} /> Add
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {chat.participants?.map(p => {
                  const pIsAdmin = chat.admins?.some(a => (a._id || a) === p._id);
                  return (
                    <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${C.surfaceDim}` }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${C.primaryContainer}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, fontWeight: 600, overflow: 'hidden' }}>
                        {p.avatar ? <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(p.displayName)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 600, color: C.onSurface, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.displayName} {p._id === user?.id && '(You)'}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: C.onSurfaceVariant }}>
                          {pIsAdmin ? 'Group Admin' : 'Member'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {showAddMember && (
        <AddMemberModal 
          chatId={chat._id} 
          currentParticipants={chat.participants} 
          onClose={() => setShowAddMember(false)} 
          onMemberAdded={() => {
            if (onRefreshChats) onRefreshChats();
            setShowAddMember(false);
          }} 
        />
      )}

      <style>{`
        @keyframes avatarPulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        .modal-scroll::-webkit-scrollbar { width: 4px; }
        .modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-scroll::-webkit-scrollbar-thumb { background: ${C.outline}; border-radius: 999px; }
      `}</style>
    </>
  );
}
