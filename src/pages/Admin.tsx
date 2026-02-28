import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  capacity: number;
  price: number;
  status: string;
  created_at: string;
}

interface Order {
  id: string;
  user_id: string;
  event_id: string;
  quantity: number;
  total_amount: number;
  status: string;
  created_at: string;
  profiles?: { full_name: string; email: string };
  events?: { title: string };
}

type Tab = 'overview' | 'events' | 'users' | 'orders';

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: '24px 28px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: 3,
        background: accent,
      }} />
      <p style={{ color: '#888', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>{label}</p>
      <p style={{ fontSize: 36, fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'DM Mono', monospace" }}>{value}</p>
      {sub && <p style={{ color: '#666', fontSize: 12, margin: '6px 0 0' }}>{sub}</p>}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active:    { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80' },
    published: { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80' },
    confirmed: { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80' },
    completed: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
    cancelled: { bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
    pending:   { bg: 'rgba(234,179,8,0.15)',  color: '#facc15' },
    draft:     { bg: 'rgba(100,116,139,0.15)',color: '#94a3b8' },
    admin:     { bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
    user:      { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  };
  const s = map[status?.toLowerCase()] ?? map.draft;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
      padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase',
    }}>{status}</span>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function Admin() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  const [users, setUsers]   = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  // modal states
  const [eventModal, setEventModal] = useState<Partial<Event> | null>(null);
  const [saving, setSaving] = useState(false);

  // filters
  const [userSearch, setUserSearch]   = useState('');
  const [orderFilter, setOrderFilter] = useState('all');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [u, e, o] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*').order('date', { ascending: true }),
      supabase.from('orders').select('*, profiles(full_name, email), events(title)').order('created_at', { ascending: false }),
    ]);
    if (u.data) setUsers(u.data);
    if (e.data) setEvents(e.data);
    if (o.data) setOrders(o.data as Order[]);
    setLoading(false);
  };

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── User role toggle ───────────────────────────────────────────────────────
  const toggleRole = async (id: string, current: string) => {
    const next = current === 'admin' ? 'user' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: next }).eq('id', id);
    if (error) return showToast('Failed to update role', 'err');
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: next } : u));
    showToast(`Role updated to ${next}`);
  };

  // ── Event save ─────────────────────────────────────────────────────────────
  const saveEvent = async () => {
    if (!eventModal) return;
    setSaving(true);
    const { id, created_at, ...fields } = eventModal as Event;
    let error;
    if (id) {
      ({ error } = await supabase.from('events').update(fields).eq('id', id));
    } else {
      ({ error } = await supabase.from('events').insert({ ...fields, status: fields.status || 'draft' }));
    }
    setSaving(false);
    if (error) return showToast('Failed to save event', 'err');
    showToast(id ? 'Event updated' : 'Event created');
    setEventModal(null);
    fetchAll();
  };

  // ── Event delete ───────────────────────────────────────────────────────────
  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return showToast('Failed to delete event', 'err');
    showToast('Event deleted');
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // ── Order status update ────────────────────────────────────────────────────
  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) return showToast('Failed to update order', 'err');
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    showToast('Order updated');
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalRevenue = orders
    .filter(o => o.status === 'confirmed' || o.status === 'completed')
    .reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const activeEvents  = events.filter(e => e.status === 'published' || e.status === 'active').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const filteredUsers  = users.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);

  if (!isAdmin) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#666' }}>
      <p style={{ fontSize: 18 }}>Access denied — admins only.</p>
    </div>
  );

  // ── Styles ─────────────────────────────────────────────────────────────────
  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#e2e8f0',
    fontFamily: "'Sora', 'DM Sans', sans-serif",
    padding: '0 0 80px',
  };
  const header: React.CSSProperties = {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '28px 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.01)',
  };
  const tabBar: React.CSSProperties = {
    display: 'flex',
    gap: 4,
    padding: '16px 40px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  };
  const content: React.CSSProperties = { padding: '36px 40px' };
  const table: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  };
  const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 14px',
    color: '#555',
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    fontWeight: 600,
  };
  const td: React.CSSProperties = {
    padding: '14px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    verticalAlign: 'middle',
  };
  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '9px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  };
  const btnGhost: React.CSSProperties = {
    background: 'transparent',
    color: '#888',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
  };
  const input: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 14,
    padding: '9px 14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };
  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    overflow: 'hidden',
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: '⬡  Overview' },
    { id: 'events',   label: '◈  Events' },
    { id: 'users',    label: '◎  Users' },
    { id: 'orders',   label: '◇  Orders' },
  ];

  return (
    <div style={page}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #444; }
        select option { background: #1a1a2e; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === 'ok' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: toast.type === 'ok' ? '#4ade80' : '#f87171',
          padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          backdropFilter: 'blur(12px)',
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={header}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
            Admin Console
          </h1>
          <p style={{ margin: '4px 0 0', color: '#555', fontSize: 13 }}>Event Booking System</p>
        </div>
        <button style={btnPrimary} onClick={fetchAll}>↻  Refresh</button>
      </div>

      {/* Tab bar */}
      <div style={tabBar}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? 'rgba(99,102,241,0.15)' : 'transparent',
            color: tab === t.id ? '#818cf8' : '#555',
            border: 'none',
            borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent',
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            letterSpacing: '0.02em',
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={content}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#444' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⟳</div>
            Loading data...
          </div>
        ) : (

          // ── OVERVIEW ────────────────────────────────────────────────────────
          tab === 'overview' ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
                <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString('en', { minimumFractionDigits: 2 })}`} sub="Confirmed + completed orders" accent="linear-gradient(90deg,#6366f1,#8b5cf6)" />
                <StatCard label="Total Users" value={users.length} sub={`${users.filter(u => u.role === 'admin').length} admins`} accent="linear-gradient(90deg,#06b6d4,#3b82f6)" />
                <StatCard label="Active Events" value={activeEvents} sub={`${events.length} total`} accent="linear-gradient(90deg,#10b981,#059669)" />
                <StatCard label="Pending Orders" value={pendingOrders} sub={`${orders.length} total`} accent="linear-gradient(90deg,#f59e0b,#ef4444)" />
              </div>

              {/* Recent orders */}
              <div style={card}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent Orders</h2>
                  <button style={btnGhost} onClick={() => setTab('orders')}>View all →</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={table}>
                    <thead>
                      <tr>
                        {['Customer', 'Event', 'Amount', 'Status', 'Date'].map(h => <th key={h} style={th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 6).map(o => (
                        <tr key={o.id}>
                          <td style={td}><span style={{ color: '#cbd5e1' }}>{o.profiles?.full_name ?? '—'}</span><br /><span style={{ color: '#555', fontSize: 12 }}>{o.profiles?.email}</span></td>
                          <td style={td}>{o.events?.title ?? '—'}</td>
                          <td style={{ ...td, fontFamily: "'DM Mono', monospace", color: '#a5f3fc' }}>${(o.total_amount ?? 0).toFixed(2)}</td>
                          <td style={td}><Badge status={o.status} /></td>
                          <td style={{ ...td, color: '#555', fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          // ── EVENTS ──────────────────────────────────────────────────────────
          ) : tab === 'events' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Events <span style={{ color: '#555', fontWeight: 400 }}>({events.length})</span></h2>
                <button style={btnPrimary} onClick={() => setEventModal({ status: 'draft' })}>+ New Event</button>
              </div>
              <div style={card}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={table}>
                    <thead>
                      <tr>
                        {['Title', 'Date', 'Location', 'Capacity', 'Price', 'Status', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(e => (
                        <tr key={e.id} style={{ transition: 'background 0.1s' }}>
                          <td style={{ ...td, fontWeight: 600, color: '#e2e8f0' }}>{e.title}</td>
                          <td style={{ ...td, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
                          <td style={{ ...td, color: '#94a3b8' }}>{e.location}</td>
                          <td style={{ ...td, fontFamily: "'DM Mono', monospace" }}>{e.capacity ?? '—'}</td>
                          <td style={{ ...td, fontFamily: "'DM Mono', monospace", color: '#a5f3fc' }}>${(e.price ?? 0).toFixed(2)}</td>
                          <td style={td}><Badge status={e.status} /></td>
                          <td style={td}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button style={{ ...btnGhost, color: '#818cf8' }} onClick={() => setEventModal(e)}>Edit</button>
                              <button style={{ ...btnGhost, color: '#f87171' }} onClick={() => deleteEvent(e.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          // ── USERS ───────────────────────────────────────────────────────────
          ) : tab === 'users' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Users <span style={{ color: '#555', fontWeight: 400 }}>({filteredUsers.length})</span></h2>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search name or email…" style={{ ...input, width: 240 }} />
              </div>
              <div style={card}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={table}>
                    <thead>
                      <tr>
                        {['Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td style={{ ...td, fontWeight: 600 }}>{u.full_name}</td>
                          <td style={{ ...td, color: '#94a3b8', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{u.email}</td>
                          <td style={td}><Badge status={u.role} /></td>
                          <td style={{ ...td, color: '#555', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                          <td style={td}>
                            <button style={{ ...btnGhost, color: u.role === 'admin' ? '#f87171' : '#c084fc' }} onClick={() => toggleRole(u.id, u.role)}>
                              {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          // ── ORDERS ──────────────────────────────────────────────────────────
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Orders <span style={{ color: '#555', fontWeight: 400 }}>({filteredOrders.length})</span></h2>
                <select value={orderFilter} onChange={e => setOrderFilter(e.target.value)} style={{ ...input, width: 160 }}>
                  {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div style={card}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={table}>
                    <thead>
                      <tr>
                        {['Customer', 'Event', 'Qty', 'Amount', 'Status', 'Date', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(o => (
                        <tr key={o.id}>
                          <td style={td}><span style={{ color: '#cbd5e1' }}>{o.profiles?.full_name ?? '—'}</span><br /><span style={{ color: '#555', fontSize: 12 }}>{o.profiles?.email}</span></td>
                          <td style={td}>{o.events?.title ?? '—'}</td>
                          <td style={{ ...td, fontFamily: "'DM Mono', monospace" }}>{o.quantity}</td>
                          <td style={{ ...td, fontFamily: "'DM Mono', monospace", color: '#a5f3fc' }}>${(o.total_amount ?? 0).toFixed(2)}</td>
                          <td style={td}><Badge status={o.status} /></td>
                          <td style={{ ...td, color: '#555', fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString()}</td>
                          <td style={td}>
                            <select
                              value={o.status}
                              onChange={e => updateOrderStatus(o.id, e.target.value)}
                              style={{ ...input, width: 120, padding: '5px 10px', fontSize: 12 }}
                            >
                              {['pending', 'confirmed', 'completed', 'cancelled'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        ))}
      </div>

      {/* ── Event Modal ──────────────────────────────────────────────────────── */}
      {eventModal !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24,
        }} onClick={e => { if (e.target === e.currentTarget) setEventModal(null); }}>
          <div style={{
            background: '#111118',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: 32,
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700 }}>
              {(eventModal as Event).id ? 'Edit Event' : 'New Event'}
            </h2>

            {[
              { label: 'Title',    key: 'title',    type: 'text' },
              { label: 'Date',     key: 'date',     type: 'datetime-local' },
              { label: 'Location', key: 'location', type: 'text' },
              { label: 'Capacity', key: 'capacity', type: 'number' },
              { label: 'Price ($)',key: 'price',    type: 'number' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={(eventModal as any)[f.key] ?? ''}
                  onChange={e => setEventModal(prev => ({ ...prev!, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
                  style={input}
                />
              </div>
            ))}

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status</label>
              <select
                value={eventModal.status ?? 'draft'}
                onChange={e => setEventModal(prev => ({ ...prev!, status: e.target.value }))}
                style={input}
              >
                {['draft', 'published', 'active', 'completed', 'cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={btnGhost} onClick={() => setEventModal(null)}>Cancel</button>
              <button style={btnPrimary} onClick={saveEvent} disabled={saving}>
                {saving ? 'Saving…' : 'Save Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}