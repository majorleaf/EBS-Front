import { useState, useEffect } from 'react';                                                                                                                                                           
    import { supabase } from '../lib/supabase';                                                                                                                                                            
    import { useAuth } from '../contexts/AuthContext';                                                                                                                                                     
    import type { Database } from '../lib/database.types';                                                                                                                                                 
                                                                                                                                                                                                           
    // ── Types derived directly from Supabase schema ──────────────────────────────                                                                                                                       
    type Profile = Database['public']['Tables']['profiles']['Row'];                                                                                                                                        
    type Event = Database['public']['Tables']['events']['Row'];                                                                                                                                            
    type Booking = Database['public']['Tables']['bookings']['Row'];                                                                                                                                        
                                                                                                                                                                                                           
    interface BookingWithDetails extends Booking {                                                                                                                                                         
      profile?: Profile | null;                                                                                                                                                                            
      event?: Event | null;                                                                                                                                                                                
    }                                                                                                                                                                                                      
                                                                                                                                                                                                           
    type Tab = 'overview' | 'events' | 'users' | 'orders';                                                                                                                                                 
                                                                                                                                                                                                           
    // ── Stat Card ─                                                                                                                      
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
                                                                                                                                                                                                           
    // ── Badge 
    function Badge({ status }: { status: string | null }) {                                                                                                                                                
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
      const s = map[status?.toLowerCase() ?? ''] ?? map.draft;                                                                                                                                             
      return (                                                                                                                                                                                             
        <span style={{                                                                                                                                                                                     
          background: s.bg,
           color: s.color,                                                                                                                                                                
          fontSize: 11,
           fontWeight: 600,
            letterSpacing: '0.06em',                                                                                                                                          
          padding: '3px 10px',
           borderRadius: 20,
            textTransform: 'uppercase',                                                                                                                               
        }}
        >
          {status ?? 'draft'}
          </span>                                                                                                                                                                      
      );                                                                                                                                                                                                   
    }                                                                                                                                                                                                      
                                                                                                                                                                                                           
    // Helper to format date for datetime-local input                                                                                                                       
    function formatDateForInput(isoDate: string | null | undefined): string {                                                                                                                              
      if (!isoDate) return '';                                                                                                                                                                             
      try {                                                                                                                                                                                                
        const d = new Date(isoDate);                                                                                                                                                                       
        if (isNaN(d.getTime())) return '';                                                                                                                                                                 
        const pad = (n: number) => n.toString().padStart(2, '0');                                                                                                                                          
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;                                                                              
      } catch {                                                                                                                                                                                            
        return '';                                                                                                                                                                                         
      }                                                                                                                                                                                                    
    }                                                                                                                                                                                                      
                                                                                                                                                                                                           
    //  Main Admin Component
    export function Admin() {                                                                                                                                                                              
      const { user, isAdmin, loading: authLoading } = useAuth();                                                                                                                                           
      const [tab, setTab] = useState<Tab>('overview');                                                                                                                                                     
                                                                                                                                                                                                           
      const [users, setUsers]       = useState<Profile[]>([]);                                                                                                                                             
      const [events, setEvents]     = useState<Event[]>([]);                                                                                                                                               
      const [bookings, setBookings] = useState<BookingWithDetails[]>([]);                                                                                                                                  
      const [loading, setLoading]   = useState(true); 
      
      //small tranient success/error message shown bottom-right.
      const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);                                                                                                          
                                                                                                                                                                                                           
      // modal states = event create/edit modal: null= closed, object = open with these values                                                                                                                                                                                 
      const [eventModal, setEventModal] = useState<Partial<Event> | null>(null);                                                                                                                           
      const [saving, setSaving] = useState(false);                                                                                                                                                         
                                                                                                                                                                                                           
      // filters for the users and booking tabs                                                                                                                                                                                    
      const [userSearch, setUserSearch]     = useState('');                                                                                                                                                
      const [orderFilter, setOrderFilter]   = useState('all');                                                                                                                                             
                                                                                                                                                                                                           
      const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {                                                                                                                                      
        setToast({ msg, type });                                                                                                                                                                           
        setTimeout(() => setToast(null), 3000);                                                                                                                                                            
      };                                                                                                                                                                                                   
                             
      //Loads users, events, and bookings in parallel, then stiches bookings
      // together with their related profile/event client-side. This sidesteps
      // relying on a PostgREST foreign-key relationship existing/being named
      //exactly as expected.
      const fetchAll = async () => {                                                                                                                                                                       
        setLoading(true);                                                                                                                                                                                  
        try {                                                                                                                                                                                              
          const [uRes, eRes, bRes] = await Promise.all([                                                                                                                                                   
            supabase.from('profiles').select('*').order('created_at', { ascending: false }),                                                                                                               
            supabase.from('events').select('*').order('event_date', { ascending: true }),                                                                                                                  
            supabase.from('bookings').select('*').order('created_at', { ascending: false }),                                                                                                               
          ]);                                                                                                                                                                                              
                                                                                                                                                                                                           
          const profilesData = uRes.data ?? [];                                                                                                                                                            
          const eventsData = eRes.data ?? [];                                                                                                                                                              
          const bookingsData = bRes.data ?? [];                                                                                                                                                            
                                                                                                                                                                                                           
          setUsers(profilesData);                                                                                                                                                                          
          setEvents(eventsData);                                                                                                                                                                           
                                                                                                                                                                                                           
          // Build lookup maps once , then join in-memory rather than one query per row                                                                                                               
          const profilesMap = new Map(profilesData.map(p => [p.id, p]));                                                                                                                                   
          const eventsMap = new Map(eventsData.map(e => [String(e.id), e]));                                                                                                                               
                                                                                                                                                                                                           
          const enrichedBookings: BookingWithDetails[] = bookingsData.map(b => ({                                                                                                                          
            ...b,                                                                                                                                                                                          
            profile: b.user_id ? profilesMap.get(b.user_id) : undefined,                                                                                                                                   
            event: b.event_id ? eventsMap.get(String(b.event_id)) : undefined,                                                                                                                             
          }));                                                                                                                                                                                             
                                                                                                                                                                                                           
          setBookings(enrichedBookings);                                                                                                                                                                   
        } catch (err) {                                                                                                                                                                                    
          console.error('Error fetching admin data:', err);                                                                                                                                                
          showToast('Failed to load data', 'err');                                                                                                                                                         
        } finally {                                                                                                                                                                                        
          setLoading(false);                                                                                                                                                                               
        }                                                                                                                                                                                                  
      };                                                                                                                                                                                                   
                                                                                                                                                                                                           
      useEffect(() => {                                                                                                                                                                                    
        if (isAdmin) {                                                                                                                                                                                     
          fetchAll();                                                                                                                                                                                      
        }                                                                                                                                                                                                  
      }, [isAdmin]);                                                                                                                                                                                       
                                                                                                                                                                                                           
      //  User role toggle
      const toggleRole = async (id: string, current: string | null) => {                                                                                                                                   
        if (user?.id === id && current === 'admin') {                                                                                                                                                      
          if (!confirm('Warning: You are removing admin privileges from your own account. Continue?')) {                                                                                                   
            return;                                                                                                                                                                                        
          }                                                                                                                                                                                                
        }                                                                                                                                                                                                  
        const next = current === 'admin' ? 'user' : 'admin';                                                                                                                                               
        const { error } = await supabase.from('profiles').update({ role: next }).eq('id', id);                                                                                                             
        if (error) return showToast('Failed to update role', 'err');                                                                                                                                       
        setUsers(prev => prev.map(u => (u.id === id ? { ...u, role: next } : u)));                                                                                                                         
        showToast(`Role updated to ${next}`);                                                                                                                                                              
      };                                                                                                                                                                                                   
                                                                                                                                                                                                           
      // Event save 
      const saveEvent = async () => {                                                                                                                                                                      
        if (!eventModal) return;                                                                                                                                                                           
        setSaving(true);                                                                                                                                                                                   
                                                                                                                                                                                                           
        try {                                                                                                                                                                                              
          const isEdit = typeof eventModal.id === 'number';                                                                                                                                                
                                                                                                                                                                                                           
          if (isEdit) {                                                                                                                                                                                    
            const { id, ...fields } = eventModal as Event;                                                                                                                                     
            const { error } = await supabase                                                                                                                                                               
              .from('events')                                                                                                                                                                              
              .update({                                                                                                                                                                                    
                title: fields.title,                                                                                                                                                                       
                descriptions: fields.description,                                                                                                                                                         
                event_date: fields.event_date ? new Date(fields.event_date).toISOString() : null,                                                                                                          
                location: fields.location,                                                                                                                                                                 
                capacity: fields.capacity,                                                                                                                                                                 
                availabla_seats: fields.available_seats ?? fields.capacity,                                                                                                                                
                price: fields.price,                                                                                                                                                                       
                category: fields.category ?? 'General',
                image_url: fields.image_url || null,                                                                                                                                                  
              })                                                                                                                                                                                           
              .eq('id', id);                                                                                                                                                                               
                                                                                                                                                                                                           
            if (error) throw error;                                                                                                                                                                        
            showToast('Event updated');                                                                                                                                                                    
          } else {                                                                                                                                                                                         
            const { error } = await supabase                                                                                                                                                               
              .from('events')                                                                                                                                                                              
              .insert({                                                                                                                                                                                    
                title: eventModal.title ?? 'Untitled Event',                                                                                                                                               
                description: eventModal.description ?? '',                                                                                                                                               
                event_date: eventModal.event_date ? new Date(eventModal.event_date).toISOString() : new Date().toISOString(),                                                                              
                location: eventModal.location ?? '',                                                                                                                                                       
                capacity: eventModal.capacity ?? 100,                                                                                                                                                      
                available_seats: eventModal.available_seats ?? eventModal.capacity ?? 100,                                                                                                                 
                price: eventModal.price ?? 0,                                                                                                                                                              
                category: eventModal.category ?? 'General', 
                image_url: eventModal.image_url || null,                                                                                                                                               
                organizer_id: user?.id ?? null,                                                                                                                                                            
                is_deleted: false,                                                                                                                                                                         
              });                                                                                                                                                                                          
                                                                                                                                                                                                           
            if (error) throw error;                                                                                                                                                                        
            showToast('Event created');                                                                                                                                                                    
          }                                                                                                                                                                                                
                                                                                                                                                                                                           
          setEventModal(null);                                                                                                                                                                             
          fetchAll();                                                                                                                                                                                      
        } catch (err) {                                                                                                                                                                                    
          console.error('Error saving event:', err);                                                                                                                                                       
          showToast('Failed to save event', 'err');                                                                                                                                                        
        } finally {                                                                                                                                                                                        
          setSaving(false);                                                                                                                                                                                
        }                                                                                                                                                                                                  
      };                                                                                                                                                                                                   
                                                                                                                                                                                                           
      //Event delete 
      const deleteEvent = async (id: number) => {                                                                                                                                                          
        if (!confirm('Delete this event? This cannot be undone.')) return;                                                                                                                                 
        const { error } = await supabase.from('events').delete().eq('id', id);                                                                                                                             
        if (error) return showToast('Failed to delete event', 'err');                                                                                                                                      
        showToast('Event deleted');                                                                                                                                                                        
        setEvents(prev => prev.filter(e => e.id !== id));                                                                                                                                                  
      };                                                                                                                                                                                                   
                                                                                                                                                                                                           
      //  Booking status update                                                                                                                        
      const updateBookingStatus = async (id: number, status: string) => {                                                                                                                                  
        const { error } = await supabase.from('bookings').update({ status }).eq('id', id);                                                                                                                 
        if (error) return showToast('Failed to update booking', 'err');                                                                                                                                    
        setBookings(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));                                                                                                                          
        showToast('Booking updated');                                                                                                                                                                      
      };                                                                                                                                                                                                   
                                                                                                                                                                                                           
      // Stats                                                                                                                       
      const totalRevenue = bookings                                                                                                                                                                        
        .filter(o => o.status === 'confirmed' || o.status === 'completed')                                                                                                                                 
        .reduce((s, o) => s + (o.total_price ?? 0), 0);                                                                                                                                                    
      const activeEvents  = events.filter(e => !e.is_deleted).length;                                                                                                                                      
      const pendingOrders = bookings.filter(o => o.status === 'pending').length;                                                                                                                           
                                                                                                                                                                                                           
      const filteredUsers  = users.filter(u =>                                                                                                                                                             
        (u.full_name ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||                                                                                                                            
        (u.email ?? '').toLowerCase().includes(userSearch.toLowerCase())                                                                                                                                   
      );                                                                                                                                                                                                   
      const filteredBookings = orderFilter === 'all'                                                                                                                                                       
        ? bookings                                                                                                                                                                                         
        : bookings.filter(o => (o.status ?? '').toLowerCase() === orderFilter.toLowerCase());                                                                                                              
                                                                                                                                                                                                           
      if (authLoading) {                                                                                                                                                                                   
        return (                                                                                                                                                                                           
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#666' }}>                                                                              
            <p style={{ fontSize: 16 }}>Checking permissions...</p>                                                                                                                                        
          </div>                                                                                                                                                                                           
        );                                                                                                                                                                                                 
      }                                                                                                                                                                                                    
                                                                                                                                                                                                           
      if (!isAdmin) {                                                                                                                                                                                      
        return (                                                                                                                                                                                           
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#666' }}>                                                                              
            <p style={{ fontSize: 18 }}>Access denied — admins only.</p>                                                                                                                                   
          </div>                                                                                                                                                                                           
        );                                                                                                                                                                                                 
      }                                                                                                                                                                                                    
                                                                                                                                                                                                           
      //  Styles 
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
        { id: 'orders',   label: '◇  Bookings' },                                                                                                                                                          
      ];                                                                                                                                                                                                   
                                                                                                                                                                                                           
      return (                                                                                                                                                                                             
        <div style={page}>                                                                                                                                                                                 
          <style>{`                                                                                                                                                                                        
            @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');                                                                        
            * { box-sizing: border-box; }                                                                                                                                                                  
            input::placeholder, textarea::placeholder { color: #444; }                                                                                                                                     
            select option { background: #1a1a2e; }                                                                                                                                                         
            ::-webkit-scrollbar { width: 6px; height: 6px; }                                                                                                                                               
            ::-webkit-scrollbar-track { background: transparent; }                                                                                                                                         
            ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }                                                                                                                            
          `}</style>                                                                                                                                                                                       
                                                                                                                                                                                                           
          {/* Toast Notification */}                                                                                                                                                                       
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
              <p style={{ margin: '4px 0 0', color: '#555', fontSize: 13 }}>Event Booking Management</p>                                                                                                   
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
                Loading admin data...                                                                                                                                                                      
              </div>                                                                                                                                                                                       
            ) : (                                                                                                                                                                                          
                                                                                                                                                                                                           
              // ── OVERVIEW TAB ────────────────────────────────────────────────────                                                                                                                      
              tab === 'overview' ? (                                                                                                                                                                       
                <div>                                                                                                                                                                                      
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>                                                                
                    <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="Confirmed + completed bookings"           
  accent="linear-gradient(90deg,#6366f1,#8b5cf6)" />                                                                                                                                                       
                    <StatCard label="Total Users" value={users.length} sub={`${users.filter(u => u.role === 'admin').length} admins`} accent="linear-gradient(90deg,#06b6d4,#3b82f6)" />                   
                    <StatCard label="Active Events" value={activeEvents} sub={`${events.length} total`} accent="linear-gradient(90deg,#10b981,#059669)" />                                                 
                    <StatCard label="Pending Bookings" value={pendingOrders} sub={`${bookings.length} total`} accent="linear-gradient(90deg,#f59e0b,#ef4444)" />                                           
                  </div>                                                                                                                                                                                   
                                                                                                                                                                                                           
                  {/* Recent Bookings */}                                                                                                                                                                  
                  <div style={card}>                                                                                                                                                                       
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>                       
                      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent Bookings</h2>                                                                                                        
                      <button style={btnGhost} onClick={() => setTab('orders')}>View all →</button>                                                                                                        
                    </div>                                                                                                                                                                                 
                    <div style={{ overflowX: 'auto' }}>                                                                                                                                                    
                      <table style={table}>                                                                                                                                                                
                        <thead>                                                                                                                                                                            
                          <tr>                                                                                                                                                                             
                            {['Customer', 'Event', 'Tickets', 'Amount', 'Status', 'Date'].map(h => <th key={h} style={th}>{h}</th>)}                                                                       
                          </tr>                                                                                                                                                                            
                        </thead>                                                                                                                                                                           
                        <tbody>                                                                                                                                                                            
                          {bookings.length === 0 ? (                                                                                                                                                       
                            <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#666' }}>No bookings found.</td></tr>                                                                         
                          ) : (                                                                                                                                                                            
                            bookings.slice(0, 6).map(o => (                                                                                                                                                
                              <tr key={o.id}>                                                                                                                                                              
                                <td style={td}>                                                                                                                                                            
                                  <span style={{ color: '#cbd5e1' }}>{o.profile?.full_name ?? 'Anonymous'}</span><br />                                                                                    
                                  <span style={{ color: '#555', fontSize: 12 }}>{o.profile?.email ?? '—'}</span>                                                                                           
                                </td>                                                                                                                                                                      
                                <td style={td}>{o.event?.title ?? `Event #${o.event_id ?? '—'}`}</td>                                                                                                      
                                <td style={{ ...td, fontFamily: "'DM Mono', monospace" }}>{o.num_tickets ?? 1}</td>                                                                                        
                                <td style={{ ...td, fontFamily: "'DM Mono', monospace", color: '#a5f3fc' }}>${(o.total_price ?? 0).toFixed(2)}</td>                                                        
                                <td style={td}><Badge status={o.status} /></td>                                                                                                                            
                                <td style={{ ...td, color: '#555', fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString()}</td>                                                                      
                              </tr>                                                                                                                                                                        
                            ))                                                                                                                                                                             
                          )}                                                                                                                                                                               
                        </tbody>                                                                                                                                                                           
                      </table>                                                                                                                                                                             
                    </div>                                                                                                                                                                                 
                  </div>                                                                                                                                                                                   
                </div>                                                                                                                                                                                     
                                                                                                                                                                                                           
              // EVENTS TAB                                                                                                                    
              ) : tab === 'events' ? (                                                                                                                                                                     
                <div>                                                                                                                                                                                      
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>                                                                               
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                      Events 
                      <span style={{ color: '#555', fontWeight: 400 }}>({events.length})</span></h2>                                         
                    <button 
                    style={btnPrimary}
                     onClick={() =>
                       // Opens the modal pre-filled with sensible defaults for a new event
                       setEventModal({                                                                                                                              
                      title: '',                                                                                                                                                                           
                      description : '',                                                                                                                                                                    
                      event_date: new Date().toISOString(),                                                                                                                                                
                      location: '',                                                                                                                                                                        
                      capacity: 100,                                                                                                                                                                       
                      available_seats: 100,                                                                                                                                                                
                      price: 0,                                                                                                                                                                            
                      category: 'General', 
                      image_url: '', // NEW IMAGE FLYER                                                                                                                                                                
                    })
                    }>+ New Event</button>                                                                                                                                                               
                  </div>                                                                                                                                                                                   
                  <div style={card}>                                                                                                                                                                       
                    <div style={{ overflowX: 'auto' }}>                                                                                                                                                    
                      <table style={table}>                                                                                                                                                                
                        <thead>                                                                                                                                                                            
                          <tr>                                                                                                                                                                             
                            {['Title', 'Category', 'Date', 'Location', 'Capacity', 'Available', 'Price', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}                                             
                          </tr>                                                                                                                                                                            
                        </thead>                                                                                                                                                                           
                        <tbody>                                                                                                                                                                            
                          {events.length === 0 ? (                                                                                                                                                         
                            <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#666' }}>No events created yet.</td></tr>                                                                     
                          ) : (                                                                                                                                                                            
                            events.map(e => (                                                                                                                                                              
                              <tr key={e.id} style={{ transition: 'background 0.1s' }}>                                                                                                                    
                                <td style={{ ...td, fontWeight: 600, color: '#e2e8f0' }}>{e.title ?? 'Untitled'}</td>                                                                                      
                                <td style={{ ...td, color: '#94a3b8' }}>{e.category ?? 'General'}</td>                                                                                                     
                                <td style={{ ...td, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>                                                                                                   
                                  {e.event_date ? new Date(e.event_date).toLocaleDateString() : '—'}                                                                                                       
                                </td>                                                                                                                                                                      
                                <td style={{ ...td, color: '#94a3b8' }}>{e.location ?? '—'}</td>                                                                                                           
                                <td style={{ ...td, fontFamily: "'DM Mono', monospace" }}>{e.capacity ?? '—'}</td>                                                                                         
                                <td style={{ ...td, fontFamily: "'DM Mono', monospace" }}>{e.available_seats ?? e.capacity ?? '—'}</td>                                                                    
                                <td style={{ ...td, fontFamily: "'DM Mono', monospace", color: '#a5f3fc' }}>${(e.price ?? 0).toFixed(2)}</td>                                                              
                                <td style={td}>                                                                                                                                                            
                                  <div style={{ display: 'flex', gap: 8 }}>                                                                                                                                
                                    <button style={{ ...btnGhost, color: '#818cf8' }} onClick={() => setEventModal(e)}>Edit</button>                                                                       
                                    <button style={{ ...btnGhost, color: '#f87171' }} onClick={() => deleteEvent(e.id)}>Delete</button>                                                                    
                                  </div>                                                                                                                                                                   
                                </td>                                                                                                                                                                      
                              </tr>                                                                                                                                                                        
                            ))                                                                                                                                                                             
                          )}                                                                                                                                                                               
                        </tbody>                                                                                                                                                                           
                      </table>                                                                                                                                                                             
                    </div>                                                                                                                                                                                 
                  </div>                                                                                                                                                                                   
                </div>                                                                                                                                                                                     
                                                                                                                                                                                                           
              // USERS TAB                                                                                                                    
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
                          {filteredUsers.length === 0 ? (                                                                                                                                                  
                            <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: '#666' }}>No users found.</td></tr>                                                                            
                          ) : (                                                                                                                                                                            
                            filteredUsers.map(u => (                                                                                                                                                       
                              <tr key={u.id}>                                                                                                                                                              
                                <td style={{ ...td, fontWeight: 600 }}>{u.full_name ?? '—'}</td>                                                                                                           
                                <td style={{ ...td, color: '#94a3b8', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{u.email ?? '—'}</td>                                                            
                                <td style={td}><Badge status={u.role} /></td>                                                                                                                              
                                <td style={{ ...td, color: '#555', fontSize: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>                                                 
                                <td style={td}>                                                                                                                                                            
                                  <button style={{ ...btnGhost, color: u.role === 'admin' ? '#f87171' : '#c084fc' }} onClick={() => toggleRole(u.id, u.role)}>                                             
                                    {u.role === 'admin' ? 'Remove admin' : 'Make admin'}                                                                                                                   
                                  </button>                                                                                                                                                                
                                </td>                                                                                                                                                                      
                              </tr>                                                                                                                                                                        
                            ))                                                                                                                                                                             
                          )}                                                                                                                                                                               
                        </tbody>                                                                                                                                                                           
                      </table>                                                                                                                                                                             
                    </div>                                                                                                                                                                                 
                  </div>                                                                                                                                                                                   
                </div>                                                                                                                                                                                     
                                                                                                                                                                                                           
              // BOOKINGS TAB 
              ) : (                                                                                                                                                                                        
                <div>                                                                                                                                                                                      
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>                                                                               
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Bookings <span style={{ color: '#555', fontWeight: 400 }}>({filteredBookings.length})</span></h2>                             
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
                            {['Customer', 'Event', 'Tickets', 'Amount', 'Status', 'Date', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}                                                            
                          </tr>                                                                                                                                                                            
                        </thead>                                                                                                                                                                           
                        <tbody>                                                                                                                                                                            
                          {filteredBookings.length === 0 ? (                                                                                                                                               
                            <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#666' }}>No bookings matching filter.</td></tr>                                                               
                          ) : (                                                                                                                                                                            
                            filteredBookings.map(o => (                                                                                                                                                    
                              <tr key={o.id}>                                                                                                                                                              
                                <td style={td}>                                                                                                                                                            
                                  <span style={{ color: '#cbd5e1' }}>{o.profile?.full_name ?? 'Anonymous'}</span><br />                                                                                    
                                  <span style={{ color: '#555', fontSize: 12 }}>{o.profile?.email ?? '—'}</span>                                                                                           
                                </td>                                                                                                                                                                      
                                <td style={td}>{o.event?.title ?? `Event #${o.event_id ?? '—'}`}</td>                                                                                                      
                                <td style={{ ...td, fontFamily: "'DM Mono', monospace" }}>{o.num_tickets ?? 1}</td>                                                                                        
                                <td style={{ ...td, fontFamily: "'DM Mono', monospace", color: '#a5f3fc' }}>${(o.total_price ?? 0).toFixed(2)}</td>                                                        
                                <td style={td}><Badge status={o.status} /></td>                                                                                                                            
                                <td style={{ ...td, color: '#555', fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString()}</td>                                                                      
                                <td style={td}>                                                                                                                                                            
                                  <select                                                                                                                                                                  
                                    value={o.status ?? 'pending'}                                                                                                                                          
                                    onChange={e => updateBookingStatus(o.id, e.target.value)}                                                                                                              
                                    style={{ ...input, width: 130, padding: '5px 10px', fontSize: 12 }}                                                                                                    
                                  >                                                                                                                                                                        
                                    {['pending', 'confirmed', 'completed', 'cancelled'].map(s => (                                                                                                         
                                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>                                                                                          
                                    ))}                                                                                                                                                                    
                                  </select>                                                                                                                                                                
                                </td>                                                                                                                                                                      
                              </tr>                                                                                                                                                                        
                            ))                                                                                                                                                                             
                          )}                                                                                                                                                                               
                        </tbody>                                                                                                                                                                           
                      </table>                                                                                                                                                                             
                    </div>                                                                                                                                                                                 
                  </div>                                                                                                                                                                                   
                </div>                                                                                                                                                                                     
            ))}                                                                                                                                                                                            
          </div>                                                                                                                                                                                           
                                                                                                                                                                                                           
          {/* ── Event Modal (Create / Edit) */}           
          {eventModal !== null && (                                                                                                                                                                        
            <div style={{                                                                                                                                                                                  
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',                                                                                                                                 
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
                maxWidth: 540,                                                                                                                                                                             
                maxHeight: '90vh',                                                                                                                                                                         
                overflowY: 'auto',                                                                                                                                                                         
              }}>                                                                                                                                                                                          
                <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700 }}>                                                                                                                         
                  {typeof eventModal.id === 'number' ? 'Edit Event' : 'New Event'}                                                                                                                         
                </h2>                                                                                                                                                                                      
                                                                                                                                                                                                           
                {/* Title */}                                                                                                                                                                              
                <div style={{ marginBottom: 16 }}>                                                                                                                                                         
                  <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Title</label>                                     
                  <input                                                                                                                                                                                   
                    type="text"                                                                                                                                                                            
                    placeholder="e.g. Summer Music Festival"                                                                                                                                               
                    value={eventModal.title ?? ''}                                                                                                                                                         
                    onChange={e => setEventModal(prev => ({ ...prev, title: e.target.value }))}                                                                                                            
                    style={input}                                                                                                                                                                          
                  />                                                                                                                                                                                       
                </div>                                                                                                                                                                                     
                                                                                                                                                                                                           
                {/* Description */}                                                                                                                                                                        
                <div style={{ marginBottom: 16 }}>                                                                                                                                                         
                  <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Description</label>                               
                  <textarea                                                                                                                                                                                
                    rows={3}                                                                                                                                                                               
                    placeholder="Event details and agenda..."                                                                                                                                              
                    value={eventModal.description ?? ''}                                                                                                                                                  
                    onChange={e => setEventModal(prev => ({ ...prev, descriptions: e.target.value }))}                                                                                                     
                    style={{ ...input, resize: 'vertical' }}                                                                                                                                               
                  />                                                                                                                                                                                       
                </div>                                                                                                                                                                                     
                                                                                                                                                                                                           
                {/* Category & Date in 2 columns */}                                                                                                                                                       
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>                                                                                               
                  <div>                                                                                                                                                                                    
                    <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Category</label>                                
                    <select                                                                                                                                                                                
                      value={eventModal.category ?? 'General'}                                                                                                                                             
                      onChange={e => setEventModal(prev => ({ ...prev, category: e.target.value }))}                                                                                                       
                      style={input}                                                                                                                                                                        
                    >                                                                                                                                                                                      
                      {['General', 'Music', 'Sports', 'Technology', 'Business', 'Arts', 'Education'].map(c => (                                                                                            
                        <option key={c} value={c}>{c}</option>                                                                                                                                             
                      ))}                                                                                                                                                                                  
                    </select>                                                                                                                                                                              
                  </div>                                                                                                                                                                                   
                  <div>                                                                                                                                                                                    
                    <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Date & Time</label>                             
                    <input                                                                                                                                                                                 
                      type="datetime-local"                                                                                                                                                                
                      value={formatDateForInput(eventModal.event_date)}                                                                                                                                    
                      onChange={e => setEventModal(prev => ({ ...prev, event_date: e.target.value }))}                                                                                                     
                      style={input}                                                                                                                                                                        
                    />                                                                                                                                                                                     
                  </div>                                                                                                                                                                                   
                </div>                                                                                                                                                                                     
                                                                                                                                                                                                           
                {/* Location */}                                                                                                                                                                           
                <div style={{ marginBottom: 16 }}>                                                                                                                                                         
                  <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Location</label>                                  
                  <input                                                                                                                                                                                   
                    type="text"                                                                                                                                                                            
                    placeholder="e.g. Grand Arena, NY"                                                                                                                                                     
                    value={eventModal.location ?? ''}                                                                                                                                                      
                    onChange={e => setEventModal(prev => ({ ...prev, location: e.target.value }))}                                                                                                         
                    style={input}                                                                                                                                                                          
                  />                                                                                                                                                                                       
                </div>     

                {/* image URL */}
                <div style={{ marginBottom: 16}}>
                  <label>
                    Flyer Image 
                  </label>
                  <input
                  type='text'
                  placeholder='https://example.com/flyer.jpg'
                  value={eventModal.image_url ?? ''}
                  onChange={(e) => setEventModal((prev) => ({ ...prev, image_url: e.target.value}))}
                  style={input}
                  />
                  {eventModal.image_url && (
                    <img 
                      src={eventModal.image_url}
                      alt='Preview'
                      style={{ marginTop: 10, width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)'}}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                  )}
                </div>                                                                                                                                                                                
                                                                                                                                                                                                           
                {/* Capacity & Price in 2 columns */}                                                                                                                                                      
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>                                                                                               
                  <div>                                                                                                                                                                                    
                    <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Capacity</label>                                
                    <input                                                                                                                                                                                 
                      type="number"                                                                                                                                                                        
                      min="0"                                                                                                                                                                              
                      value={eventModal.capacity ?? ''}                                                                                                                                                    
                      onChange={e => {                                                                                                                                                                     
                        const val = parseInt(e.target.value, 10);                                                                                                                                          
                        setEventModal(prev => ({ ...prev, capacity: isNaN(val) ? 0 : val }));                                                                                                              
                      }}                                                                                                                                                                                   
                      style={input}                                                                                                                                                                        
                    />                                                                                                                                                                                     
                  </div>                                                                                                                                                                                   
                  <div>                                                                                                                                                                                    
                    <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Price ($)</label>                               
                    <input                                                                                                                                                                                 
                      type="number"                                                                                                                                                                        
                      min="0"                                                                                                                                                                              
                      step="0.01"                                                                                                                                                                          
                      value={eventModal.price ?? ''}                                                                                                                                                       
                      onChange={e => {                                                                                                                                                                     
                        const val = parseFloat(e.target.value);                                                                                                                                            
                        setEventModal(prev => ({ ...prev, price: isNaN(val) ? 0 : val }));                                                                                                                 
                      }}                                                                                                                                                                                   
                      style={input}                                                                                                                                                                        
                    />                                                                                                                                                                                     
                  </div>                                                                                                                                                                                   
                </div>                                                                                                                                                                                     
                                                                                                                                                                                                           
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>                                                                                                                     
                  <button style={btnGhost} onClick={() => setEventModal(null)}>Cancel</button>                                                                                                             
                  <button style={btnPrimary} onClick={saveEvent} disabled={saving}>                                                                                                                        
                    {saving ? 'Saving…' : typeof eventModal.id === 'number' ? 'Update Event' : 'Create Event'}                                                                                             
                  </button>                                                                                                                                                                                
                </div>                                                                                                                                                                                     
              </div>                                                                                                                                                                                       
            </div>                                                                                                                                                                                         
          )}                                                                                                                                                                                               
        </div>                                                                                                                                                                                             
      );                                                                                                                                                                                                   
    }                                                                                                                                                                                                      
