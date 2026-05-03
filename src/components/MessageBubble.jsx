import { Check, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
 
// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  primary:                '#006b53',
  primaryContainer:       '#00a884',
  onSurface:              '#191c1e',
  onSurfaceVariant:       '#3d4a44',
  surfaceContainerLowest: '#ffffff',
  secondaryContainer:     '#c6e9c0',
  outlineVariant:         '#bccac2',
  ambientShadow:          '0 12px 32px rgba(25,28,30,0.05)',
};
 
// ─── SENDER COLOR PALETTE (group chats) ──────────────────────────────────────
const SENDER_COLORS = [
  '#0d7a5f', // teal-dark
  '#1a6ea8', // blue
  '#7c3aed', // violet
  '#b45309', // amber-dark
  '#be185d', // pink-dark
  '#0e7490', // cyan-dark
  '#15803d', // green-dark
  '#c2410c', // orange-dark
];
 
function getSenderColor(name) {
  if (!name) return SENDER_COLORS[0];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return SENDER_COLORS[hash % SENDER_COLORS.length];
}
 
// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
 
function StatusIcon({ status }) {
  const grey   = C.onSurfaceVariant;
  const teal   = C.primaryContainer;
  switch (status) {
    case 'read':      return <CheckCheck size={14} color={teal} />;
    case 'delivered': return <CheckCheck size={14} color={grey} style={{ opacity: 0.55 }} />;
    case 'sent':      return <Check      size={14} color={grey} style={{ opacity: 0.55 }} />;
    case 'sending':   return <Check      size={14} color={grey} style={{ opacity: 0.3  }} />;
    default:          return <Check      size={14} color={grey} style={{ opacity: 0.55 }} />;
  }
}
 
function ReplyPreview({ replyTo, isMine, senderColorFn }) {
  const senderColor = senderColorFn(replyTo.sender?.displayName);
  return (
    <div style={{
      background: isMine
        ? 'rgba(0,107,83,0.09)'
        : 'rgba(25,28,30,0.06)',
      borderLeft: `3px solid ${senderColor}`,
      borderRadius: '6px',
      padding: '5px 10px',
      marginBottom: '6px',
      cursor: 'pointer',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = isMine ? 'rgba(0,107,83,0.14)' : 'rgba(25,28,30,0.1)'}
    onMouseLeave={e => e.currentTarget.style.background = isMine ? 'rgba(0,107,83,0.09)' : 'rgba(25,28,30,0.06)'}
    >
      <p style={{
        fontSize: '11.5px',
        fontWeight: 600,
        color: senderColor,
        margin: '0 0 2px',
        lineHeight: 1.2,
      }}>
        {replyTo.sender?.displayName || 'Unknown'}
      </p>
      <p style={{
        fontSize: '12.5px',
        color: C.onSurfaceVariant,
        margin: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        opacity: 0.85,
        lineHeight: 1.3,
      }}>
        {replyTo.content || 'Media'}
      </p>
    </div>
  );
}
 
// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MessageBubble({ message, isMine, isGroup }) {
  const navigate = useNavigate();
 
  // ── System message ──
  if (message.type === 'system') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
        <span style={{
          background: 'rgba(255,255,255,0.92)',
          color: C.onSurfaceVariant,
          fontSize: '12px',
          padding: '5px 14px',
          borderRadius: '999px',
          boxShadow: '0 1px 4px rgba(25,28,30,0.09)',
          fontStyle: 'italic',
          textAlign: 'center',
        }}>
          {message.content}
        </span>
      </div>
    );
  }
 
  // ── Deleted message ──
  if (message.deletedForEveryone) {
    return (
      <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '3px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.75)',
          color: C.onSurfaceVariant,
          fontSize: '13px',
          fontStyle: 'italic',
          padding: '8px 14px',
          borderRadius: '12px',
          borderBottomLeftRadius: isMine ? '12px' : '2px',
          borderBottomRightRadius: isMine ? '2px' : '12px',
          boxShadow: C.ambientShadow,
          opacity: 0.8,
        }}>
          <span style={{ marginRight: '5px' }}>🚫</span>This message was deleted
        </div>
      </div>
    );
  }
 
  // ── Helpers ──
  function formatTime(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
 
  const senderName = (isGroup && !isMine) ? (message.sender?.displayName || 'Unknown') : null;
  const senderColor = senderName ? getSenderColor(senderName) : C.primary;
  const time = formatTime(message.createdAt);
 
  // ── Bubble shape ──
  const bubbleBase = {
    position: 'relative',
    padding: '9px 13px 8px',
    borderRadius: '12px',
    boxShadow: C.ambientShadow,
    maxWidth: '100%',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  };
 
  const sentStyle = {
    ...bubbleBase,
    background: C.secondaryContainer,
    borderBottomRightRadius: '2px',
  };
 
  const receivedStyle = {
    ...bubbleBase,
    background: C.surfaceContainerLowest,
    borderBottomLeftRadius: '2px',
  };
 
  return (
    <div style={{
      display: 'flex',
      justifyContent: isMine ? 'flex-end' : 'flex-start',
      width: '100%',
    }}>
      {/* Width cap: 70% sent, 65% received */}
      <div style={{ maxWidth: isMine ? '70%' : '65%' }}>
        <div style={isMine ? sentStyle : receivedStyle}>
 
          {/* Sender name (group, received only) */}
          {senderName && (
            <p 
              onClick={() => {
                const senderId = message.sender?._id || message.sender;
                if (senderId) navigate(`/user/${senderId}`);
              }}
              style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: senderColor,
              margin: '0 0 3px',
              lineHeight: 1.2,
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              {senderName}
            </p>
          )}
 
          {/* Reply-to preview */}
          {message.replyTo && (
            <ReplyPreview
              replyTo={message.replyTo}
              isMine={isMine}
              senderColorFn={getSenderColor}
            />
          )}
 
          {/* Message content + time+status inline */}
          {/*
            The spacer trick: we append a right-float ghost element whose
            width matches the time+status strip so text naturally wraps
            around it, keeping the strip on the same last line when it fits,
            or pushing to a new line when it doesn't — exactly like WhatsApp.
          */}
          <span style={{
            fontSize: '14px',
            color: C.onSurface,
            lineHeight: '1.5',
          }}>
            {message.content}
            {/* Invisible spacer so last line has room for the timestamp */}
            <span style={{
              display: 'inline-block',
              width: isMine ? '72px' : '44px',
              height: '1px',
            }} />
          </span>
 
          {/* Timestamp + status — absolutely pinned bottom-right */}
          <div style={{
            position: 'absolute',
            bottom: '7px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            lineHeight: 1,
            pointerEvents: 'none',
          }}>
            <span style={{
              fontSize: '10px',
              color: C.onSurfaceVariant,
              opacity: 0.65,
              whiteSpace: 'nowrap',
            }}>
              {time}
            </span>
            {isMine && <StatusIcon status={message.status} />}
          </div>
 
        </div>
      </div>
    </div>
  );
}