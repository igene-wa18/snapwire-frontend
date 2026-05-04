import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, MessageCircle } from 'lucide-react';

/* ─── Design Tokens ─── */
const C = {
  primary:                '#c33797ff',
  primaryContainer:       '#00a884',
  onPrimary:              '#ffffff',
  surface:                '#f7f9fc',
  surfaceContainer:       '#eceef1',
  surfaceContainerLow:    '#f2f4f7',
  surfaceContainerLowest: '#ffffff',
  onSurface:              '#191c1e',
  onSurfaceVariant:       '#3d4a44',
  outlineVariant:         '#bccac2',
  outline:                '#6c7a74',
  error:                  '#ba1a1a',
};

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin]           = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password, form.displayName);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  function switchMode(toLogin) {
    setIsLogin(toLogin);
    setError('');
  }

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        width: '100vw',
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: C.surface,
        color: C.onSurface,
      }}
    >
      {/* ── Tiled grid background ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: `linear-gradient(${C.outlineVariant} 1px, transparent 1px),
                            linear-gradient(90deg, ${C.outlineVariant} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          opacity: 0.05,
        }}
      />

      {/* ── LEFT: Hero panel (md+) ── */}
      <div
        className="auth-hero-panel"
        style={{
          display: 'none', /* overridden by media query below */
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: C.surfaceContainer,
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '3rem',
          zIndex: 1,
          flexShrink: 0,
          width: '42%',
        }}
      >
        {/* Blob 1 */}
        <div style={{
          position: 'absolute', top: '-8rem', left: '-8rem',
          width: '18rem', height: '18rem', borderRadius: '50%',
          backgroundColor: C.primaryContainer, opacity: 0.18,
          filter: 'blur(60px)', mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }} />
        {/* Blob 2 */}
        <div style={{
          position: 'absolute', top: '45%', right: '-8rem',
          width: '22rem', height: '22rem', borderRadius: '50%',
          backgroundColor: '#c6e9c0', opacity: 0.28,
          filter: 'blur(60px)', mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }} />

        {/* Logo mark + wordmark */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="Synapsis Logo" style={{
            width: '3rem', height: '3rem', borderRadius: '0.625rem',
            objectFit: 'contain', flexShrink: 0,
          }} />
          <span style={{
            fontSize: '2.5rem', fontWeight: 700,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #2563eb 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
          }}>
            synapsis
          </span>
        </div>

        {/* Headline copy */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h1 style={{
            fontSize: '3.5rem', fontWeight: 700, lineHeight: 1.2,
            letterSpacing: '-0.02em', color: C.onSurface, margin: 0,
          }}>
            Secure, real-time<br />messaging for everyone
          </h1>
          <p style={{
            fontSize: '1.5rem', fontWeight: 500, lineHeight: 1.6,
            color: C.onSurfaceVariant, maxWidth: '20rem', margin: 0,
          }}>
            Experience the Pristine Conduit. A workspace designed for clarity, speed, and focus.
          </p>
        </div>

        {/* Abstract chat graphic */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            width: '100%', height: '13rem', borderRadius: '0.75rem',
            border: '1px solid rgba(188,202,194,0.2)',
            background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceContainerLow})`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Incoming bubble */}
            <div style={{
              position: 'absolute', top: '1.25rem', left: '1.5rem',
              width: '10rem', height: '4.5rem',
              backgroundColor: C.surfaceContainerLowest,
              borderRadius: '1rem 1rem 1rem 0.25rem',
              border: '1px solid rgba(188,202,194,0.35)',
              boxShadow: '0 2px 8px rgba(25,28,30,0.05)',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', padding: '0 1rem', gap: '0.5rem',
            }}>
              <div style={{ height: '0.4rem', width: '75%', borderRadius: '9999px', backgroundColor: `${C.outlineVariant}88` }} />
              <div style={{ height: '0.4rem', width: '50%', borderRadius: '9999px', backgroundColor: `${C.outlineVariant}44` }} />
            </div>

            {/* Outgoing bubble */}
            <div style={{
              position: 'absolute', bottom: '1.25rem', right: '1.5rem',
              width: '10rem', height: '4.5rem',
              backgroundColor: '#bff6e6',
              borderRadius: '1rem 1rem 0.25rem 1rem',
              border: `1px solid ${C.primary}33`,
              boxShadow: '0 4px 14px rgba(0,107,83,0.14)',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', padding: '0 1rem', gap: '0.45rem',
            }}>
              <div style={{ height: '0.4rem', width: '80%', borderRadius: '9999px', backgroundColor: `${C.onSurface}55` }} />
              <div style={{ height: '0.4rem', width: '60%', borderRadius: '9999px', backgroundColor: `${C.onSurface}33` }} />
              <div style={{ height: '0.4rem', width: '40%', borderRadius: '9999px', backgroundColor: `${C.onSurface}22` }} />
            </div>

            {/* Typing dots */}
            <div style={{
              position: 'absolute', bottom: '1.4rem', left: '1.6rem',
              backgroundColor: C.surfaceContainerLowest,
              borderRadius: '1rem', border: '1px solid rgba(188,202,194,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem 0.7rem',
            }}>
              {[0.4, 0.65, 0.9].map((op, i) => (
                <span key={i} style={{
                  width: '0.35rem', height: '0.35rem', borderRadius: '50%',
                  backgroundColor: C.outline, opacity: op,
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div
        style={{
          flex: 1,
          backgroundColor: C.surfaceContainerLowest,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          position: 'relative',
          zIndex: 1,
          overflowY: 'auto',
        }}
      >
        {/* Toggle pills — pinned top-right */}
        <div style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem',
          display: 'flex', gap: '0.25rem', padding: '0.25rem',
          backgroundColor: C.surfaceContainerLow,
          borderRadius: '0.75rem',
        }}>
          {[
            { label: 'Login',   active: isLogin },
            { label: 'Sign Up', active: !isLogin },
          ].map(({ label, active }) => (
            <button
              key={label}
              onClick={() => switchMode(label === 'Login')}
              style={{
                padding: '0.5rem 1.6rem',
                borderRadius: '0.6rem',
                fontSize: '0.9375rem', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: active ? C.surfaceContainerLowest : 'transparent',
                color: active ? C.onSurface : C.onSurfaceVariant,
                boxShadow: active ? '0 2px 8px rgba(25,28,30,0.06)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div style={{ width: '100%', maxWidth: '30rem' }}>

          {/* Heading */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '2.875rem', fontWeight: 700,
              letterSpacing: '-0.02em', color: C.onSurface,
              margin: '0 0 0.375rem',
            }}>
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ fontSize: '1.2rem', color: C.onSurfaceVariant, margin: 0 }}>
              {isLogin
                ? 'Please enter your details to sign in.'
                : 'Get started with Synapsis for free.'}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#ffdad6',
              border: '1px solid #f5b8b2',
              borderRadius: '0.75rem',
              color: C.error,
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {!isLogin && (
              <>
                <InputField
                  icon={<User size={15} />}
                  name="displayName" type="text"
                  placeholder="Your display name"
                  label="Display Name"
                  value={form.displayName}
                  onChange={handleChange}
                  required colors={C}
                />
                <InputField
                  icon={<User size={15} />}
                  name="username" type="text"
                  placeholder="e.g. john_doe"
                  label="Username"
                  value={form.username}
                  onChange={handleChange}
                  required minLength={3} colors={C}
                />
              </>
            )}

            <InputField
              icon={<Mail size={15} />}
              name="email" type="email"
              placeholder="name@example.com"
              label="Email address"
              value={form.email}
              onChange={handleChange}
              required colors={C}
            />

            {/* Password field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '1.2rem', fontWeight: 600, color: C.onSurface }}>
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    style={{
                      fontSize: '1.1rem', fontWeight: 500,
                      color: C.primary, background: 'none',
                      border: 'none', cursor: 'pointer', padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                  color: C.onSurfaceVariant, opacity: 0.7, display: 'flex',
                }}>
                  <Lock size={15} />
                </span>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required minLength={6}
                  style={{ ...inputStyle(C), paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: C.onSurfaceVariant, opacity: 0.7,
                    display: 'flex', alignItems: 'center',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                width: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                padding: '0.875rem 1rem',
                border: 'none', borderRadius: '0.75rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryContainer})`,
                color: C.onPrimary,
                fontSize: '1.1rem', fontWeight: 600,
                boxShadow: '0 4px 16px rgba(0,107,83,0.28)',
                transition: 'opacity 0.15s ease, transform 0.1s ease',
                opacity: loading ? 0.65 : 1,
              }}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {loading ? (
                <div style={{
                  width: '1.1rem', height: '1.1rem',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'snapwire-spin 0.7s linear infinite',
                }} />
              ) : (
                <>
                  {isLogin ? 'Sign in' : 'Create Account'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p style={{
            marginTop: '1.5rem', textAlign: 'center',
            fontSize: '1.1rem', color: C.onSurfaceVariant,
          }}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => switchMode(!isLogin)}
              style={{
                fontWeight: 600, color: C.primary,
                background: 'none', border: 'none',
                cursor: 'pointer', padding: 0,
              }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>

      {/* Scoped styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        @keyframes snapwire-spin {
          to { transform: rotate(360deg); }
        }

        @media (min-width: 768px) {
          .auth-hero-panel {
            display: flex !important;
          }
        }

        .auth-input:focus {
          outline: none !important;
          border-color: #006b53 !important;
          box-shadow: 0 0 0 3px rgba(0,107,83,0.12) !important;
        }
      `}</style>
    </div>
  );
}

/* ─── Helpers ─── */

function inputStyle(C) {
  return {
    appearance: 'none',
    display: 'block',
    width: '100%',
    paddingLeft: '2.5rem',
    paddingRight: '0.75rem',
    paddingTop: '0.75rem',
    paddingBottom: '0.75rem',
    backgroundColor: C.surfaceContainerLowest,
    border: '1px solid rgba(188,202,194,0.45)',
    borderRadius: '0.75rem',
    color: C.onSurface,
    fontSize: '0.9375rem',
    boxSizing: 'border-box',
    boxShadow: '0 1px 4px rgba(25,28,30,0.04)',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };
}

function InputField({ icon, name, type, placeholder, value, onChange, label, required, minLength, colors: C }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: C.onSurface }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: '0.75rem', top: '50%',
          transform: 'translateY(-50%)', pointerEvents: 'none',
          color: C.onSurfaceVariant, opacity: 0.7, display: 'flex',
        }}>
          {icon}
        </span>
        <input
          name={name} type={type}
          placeholder={placeholder}
          value={value} onChange={onChange}
          required={required} minLength={minLength}
          className="auth-input"
          style={inputStyle(C)}
        />
      </div>
    </div>
  );
}