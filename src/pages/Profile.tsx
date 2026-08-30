import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar, Edit3, Check, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing]     = useState(false);
  const [fullName, setFullName]   = useState(profile?.full_name ?? '');
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [nameFocused, setNameFocused] = useState(false);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveProfile = async () => {
    if (!user) return;
    if (!fullName.trim()) return showToast('Name cannot be empty', 'err');
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id);
    setSaving(false);
    if (error) return showToast('Failed to update profile', 'err');
    showToast('Profile updated');
    setEditing(false);
    // reload page to sync AuthContext profile
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = (profile?.full_name ?? user?.email ?? '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  //  Styles
  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#e2e8f0',
    fontFamily: "'Sora', 'DM Sans', sans-serif",
    padding: '0 0 80px',
  };
  const input: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: nameFocused ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#e2e8f0',
    fontSize: 15,
    padding: '11px 14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
    fontFamily: "'Sora', sans-serif",
  };
  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', border: 'none', borderRadius: 10,
    padding: '10px 20px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
  };
  const btnGhost: React.CSSProperties = {
    background: 'transparent', color: '#666',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '10px 20px',
    fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
  };

  return (
    <div style={page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #333; }
      `}</style>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
            background: toast.type === 'ok' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'ok' ? '#4ade80' : '#f87171',
            padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            backdropFilter: 'blur(12px)',
          }}
        >{toast.msg}</motion.div>
      )}

      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.01)',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
            My Profile
          </h1>
          <p style={{ margin: '4px 0 0', color: '#444', fontSize: 13 }}>Manage your account details</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSignOut}
          style={{ ...btnGhost, color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}
        >
          <LogOut size={14} /> Sign out
        </motion.button>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>

        {/*  Avatar + name card  */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20,
            padding: '32px',
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: isAdmin
              ? 'linear-gradient(90deg, #a855f7, #6366f1)'
              : 'linear-gradient(90deg, #6366f1, #06b6d4)',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: isAdmin
                ? 'linear-gradient(135deg, #a855f7, #6366f1)'
                : 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: '#fff',
              flexShrink: 0,
              boxShadow: isAdmin
                ? '0 0 24px rgba(168,85,247,0.3)'
                : '0 0 24px rgba(99,102,241,0.3)',
            }}>
              {initials}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
                  {profile?.full_name || 'No name set'}
                </h2>
                {/* Role badge */}
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20,
                  background: isAdmin ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)',
                  color: isAdmin ? '#c084fc' : '#60a5fa',
                  border: isAdmin ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(59,130,246,0.3)',
                }}>
                  {isAdmin ? '⬡ Admin' : '◎ User'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#555', fontFamily: "'DM Mono', monospace" }}>
                {user?.email}
              </p>
            </div>

            {/* Edit toggle */}
            {!editing && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setEditing(true); setFullName(profile?.full_name ?? ''); }}
                style={btnGhost}
              >
                <Edit3 size={13} /> Edit
              </motion.button>
            )}
          </div>

          {/* Edit form */}
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: 24,
              }}
            >
              <label style={{ display: 'block', fontSize: 11, color: '#555', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Full Name
              </label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="Your full name"
                style={input}
                onKeyDown={e => { if (e.key === 'Enter') saveProfile(); if (e.key === 'Escape') setEditing(false); }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
                <motion.button whileTap={{ scale: 0.95 }} style={btnGhost} onClick={() => setEditing(false)}>
                  <X size={13} /> Cancel
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} style={btnPrimary} onClick={saveProfile} disabled={saving}>
                  <Check size={13} /> {saving ? 'Saving…' : 'Save'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/*  Info cards  */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}
        >
          {[
            { icon: <Mail size={14} color="#6366f1" />, label: 'Email', value: user?.email ?? '—' },
            { icon: <Calendar size={14} color="#8b5cf6" />, label: 'Member since', value: joinedDate },
            { icon: <Shield size={14} color={isAdmin ? '#c084fc' : '#60a5fa'} />, label: 'Role', value: isAdmin ? 'Administrator' : 'User' },
            { icon: <User size={14} color="#06b6d4" />, label: 'User ID', value: user?.id ? user.id.slice(0, 8) + '…' : '—' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                {item.icon}
                <span style={{ fontSize: 11, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {item.label}
                </span>
              </div>
              <p style={{
                margin: 0, fontSize: 13, color: '#cbd5e1',
                fontFamily: item.label === 'User ID' || item.label === 'Email' ? "'DM Mono', monospace" : 'inherit',
                wordBreak: 'break-all',
              }}>
                {item.value}
              </p>
            </div>
          ))}
        </motion.div>

        {/*  Admin quick link  */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin')}
              style={{
                width: '100%',
                background: 'rgba(168,85,247,0.08)',
                border: '1px solid rgba(168,85,247,0.2)',
                borderRadius: 14,
                padding: '18px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', color: '#c084fc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={16} color="#c084fc" />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Admin Console</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7c3aed' }}>Manage events, users & bookings</p>
                </div>
              </div>
              <span style={{ fontSize: 16, opacity: 0.6 }}>→</span>
            </motion.button>
          </motion.div>
        )}

        {/*  My bookings quick link */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: isAdmin ? 0.3 : 0.2 }}
          style={{ marginTop: 12 }}
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%',
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 14,
              padding: '18px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', color: '#818cf8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Calendar size={16} color="#818cf8" />
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>My Bookings</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#4338ca' }}>View and manage your event bookings</p>
              </div>
            </div>
            <span style={{ fontSize: 16, opacity: 0.6 }}>→</span>
          </motion.button>
        </motion.div>

      </div>
    </div>
  );
}