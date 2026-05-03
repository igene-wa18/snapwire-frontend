import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, uploadToCloudinary } from '../services/api';
import { Camera, X, Sparkles, ArrowRight, User } from 'lucide-react';

/* ─── Design Tokens ─── */
const C = {
  primary:       '#c33797',
  primaryDark:   '#a12d7f',
  primaryLight:  '#f0c6e2',
  surface:       '#ffffff',
  surfaceDim:    '#f7f7fb',
  onSurface:     '#1a1a2e',
  onSurfaceVar:  '#6b7280',
  outline:       '#d1d5db',
  error:         '#ef4444',
};

export default function ProfileSetupModal({ onComplete, onSkip }) {
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [about, setAbout]             = useState(user?.about || '');
  const [vibe, setVibe]               = useState(user?.vibe || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  }

  async function handleSave() {
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let avatarUrl = user?.avatar;

      // Upload avatar if changed
      if (avatarFile) {
        setUploadingAvatar(true);
        try {
          avatarUrl = await uploadToCloudinary(avatarFile);
        } catch (uploadErr) {
          console.error("Cloudinary error:", uploadErr);
          throw new Error('Failed to upload image. Please check your Cloudinary credentials (.env).');
        }
        setUploadingAvatar(false);
      }

      const payload = {
        displayName: displayName.trim(),
        about: about.trim(),
        vibe: vibe.trim(),
        profileCompleted: true,
        ...(avatarUrl && { avatar: avatarUrl }),
      };

      const res = await authAPI.updateProfile(payload);
      updateUser(res.data.data.user);
      onComplete();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Failed to save profile';
      setError(msg);
      setUploadingAvatar(false);
    }
    setSaving(false);
  }

  return (
    <div
      className="animate-backdrop-in"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(10, 10, 30, 0.6)',
        backdropFilter: 'blur(8px)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        className="animate-modal-in"
        style={{
          width: '100%', maxWidth: '480px',
          background: C.surface,
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* ── Header gradient strip ── */}
        <div style={{
          height: '6px',
          background: `linear-gradient(90deg, ${C.primary}, #7c3aed, ${C.primary})`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite',
        }} />

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: `linear-gradient(135deg, ${C.primary}, #7c3aed)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: `0 4px 16px ${C.primary}44`,
            }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <h2 style={{
              fontSize: '1.625rem', fontWeight: 700, color: C.onSurface,
              margin: '0 0 6px', letterSpacing: '-0.02em',
            }}>
              Set Up Your Profile
            </h2>
            <p style={{ fontSize: '0.9rem', color: C.onSurfaceVar, margin: 0 }}>
              Let others know who you are. You can always change this later.
            </p>
          </div>

          {/* ── Avatar upload ── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: avatarPreview ? 'none' : `linear-gradient(135deg, ${C.primaryLight}, ${C.surfaceDim})`,
                border: `3px dashed ${avatarPreview ? C.primary : C.outline}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'all 0.2s ease',
                animation: uploadingAvatar ? 'avatarPulse 1.5s infinite' : 'none',
              }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                }} />
              ) : (
                <User size={36} color={C.onSurfaceVar} style={{ opacity: 0.5 }} />
              )}
              {/* Camera overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: avatarPreview ? 0 : 0.7,
                transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = avatarPreview ? '0' : '0.7'}
              >
                <Camera size={22} color="#fff" />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
          </div>

          {/* ── Form fields ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Display Name */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: C.onSurface, marginBottom: '4px', display: 'block' }}>
                Display Name *
              </label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="How should people call you?"
                maxLength={50}
                style={{
                  width: '100%', padding: '11px 14px',
                  border: `1.5px solid ${C.outline}`,
                  borderRadius: '12px', fontSize: '0.9375rem',
                  color: C.onSurface, background: C.surfaceDim,
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.outline}
              />
            </div>

            {/* Bio */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: C.onSurface, marginBottom: '4px', display: 'block' }}>
                Bio
              </label>
              <textarea
                value={about}
                onChange={e => setAbout(e.target.value)}
                placeholder="Tell the world about yourself..."
                maxLength={139}
                rows={2}
                style={{
                  width: '100%', padding: '11px 14px',
                  border: `1.5px solid ${C.outline}`,
                  borderRadius: '12px', fontSize: '0.9375rem',
                  color: C.onSurface, background: C.surfaceDim,
                  outline: 'none', resize: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.outline}
              />
              <span style={{ fontSize: '0.7rem', color: C.onSurfaceVar, float: 'right' }}>
                {about.length}/139
              </span>
            </div>

            {/* Vibe */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: C.onSurface, marginBottom: '4px', display: 'block' }}>
                Life Vibe ✨
              </label>
              <input
                value={vibe}
                onChange={e => setVibe(e.target.value)}
                placeholder="e.g. 🎧 Vibing to lo-fi beats"
                maxLength={60}
                style={{
                  width: '100%', padding: '11px 14px',
                  border: `1.5px solid ${C.outline}`,
                  borderRadius: '12px', fontSize: '0.9375rem',
                  color: C.onSurface, background: C.surfaceDim,
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.outline}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: '14px', padding: '10px 14px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '10px', color: C.error, fontSize: '0.85rem',
            }}>
              {error}
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', padding: '13px',
                background: `linear-gradient(135deg, ${C.primary}, #7c3aed)`,
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '0.95rem', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: `0 4px 16px ${C.primary}33`,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {saving ? (
                <div style={{
                  width: '18px', height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                }} />
              ) : (
                <>
                  Complete Setup
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              onClick={onSkip}
              disabled={saving}
              style={{
                width: '100%', padding: '12px',
                background: 'transparent', color: C.onSurfaceVar,
                border: `1.5px solid ${C.outline}`,
                borderRadius: '12px', fontSize: '0.9rem', fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = C.primary;
                e.currentTarget.style.color = C.primary;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.outline;
                e.currentTarget.style.color = C.onSurfaceVar;
              }}
            >
              Skip for now — I'll set up later
            </button>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
