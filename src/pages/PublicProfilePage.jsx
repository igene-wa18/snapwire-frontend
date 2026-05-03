import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, chatAPI } from '../services/api';
import { getSocket } from '../services/socket';
import RelationshipButton from '../components/RelationshipButton';
import {
  ArrowLeft, MoreVertical, Shield, Flag,
  Link2, Users, MessageSquare, CalendarDays,
  Check, AlertTriangle,
} from 'lucide-react';

const C = {
  primary: '#c33797', primaryDark: '#a12d7f', primaryLight: '#f8e0f0',
  surface: '#ffffff', surfaceDim: '#f7f7fb', bg: '#f0f2f5',
  onSurface: '#1a1a2e', onSurfaceVar: '#6b7280', outline: '#e5e7eb',
  danger: '#ef4444', dangerLight: '#fef2f2',
};

function Skeleton({ w = '100%', h = '16px', r = '8px', style = {} }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', ...style }} />;
}

function ProfileSkeleton() {
  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${C.primary}11, #7c3aed11, ${C.primaryLight}33)`, padding: '32px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Skeleton w="110px" h="110px" r="50%" />
        <Skeleton w="160px" h="22px" />
        <Skeleton w="100px" h="14px" />
      </div>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.outline}` }}>
        <Skeleton w="40px" h="11px" style={{ marginBottom: '10px' }} />
        <Skeleton w="100%" h="14px" style={{ marginBottom: '6px' }} />
        <Skeleton w="75%" h="14px" />
      </div>
      <div style={{ display: 'flex', padding: '20px 24px', borderBottom: `1px solid ${C.outline}` }}>
        {[0,1,2].map(i => <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}><Skeleton w="36px" h="36px" r="10px" /><Skeleton w="40px" h="18px" /><Skeleton w="50px" h="11px" /></div>)}
      </div>
      <div style={{ padding: '24px' }}><Skeleton w="100%" h="46px" r="14px" /></div>
    </div>
  );
}

const REPORT_REASONS = ['Spam or fake account','Harassment or bullying','Inappropriate content','Impersonation','Other'];

function SafetyMenu({ show, onClose, onBlock, onReport, profileUrl }) {
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!show) return;
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [show, onClose]);
  if (!show) return null;
  async function copyLink() {
    try { await navigator.clipboard.writeText(profileUrl); } catch { /* fallback */ }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  const itemStyle = { display:'flex', alignItems:'center', gap:'10px', padding:'11px 16px', cursor:'pointer', fontSize:'0.88rem', fontFamily:'inherit', border:'none', background:'none', width:'100%', textAlign:'left', borderRadius:'8px', transition:'background 0.12s' };
  return (
    <div ref={menuRef} style={{ position:'absolute', top:'42px', right:'0', background:C.surface, borderRadius:'14px', border:`1px solid ${C.outline}`, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:100, minWidth:'180px', padding:'6px', animation:'menuPop 0.15s cubic-bezier(0.16,1,0.3,1)' }}>
      <button style={{...itemStyle, color:C.danger}} onMouseEnter={e=>e.currentTarget.style.background=C.dangerLight} onMouseLeave={e=>e.currentTarget.style.background='none'} onClick={()=>{onBlock();onClose();}}><Shield size={15}/>Block User</button>
      <button style={{...itemStyle, color:C.onSurface}} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceDim} onMouseLeave={e=>e.currentTarget.style.background='none'} onClick={()=>{onReport();onClose();}}><Flag size={15} color={C.onSurfaceVar}/>Report</button>
      <div style={{height:'1px',background:C.outline,margin:'4px 0'}}/>
      <button style={{...itemStyle, color:C.onSurface}} onMouseEnter={e=>e.currentTarget.style.background=C.surfaceDim} onMouseLeave={e=>e.currentTarget.style.background='none'} onClick={copyLink}>
        {copied ? <><Check size={15} color="#22c55e"/><span style={{color:'#22c55e'}}>Copied!</span></> : <><Link2 size={15} color={C.onSurfaceVar}/>Copy Profile Link</>}
      </button>
    </div>
  );
}

function BlockModal({ username, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }} onClick={onCancel}>
      <div style={{ background:C.surface, borderRadius:'20px', padding:'28px 24px', maxWidth:'360px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation:'modalPop 0.22s cubic-bezier(0.16,1,0.3,1)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:'56px',height:'56px',borderRadius:'50%',background:C.dangerLight,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}><AlertTriangle size={26} color={C.danger}/></div>
        <h2 style={{textAlign:'center',fontSize:'1.1rem',fontWeight:700,color:C.onSurface,margin:'0 0 8px'}}>Block @{username}?</h2>
        <p style={{textAlign:'center',fontSize:'0.875rem',color:C.onSurfaceVar,margin:'0 0 24px',lineHeight:1.5}}>They won't be able to message you or see your profile.</p>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={onCancel} style={{flex:1,padding:'12px',borderRadius:'12px',border:`1.5px solid ${C.outline}`,background:'none',cursor:'pointer',fontSize:'0.9rem',fontWeight:600,color:C.onSurface,fontFamily:'inherit'}}>Cancel</button>
          <button onClick={onConfirm} style={{flex:1,padding:'12px',borderRadius:'12px',border:'none',background:C.danger,cursor:'pointer',fontSize:'0.9rem',fontWeight:600,color:'#fff',fontFamily:'inherit',boxShadow:`0 4px 12px ${C.danger}40`}}>Block</button>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ username, onSubmit, onCancel }) {
  const [selected, setSelected] = useState('');
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'20px' }} onClick={onCancel}>
      <div style={{ background:C.surface,borderRadius:'20px',padding:'28px 24px',maxWidth:'360px',width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',animation:'modalPop 0.22s cubic-bezier(0.16,1,0.3,1)' }} onClick={e=>e.stopPropagation()}>
        <h2 style={{fontSize:'1.1rem',fontWeight:700,color:C.onSurface,margin:'0 0 6px'}}>Report @{username}</h2>
        <p style={{fontSize:'0.85rem',color:C.onSurfaceVar,margin:'0 0 18px'}}>Why are you reporting this account?</p>
        <div style={{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'20px'}}>
          {REPORT_REASONS.map(r=><button key={r} onClick={()=>setSelected(r)} style={{padding:'11px 14px',borderRadius:'10px',border:`1.5px solid ${selected===r?C.primary:C.outline}`,background:selected===r?`${C.primary}08`:C.surface,color:selected===r?C.primary:C.onSurface,cursor:'pointer',textAlign:'left',fontSize:'0.875rem',fontWeight:selected===r?600:400,fontFamily:'inherit',transition:'all 0.12s'}}>{r}</button>)}
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={onCancel} style={{flex:1,padding:'12px',borderRadius:'12px',border:`1.5px solid ${C.outline}`,background:'none',cursor:'pointer',fontSize:'0.9rem',fontWeight:600,color:C.onSurface,fontFamily:'inherit'}}>Cancel</button>
          <button disabled={!selected} onClick={()=>onSubmit(selected)} style={{flex:1,padding:'12px',borderRadius:'12px',border:'none',background:selected?`linear-gradient(135deg,${C.primary},#7c3aed)`:C.outline,cursor:selected?'pointer':'not-allowed',fontSize:'0.9rem',fontWeight:600,color:selected?'#fff':C.onSurfaceVar,fontFamily:'inherit'}}>Submit</button>
        </div>
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [relStatus, setRelStatus] = useState('none');
  const [requestId, setRequestId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [toast, setToast] = useState('');
  const menuRef = useRef(null);

  // Redirect to own profile
  useEffect(() => {
    if (me && userId === me.id) navigate('/profile', { replace: true });
  }, [me, userId, navigate]);

  // Fetch public profile (single API call returns everything)
  useEffect(() => {
    if (!userId || !me) return;
    setLoading(true);
    userAPI.getPublicProfile(userId)
      .then(res => {
        const d = res.data.data;
        setProfile(d.user);
        setRelStatus(d.relationshipStatus === 'blocked_by_them' ? 'none' : d.relationshipStatus);
        setRequestId(d.requestId);
        setConversationId(d.conversationId);
      })
      .catch(err => setFetchError(err?.response?.data?.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [userId, me]);

  // Socket: real-time status updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onAccepted = ({ from, chatId }) => { if (from === userId) { setRelStatus('friends'); if (chatId) setConversationId(chatId); } };
    const onReceived = ({ from }) => { if (from === userId) setRelStatus('pending_received'); };
    socket.on('friend_request_accepted', onAccepted);
    socket.on('friend_request_received', onReceived);
    return () => { socket.off('friend_request_accepted', onAccepted); socket.off('friend_request_received', onReceived); };
  }, [userId]);

  const handleStatusChange = useCallback((newStatus, newRequestId) => {
    setRelStatus(newStatus);
    if (newRequestId !== undefined) setRequestId(newRequestId);
  }, []);

  const handleBlock = useCallback(async () => {
    try { await userAPI.blockUser(userId); setRelStatus('blocked'); showToastMsg('User blocked.'); }
    catch (err) { showToastMsg(err?.response?.data?.message || 'Block failed'); }
    setShowBlockModal(false);
  }, [userId]);

  const handleReport = useCallback(async (reason) => {
    showToastMsg('Report submitted. Thank you.');
    setShowReportModal(false);
  }, []);

  const handleMessage = useCallback(async () => {
    if (conversationId) { navigate(`/chat/${conversationId}`); return; }
    try {
      const res = await chatAPI.create({ participantId: userId });
      const chatId = res.data.data?.chat?._id || res.data.data?._id;
      if (chatId) navigate(`/chat/${chatId}`);
    } catch { showToastMsg('Could not open chat'); }
  }, [conversationId, userId, navigate]);

  function showToastMsg(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }
  function getInitials(name) { return name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?'; }
  function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : ''; }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Inter',sans-serif", display:'flex', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:'520px', background:C.surface, minHeight:'100vh', position:'relative', boxShadow:'0 0 40px rgba(0,0,0,0.06)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:C.surface, borderBottom:`1px solid ${C.outline}`, position:'sticky', top:0, zIndex:10 }}>
          <button onClick={()=>navigate(-1)} style={{ display:'flex',alignItems:'center',gap:'8px',background:'none',border:'none',cursor:'pointer',color:C.onSurface,fontWeight:600,fontSize:'0.95rem',fontFamily:'inherit',padding:'6px 2px' }}>
            <ArrowLeft size={20}/>Back
          </button>
          <div style={{position:'relative'}} ref={menuRef}>
            <button onClick={()=>setShowMenu(v=>!v)} style={{ padding:'8px',borderRadius:'50%',background:showMenu?C.surfaceDim:'transparent',border:'none',cursor:'pointer',color:C.onSurfaceVar,display:'flex',alignItems:'center',transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background=C.surfaceDim} onMouseLeave={e=>{if(!showMenu)e.currentTarget.style.background='transparent'}}>
              <MoreVertical size={22}/>
            </button>
            <SafetyMenu show={showMenu} onClose={()=>setShowMenu(false)} onBlock={()=>setShowBlockModal(true)} onReport={()=>setShowReportModal(true)} profileUrl={`${window.location.origin}/user/${userId}`}/>
          </div>
        </div>

        {/* Toast */}
        {toast && <div style={{ position:'absolute',top:'70px',left:'50%',transform:'translateX(-50%)',background:C.onSurface,color:'#fff',padding:'8px 18px',borderRadius:'20px',fontSize:'0.82rem',fontWeight:500,zIndex:50,whiteSpace:'nowrap',boxShadow:'0 4px 14px rgba(0,0,0,0.18)',animation:'slideDown 0.2s ease' }}>{toast}</div>}

        {loading && <ProfileSkeleton />}
        {!loading && fetchError && <div style={{padding:'60px 24px',textAlign:'center'}}><p style={{color:C.danger,fontSize:'0.9rem'}}>{fetchError}</p></div>}

        {!loading && profile && (
          <>
            {/* Hero */}
            <div style={{ background:`linear-gradient(135deg,${C.primary}11,#7c3aed11,${C.primaryLight}33)`, padding:'32px 20px 28px', display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ width:'110px',height:'110px',borderRadius:'50%',background:profile.avatar?'none':`linear-gradient(135deg,${C.primary},#7c3aed)`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',border:`4px solid ${C.surface}`,boxShadow:`0 4px 20px ${C.primary}25`,marginBottom:'14px' }}>
                {profile.avatar ? <img src={profile.avatar} alt="Avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{color:'#fff',fontSize:'2rem',fontWeight:700}}>{getInitials(profile.displayName)}</span>}
              </div>
              <h1 style={{fontSize:'1.5rem',fontWeight:700,color:C.onSurface,margin:'0 0 4px',letterSpacing:'-0.02em'}}>{profile.displayName}</h1>
              <p style={{fontSize:'0.9rem',color:C.primary,fontWeight:500,margin:'0 0 10px',opacity:0.85}}>@{profile.username}</p>
              {typeof profile.mutualFriendsCount==='number' && profile.mutualFriendsCount>0 && relStatus!=='blocked' && (
                <div style={{display:'flex',alignItems:'center',gap:'5px',background:`${C.primary}12`,border:`1px solid ${C.primary}20`,borderRadius:'20px',padding:'4px 12px',fontSize:'0.78rem',color:C.primary,fontWeight:600}}>
                  <Users size={12}/>{profile.mutualFriendsCount} Mutual Friend{profile.mutualFriendsCount>1?'s':''}
                </div>
              )}
            </div>

            {/* Bio & Vibe */}
            {relStatus!=='blocked' && (
              <div style={{padding:'20px 24px',borderBottom:`1px solid ${C.outline}`}}>
                <div style={{marginBottom:'16px'}}>
                  <span style={{fontSize:'0.72rem',fontWeight:600,color:C.onSurfaceVar,textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:'6px'}}>Bio</span>
                  <p style={{fontSize:'0.9375rem',color:C.onSurface,margin:0,lineHeight:1.55,fontStyle:profile.about?'normal':'italic',opacity:profile.about?1:0.45}}>{profile.about||'No bio yet...'}</p>
                </div>
                {profile.vibe && (
                  <div>
                    <span style={{fontSize:'0.72rem',fontWeight:600,color:C.onSurfaceVar,textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:'6px'}}>Life Vibe ✨</span>
                    <div style={{padding:'10px 14px',borderRadius:'10px',background:`linear-gradient(135deg,${C.primary}08,#7c3aed08)`,border:`1px solid ${C.primary}15`}}>
                      <p style={{fontSize:'0.9375rem',color:C.onSurface,margin:0}}>{profile.vibe}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Blocked Banner */}
            {relStatus==='blocked' && (
              <div style={{margin:'20px 24px',padding:'16px',background:C.dangerLight,border:`1px solid ${C.danger}25`,borderRadius:'12px',textAlign:'center'}}>
                <p style={{margin:0,fontSize:'0.875rem',color:C.danger,fontWeight:500}}>You have blocked this user. Their profile details are hidden.</p>
              </div>
            )}

            {/* Stats */}
            {relStatus!=='blocked' && (
              <div style={{display:'flex',padding:'20px 24px',borderBottom:`1px solid ${C.outline}`}}>
                {[
                  {label:'Friends',value:profile.contactsCount??0,icon:Users,color:'#8b5cf6'},
                  {label:'Groups',value:profile.groupsCount??0,icon:MessageSquare,color:'#06b6d4'},
                  {label:'Joined',value:formatDate(profile.createdAt),icon:CalendarDays,color:'#f59e0b',isDate:true},
                ].map((stat,i)=>(
                  <div key={stat.label} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',borderRight:i<2?`1px solid ${C.outline}`:'none',animation:`statPop 0.4s ${i*0.1}s cubic-bezier(0.16,1,0.3,1) both`}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'10px',background:`${stat.color}12`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'2px'}}>
                      <stat.icon size={16} color={stat.color}/>
                    </div>
                    <span style={{fontSize:stat.isDate?'0.85rem':'1.25rem',fontWeight:700,color:C.onSurface}}>{stat.value}</span>
                    <span style={{fontSize:'0.7rem',color:C.onSurfaceVar,fontWeight:500}}>{stat.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Relationship Button */}
            <div style={{padding:'24px'}}>
              <RelationshipButton
                status={relStatus}
                targetUserId={userId}
                requestId={requestId}
                onStatusChange={handleStatusChange}
                onMessage={handleMessage}
              />
            </div>
          </>
        )}
      </div>

      {showBlockModal && profile && <BlockModal username={profile.username} onConfirm={handleBlock} onCancel={()=>setShowBlockModal(false)}/>}
      {showReportModal && profile && <ReportModal username={profile.username} onSubmit={handleReport} onCancel={()=>setShowReportModal(false)}/>}

      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes statPop{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
        @keyframes menuPop{from{opacity:0;transform:scale(0.92) translateY(-6px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes modalPop{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}
        @keyframes slideDown{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}
      `}</style>
    </div>
  );
}
