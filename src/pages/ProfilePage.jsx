import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authAPI, uploadToCloudinary } from '../services/api';
import SettingsDropdown from '../components/SettingsDropdown';
import ProfileSetupModal from '../components/ProfileSetupModal';
import {
  ArrowLeft, Camera, Pencil, Settings, Users, MessageSquare,
  CalendarDays, Check, X, Loader2,
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
};

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Inline editing
  const [editingBio, setEditingBio]   = useState(false);
  const [editingVibe, setEditingVibe] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempBio, setTempBio]         = useState(user?.about || '');
  const [tempVibe, setTempVibe]       = useState(user?.vibe || '');
  const [tempName, setTempName]       = useState(user?.displayName || '');
  const [saving, setSaving]           = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');

  // Stats
  const [stats, setStats] = useState({
    friends: user?.contactsCount || user?.contacts?.length || 0,
    groups: user?.groupsCount || 0,
    joined: user?.createdAt || new Date().toISOString(),
  });

  useEffect(() => {
    // Refresh user data for accurate stats
    authAPI.getMe().then(res => {
      const u = res.data.data.user;
      updateUser(u);
      setStats({
        friends: u.contactsCount || u.contacts?.length || 0,
        groups: u.groupsCount || 0,
        joined: u.createdAt,
      });
      setTempBio(u.about || '');
      setTempVibe(u.vibe || '');
      setTempName(u.displayName || '');
    }).catch(() => {});
  }, []);

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadToCloudinary(file);
      await authAPI.updateProfile({ avatar: url });
      updateUser({ avatar: url });
    } catch (err) {
      console.error('Avatar upload failed:', err);
    }
    setUploadingAvatar(false);
  }

  async function saveField(field, value) {
    setSaving(true);
    setErrorMsg('');
    try {
      const payload = { [field]: value.trim() };
      const res = await authAPI.updateProfile(payload);
      updateUser(res.data.data.user);
    } catch (err) {
      console.error('Save failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update profile');
      // Hide error after 3s
      setTimeout(() => setErrorMsg(''), 3000);
    }
    setSaving(false);
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', year: 'numeric',
    });
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      fontFamily: "'Inter', sans-serif",
      display: 'flex', justifyContent: 'center',
      padding: '0',
    }}>
      <div style={{
        width: '100%', maxWidth: '520px',
        background: C.surface,
        minHeight: '100vh',
        position: 'relative',
        boxShadow: '0 0 40px rgba(0,0,0,0.06)',
      }}>
        {/* ── Top Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          background: C.surface,
          borderBottom: `1px solid ${C.outline}`,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.onSurface, fontWeight: 600, fontSize: '0.95rem',
              fontFamily: 'inherit', padding: '6px 2px',
            }}
          >
            <ArrowLeft size={20} />
            Back
          </button>

          {/* Settings gear */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSettings(v => !v)}
              style={{
                padding: '8px', borderRadius: '50%',
                background: showSettings ? C.surfaceDim : 'transparent',
                border: 'none', cursor: 'pointer',
                color: C.onSurfaceVar,
                display: 'flex', alignItems: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.surfaceDim}
              onMouseLeave={e => {
                if (!showSettings) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Settings
                size={22}
                style={{
                  transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                  transform: showSettings ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              />
            </button>
            <SettingsDropdown show={showSettings} onClose={() => setShowSettings(false)} />
          </div>
        </div>

        {/* ── Error Toast ── */}
        {errorMsg && (
          <div style={{
            position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)',
            background: '#fef2f2', border: '1px solid #fecaca', color: C.error || '#ef4444',
            padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', zIndex: 50,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            animation: 'slideDown 0.2s ease',
          }}>
            {errorMsg}
          </div>
        )}

        {/* ── Hero / Avatar Section ── */}
        <div style={{
          background: `linear-gradient(135deg, ${C.primary}11, #7c3aed11, ${C.primaryLight}33)`,
          padding: '32px 20px 28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          {/* Avatar */}
          <div
            style={{ position: 'relative', marginBottom: '16px', cursor: 'pointer' }}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{
              width: '110px', height: '110px', borderRadius: '50%',
              background: user?.avatar ? 'none' : `linear-gradient(135deg, ${C.primary}, #7c3aed)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              border: `4px solid ${C.surface}`,
              boxShadow: `0 4px 20px ${C.primary}25`,
              animation: uploadingAvatar ? 'avatarPulse 1.5s infinite' : 'none',
            }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                }} />
              ) : (
                <span style={{ color: '#fff', fontSize: '2rem', fontWeight: 700 }}>
                  {getInitials(user?.displayName)}
                </span>
              )}
            </div>

            {/* Camera overlay badge */}
            <div style={{
              position: 'absolute', bottom: '2px', right: '2px',
              width: '34px', height: '34px', borderRadius: '50%',
              background: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `3px solid ${C.surface}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {uploadingAvatar ? (
                <div style={{
                  width: '14px', height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                }} />
              ) : (
                <Camera size={14} color="#fff" />
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
          </div>

          {/* Display Name (editable) */}
          {editingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <input
                autoFocus
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                maxLength={50}
                style={{
                  fontSize: '1.5rem', fontWeight: 700, color: C.onSurface,
                  border: 'none', borderBottom: `2px solid ${C.primary}`,
                  background: 'transparent', outline: 'none',
                  textAlign: 'center', width: '220px',
                  fontFamily: 'inherit',
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    saveField('displayName', tempName);
                    setEditingName(false);
                  }
                  if (e.key === 'Escape') {
                    setTempName(user?.displayName || '');
                    setEditingName(false);
                  }
                }}
              />
              <button onClick={() => { saveField('displayName', tempName); setEditingName(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', padding: '2px' }}>
                <Check size={18} />
              </button>
              <button onClick={() => { setTempName(user?.displayName || ''); setEditingName(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVar, padding: '2px' }}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
                cursor: 'pointer',
              }}
              onClick={() => setEditingName(true)}
            >
              <h1 style={{
                fontSize: '1.5rem', fontWeight: 700, color: C.onSurface,
                margin: 0, letterSpacing: '-0.02em',
              }}>
                {user?.displayName}
              </h1>
              <Pencil size={14} color={C.onSurfaceVar} style={{ opacity: 0.5 }} />
            </div>
          )}

          {/* Username (non-editable) */}
          <p style={{
            fontSize: '0.9rem', color: C.primary, fontWeight: 500,
            margin: '0 0 0', opacity: 0.8,
          }}>
            @{user?.username}
          </p>
        </div>

        {/* ── Bio & Vibe Section ── */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.outline}` }}>
          {/* Bio */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '6px',
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: C.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Bio
              </span>
              {!editingBio && (
                <button
                  onClick={() => setEditingBio(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: C.primary, display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '0.75rem', fontWeight: 500, padding: '2px 4px',
                  }}
                >
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>
            {editingBio ? (
              <div>
                <textarea
                  autoFocus
                  value={tempBio}
                  onChange={e => setTempBio(e.target.value)}
                  maxLength={139}
                  rows={2}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: `1.5px solid ${C.primary}`,
                    borderRadius: '10px', fontSize: '0.9rem',
                    color: C.onSurface, background: C.surfaceDim,
                    outline: 'none', resize: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: C.onSurfaceVar }}>{tempBio.length}/139</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { setTempBio(user?.about || ''); setEditingBio(false); }}
                      style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${C.outline}`, background: 'none', cursor: 'pointer', fontSize: '0.8rem', color: C.onSurfaceVar }}>
                      Cancel
                    </button>
                    <button onClick={() => { saveField('about', tempBio); setEditingBio(false); }}
                      style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: C.primary, color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{
                fontSize: '0.9375rem', color: C.onSurface, margin: 0,
                lineHeight: 1.5, fontStyle: user?.about ? 'normal' : 'italic',
                opacity: user?.about ? 1 : 0.5,
              }}>
                {user?.about || 'No bio yet...'}
              </p>
            )}
          </div>

          {/* Vibe */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '6px',
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: C.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Life Vibe ✨
              </span>
              {!editingVibe && (
                <button
                  onClick={() => setEditingVibe(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: C.primary, display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '0.75rem', fontWeight: 500, padding: '2px 4px',
                  }}
                >
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>
            {editingVibe ? (
              <div>
                <input
                  autoFocus
                  value={tempVibe}
                  onChange={e => setTempVibe(e.target.value)}
                  maxLength={60}
                  placeholder="e.g. 🎧 Vibing to lo-fi beats"
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: `1.5px solid ${C.primary}`,
                    borderRadius: '10px', fontSize: '0.9rem',
                    color: C.onSurface, background: C.surfaceDim,
                    outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { saveField('vibe', tempVibe); setEditingVibe(false); }
                    if (e.key === 'Escape') { setTempVibe(user?.vibe || ''); setEditingVibe(false); }
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                  <button onClick={() => { setTempVibe(user?.vibe || ''); setEditingVibe(false); }}
                    style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${C.outline}`, background: 'none', cursor: 'pointer', fontSize: '0.8rem', color: C.onSurfaceVar }}>
                    Cancel
                  </button>
                  <button onClick={() => { saveField('vibe', tempVibe); setEditingVibe(false); }}
                    style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: C.primary, color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '10px 14px', borderRadius: '10px',
                background: `linear-gradient(135deg, ${C.primary}08, #7c3aed08)`,
                border: `1px solid ${C.primary}15`,
              }}>
                <p style={{
                  fontSize: '0.9375rem', color: C.onSurface, margin: 0,
                  fontStyle: user?.vibe ? 'normal' : 'italic',
                  opacity: user?.vibe ? 1 : 0.5,
                }}>
                  {user?.vibe || 'No vibe set yet...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div style={{
          display: 'flex', padding: '20px 24px',
          borderBottom: `1px solid ${C.outline}`,
          gap: '0',
        }}>
          {[
            { label: 'Friends', value: stats.friends, icon: Users, color: '#8b5cf6' },
            { label: 'Groups', value: stats.groups, icon: MessageSquare, color: '#06b6d4' },
            { label: 'Joined', value: formatDate(stats.joined), icon: CalendarDays, color: '#f59e0b', isDate: true },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '4px',
                borderRight: i < 2 ? `1px solid ${C.outline}` : 'none',
                animation: `statPop 0.4s ${i * 0.1}s cubic-bezier(0.16,1,0.3,1) both`,
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `${stat.color}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '2px',
              }}>
                <stat.icon size={16} color={stat.color} />
              </div>
              <span style={{
                fontSize: stat.isDate ? '0.85rem' : '1.25rem',
                fontWeight: 700, color: C.onSurface,
              }}>
                {stat.value}
              </span>
              <span style={{ fontSize: '0.7rem', color: C.onSurfaceVar, fontWeight: 500 }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Edit Profile Button ── */}
        <div style={{ padding: '24px' }}>
          <button
            onClick={() => setShowSetupModal(true)}
            style={{
              width: '100%', padding: '14px',
              background: `linear-gradient(135deg, ${C.primary}, #7c3aed)`,
              color: '#fff', border: 'none', borderRadius: '14px',
              fontSize: '0.95rem', fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: `0 4px 16px ${C.primary}33`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 24px ${C.primary}44`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}33`;
            }}
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        </div>

        {/* ── Account info footer ── */}
        <div style={{ padding: '0 24px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: C.onSurfaceVar, margin: 0 }}>
            {user?.email}
          </p>
        </div>
      </div>

      {/* ── Profile Setup Modal ── */}
      {showSetupModal && (
        <ProfileSetupModal
          onComplete={() => {
            setShowSetupModal(false);
            // Refresh data
            authAPI.getMe().then(res => {
              updateUser(res.data.data.user);
              const u = res.data.data.user;
              setTempBio(u.about || '');
              setTempVibe(u.vibe || '');
              setTempName(u.displayName || '');
            });
          }}
          onSkip={() => setShowSetupModal(false)}
        />
      )}

      {/* Keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
