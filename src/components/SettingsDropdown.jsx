import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Palette,
  Shield,
  Ban,
  LogOut,
  ChevronRight,
} from 'lucide-react';

/* ─── Design Tokens ─── */
const C = {
  primary:       '#c33797',
  surface:       '#ffffff',
  surfaceDim:    '#f9f9fc',
  onSurface:     '#1a1a2e',
  onSurfaceVar:  '#6b7280',
  outline:       '#e5e7eb',
  danger:        '#ef4444',
};

const MENU_ITEMS = [
  { key: 'theme',    label: 'Theme',       icon: Palette, color: '#8b5cf6', desc: 'Customize appearance' },
  { key: 'security', label: 'Security',    icon: Shield,  color: '#06b6d4', desc: 'Password & privacy' },
  { key: 'blocked',  label: 'Block List',  icon: Ban,     color: '#f59e0b', desc: 'Manage blocked users', link: '/blocked' },
  { key: 'logout',   label: 'Log Out',     icon: LogOut,  color: C.danger,  desc: 'Sign out of your account' },
];

export default function SettingsDropdown({ show, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Outside click handler
  useEffect(() => {
    if (!show) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    }
    // Delay to avoid closing immediately on the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [show, onClose]);

  // Escape key handler
  useEffect(() => {
    if (!show) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [show, onClose]);

  if (!show) return null;

  function handleItemClick(item) {
    if (item.key === 'logout') {
      logout();
      onClose();
      return;
    }
    if (item.link) {
      navigate(item.link);
      onClose();
      return;
    }
    // Placeholder for theme/security
    onClose();
  }

  return (
    <div
      ref={dropdownRef}
      className="animate-slide-down"
      style={{
        position: 'absolute',
        top: '48px',
        right: '0',
        width: '260px',
        background: C.surface,
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
        padding: '8px',
        zIndex: 100,
        fontFamily: "'Inter', sans-serif",
        border: `1px solid ${C.outline}`,
        overflow: 'hidden',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', top: '12px', bottom: '12px', left: '0',
        width: '3px', borderRadius: '0 4px 4px 0',
        background: `linear-gradient(180deg, ${C.primary}, #7c3aed)`,
      }} />

      {MENU_ITEMS.map((item, idx) => {
        const Icon = item.icon;
        const isLogout = item.key === 'logout';

        return (
          <div key={item.key}>
            {isLogout && (
              <div style={{
                height: '1px', background: C.outline,
                margin: '6px 12px',
              }} />
            )}
            <button
              onClick={() => handleItemClick(item)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = C.surfaceDim;
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {/* Icon circle */}
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: `${item.color}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={16} color={item.color} />
              </div>

              {/* Label + desc */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.875rem', fontWeight: 600,
                  color: isLogout ? C.danger : C.onSurface,
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '0.7rem', color: C.onSurfaceVar,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.desc}
                </div>
              </div>

              {/* Chevron (not for logout) */}
              {!isLogout && (
                <ChevronRight size={14} color={C.onSurfaceVar} style={{ opacity: 0.5, flexShrink: 0 }} />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
