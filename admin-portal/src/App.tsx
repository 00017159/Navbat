import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import {
  LayoutDashboard, Users, Calendar, LogOut,
  Shield, Activity, UserCheck, Clock, Trash2, HeartPulse
} from 'lucide-react';
import './App.css';

type View = 'dashboard' | 'users' | 'appointments' | 'doctors';

interface Profile {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

interface Appointment {
  id: string;
  status: string;
  date_time: string;
  type: string;
  notes: string;
  patient: { first_name: string; last_name: string; email: string } | null;
  doctor: { first_name: string; last_name: string } | null;
}

// ── Login Screen ──────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (role: string) => void }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async () => {
    if (!email.includes('@')) { setError('Enter a valid email'); return; }
    setLoading(true);
    setError('');
    try {
      const { error: e } = await supabase.auth.signInWithOtp({ email });
      if (e) throw e;
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      const { error: e } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
      if (e) throw e;
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth failed');
      const { data: profile } = await supabase.from('profiles').select('role').eq('auth_id', user.id).single();
      if (profile?.role !== 'ADMIN' && profile?.role !== 'DOCTOR') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Staff privileges required.');
      }
      onLogin(profile.role);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>ClinicUz Admin</h1>
        <p>Sign in with your administrator email to manage the system.</p>

        {error && <div className="login-error">{error}</div>}

        {step === 'email' ? (
          <>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRequestOtp()}
              />
            </div>
            <button className="btn-primary" onClick={handleRequestOtp} disabled={loading}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                maxLength={6}
              />
            </div>
            <button className="btn-primary" onClick={handleVerifyOtp} disabled={loading}>
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
            <button
              style={{ marginTop: 12, background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter' }}
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}
            >
              ← Back to email
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────
function DashboardView({ users, appointments }: { users: Profile[]; appointments: Appointment[] }) {
  const totalPatients = users.filter(u => u.role === 'PATIENT').length;
  const totalDoctors = users.filter(u => u.role === 'DOCTOR').length;
  const upcomingCount = appointments.filter(a => a.status === 'UPCOMING').length;
  const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>System overview and real-time metrics</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card blue">
          <div className="metric-icon blue"><Users size={24} /></div>
          <div className="metric-value">{totalPatients}</div>
          <div className="metric-label">Total Patients</div>
        </div>
        <div className="metric-card green">
          <div className="metric-icon green"><Activity size={24} /></div>
          <div className="metric-value">{totalDoctors}</div>
          <div className="metric-label">Active Doctors</div>
        </div>
        <div className="metric-card purple">
          <div className="metric-icon purple"><Clock size={24} /></div>
          <div className="metric-value">{upcomingCount}</div>
          <div className="metric-label">Upcoming Visits</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-icon amber"><UserCheck size={24} /></div>
          <div className="metric-value">{completedCount}</div>
          <div className="metric-label">Completed</div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="table-section">
        <div className="table-header">
          <h2>Recent Appointments</h2>
          <span className="badge">{appointments.length} total</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr><td colSpan={5} className="empty-state">No appointments found</td></tr>
            ) : appointments.slice(0, 10).map(a => (
              <tr key={a.id}>
                <td>{a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : '—'}</td>
                <td>{a.doctor ? `${a.doctor.first_name} ${a.doctor.last_name}` : '—'}</td>
                <td style={{ color: '#94A3B8' }}>{new Date(a.date_time).toLocaleString()}</td>
                <td style={{ color: '#94A3B8' }}>{a.type}</td>
                <td><span className={`status-badge ${a.status?.toLowerCase()}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Users Management ──────────────────────────────────────
function UsersView({ users, onDelete }: { users: Profile[]; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <h1>User Management</h1>
        <p>View and manage all registered users</p>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h2>All Users</h2>
          <span className="badge">{users.length} registered</span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="empty-state">No users found</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="user-cell">
                    <div className={`user-avatar ${u.role?.toLowerCase()}`}>
                      {(u.first_name || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">{u.first_name || 'Unknown'} {u.last_name || ''}</div>
                      <div className="user-email">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`role-badge ${u.role?.toLowerCase()}`}>{u.role}</span></td>
                <td style={{ color: '#64748B', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  {u.role !== 'ADMIN' && (
                    <button className="btn-delete" onClick={() => onDelete(u.id)}>
                      <Trash2 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Appointments Management ───────────────────────────────
function AppointmentsView({ appointments, role, onRefresh }: { appointments: Appointment[]; role: string; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [recordForm, setRecordForm] = useState({
    diagnosis: '',
    notes: ''
  });

  const filtered = appointments.filter(a =>
    a.patient?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.patient?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.patient?.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.doctor?.first_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddRecord = async () => {
    if (!selectedAppt || !recordForm.diagnosis) {
      alert('Diagnosis is required.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('medical_records').insert({
        patient_id: (selectedAppt as any).patient_id,
        doctor_id: (selectedAppt as any).doctor_id,
        diagnosis: recordForm.diagnosis,
        notes: recordForm.notes,
        date: new Date().toISOString()
      });
      if (error) throw error;
      
      // Update appointment status to COMPLETED
      await supabase.from('appointments').update({ status: 'COMPLETED' }).eq('id', selectedAppt.id);
      
      setIsModalOpen(false);
      onRefresh();
      setRecordForm({ diagnosis: '', notes: '' });
    } catch (e: any) {
      alert('Failed to save record: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Appointments</h1>
        <p>All clinic appointments across the system</p>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h2>All Appointments</h2>
          <span className="badge">{appointments.length} total</span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by patient or doctor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Status</th>
              <th>{role === 'DOCTOR' ? 'Actions' : 'Notes'}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="empty-state">No appointments found</td></tr>
            ) : filtered.map(a => (
              <tr key={a.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar patient">
                      {(a.patient?.first_name || 'P')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">{a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : '—'}</div>
                      <div className="user-email">{a.patient?.email || ''}</div>
                    </div>
                  </div>
                </td>
                <td>{a.doctor ? `${a.doctor.first_name} ${a.doctor.last_name}` : '—'}</td>
                <td style={{ color: '#94A3B8', fontSize: 13 }}>{new Date(a.date_time).toLocaleString()}</td>
                <td style={{ color: '#94A3B8' }}>{a.type}</td>
                <td><span className={`status-badge ${a.status?.toLowerCase()}`}>{a.status}</span></td>
                <td>
                  {role === 'DOCTOR' && a.status !== 'COMPLETED' ? (
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { setSelectedAppt(a); setIsModalOpen(true); }}>
                      Write Record
                    </button>
                  ) : <span style={{ color: '#64748B', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{a.notes || '—'}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedAppt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-card" style={{ width: 500, transform: 'none', background: 'white', padding: 24, borderRadius: 16 }}>
            <h2 style={{ marginTop: 0, marginBottom: 8, fontFamily: 'Outfit', color: '#0F172A' }}>Clinical Record</h2>
            <p style={{ color: '#64748B', marginBottom: 20 }}>Patient: <strong>{selectedAppt.patient?.first_name} {selectedAppt.patient?.last_name}</strong></p>
            
            <div className="form-group">
              <label>Diagnosis / Symptoms</label>
              <textarea 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontFamily: 'Inter', fontSize: 14, minHeight: 80, resize: 'vertical' }}
                value={recordForm.diagnosis} 
                onChange={e => setRecordForm({...recordForm, diagnosis: e.target.value})} 
                placeholder="Observed symptoms and final diagnosis..." 
              />
            </div>
            
            <div className="form-group">
              <label>Prescriptions & Suggestions</label>
              <textarea 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontFamily: 'Inter', fontSize: 14, minHeight: 80, resize: 'vertical' }}
                value={recordForm.notes} 
                onChange={e => setRecordForm({...recordForm, notes: e.target.value})} 
                placeholder="Medications, rest details, treatment plan..." 
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-primary" style={{ flex: 1, background: '#F1F5F9', color: '#475569', boxShadow: 'none' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, background: '#10B981' }} onClick={handleAddRecord} disabled={loading}>{loading ? 'Saving...' : 'Save & Complete'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Doctors Management ──────────────────────────────────────
function DoctorsView({ users, onDelete, onRefresh }: { users: Profile[]; onDelete: (id: string) => void; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New Doctor State
  const [doctorForm, setDoctorForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    specialty: 'General Practice',
    experience_yrs: '5',
    availability: 'Available Today',
    bg: '#F3E8FF',
    color: '#6B21A8',
    description: '',
    clinic_name: ''
  });

  const doctors = users.filter(u => u.role === 'DOCTOR');
  const filtered = doctors.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddDoctor = async () => {
    if (!doctorForm.email || !doctorForm.first_name || !doctorForm.last_name) {
      alert('Email, First Name, and Last Name are required.');
      return;
    }
    setLoading(true);
    try {
      // Insert profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: doctorForm.email,
          first_name: doctorForm.first_name,
          last_name: doctorForm.last_name,
          role: 'DOCTOR'
        }).select().single();
      
      if (profileError) throw profileError;

      // Insert doctor profile mapping
      const { error: doctorProfileError } = await supabase
        .from('doctor_profiles')
        .insert({
          user_id: profileData.id,
          specialty: doctorForm.specialty,
          experience_yrs: parseInt(doctorForm.experience_yrs),
          availability: doctorForm.availability,
          bg: doctorForm.bg,
          color: doctorForm.color,
          description: doctorForm.description,
          clinic_name: doctorForm.clinic_name,
          rating: 5.0,
          review_count: 0
        });

      if (doctorProfileError) throw doctorProfileError;

      setIsModalOpen(false);
      onRefresh();
      
      // reset form
      setDoctorForm({
        email: '', first_name: '', last_name: '', specialty: 'General Practice',
        experience_yrs: '5', availability: 'Available Today', bg: '#F3E8FF', color: '#6B21A8', description: '', clinic_name: ''
      });
    } catch (e: any) {
      alert('Failed to add doctor: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Doctor Directory</h1>
          <p>Manage clinic providers and specialists</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Doctor</button>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h2>Active Providers</h2>
          <span className="badge">{doctors.length} total</span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Specialty</th>
              <th>Experience</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="empty-state">No doctors found</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar doctor">
                      {(u.first_name || u.email || 'D')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">Dr. {u.first_name} {u.last_name}</div>
                      <div className="user-email">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="status-badge" style={{ background: '#F8FAFC', color: '#475569' }}>Registered</span></td>
                <td>—</td>
                <td style={{ color: '#64748B', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn-delete" onClick={() => onDelete(u.id)}>
                    <Trash2 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-card" style={{ width: 400, transform: 'none', background: 'white', padding: 24, borderRadius: 16 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontFamily: 'Outfit', color: '#0F172A' }}>Add New Doctor</h2>
            
            <div className="form-group"><label>Email</label><input type="email" value={doctorForm.email} onChange={e => setDoctorForm({...doctorForm, email: e.target.value})} placeholder="dr.smith@navbat.uz" /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>First Name</label><input type="text" value={doctorForm.first_name} onChange={e => setDoctorForm({...doctorForm, first_name: e.target.value})} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Last Name</label><input type="text" value={doctorForm.last_name} onChange={e => setDoctorForm({...doctorForm, last_name: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>Specialty</label><input type="text" value={doctorForm.specialty} onChange={e => setDoctorForm({...doctorForm, specialty: e.target.value})} placeholder="e.g. Cardiologist" /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Clinic Name</label><input type="text" value={doctorForm.clinic_name} onChange={e => setDoctorForm({...doctorForm, clinic_name: e.target.value})} placeholder="Main Medical Center" /></div>
            </div>
            
            <div className="form-group">
              <label>Doctor Bio / Description</label>
              <textarea 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontFamily: 'Inter', fontSize: 14, minHeight: 80, resize: 'vertical' }}
                value={doctorForm.description} 
                onChange={e => setDoctorForm({...doctorForm, description: e.target.value})} 
                placeholder="Write a brief background about the doctor..." 
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-primary" style={{ flex: 1, background: '#F1F5F9', color: '#475569', boxShadow: 'none' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddDoctor} disabled={loading}>{loading ? 'Creating...' : 'Create Doctor'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main App ──────────────────────────────────────────────
function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [users, setUsers] = useState<Profile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('');

  // Check existing session
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('auth_id', session.user.id)
          .single();
        if (profile?.role === 'ADMIN' || profile?.role === 'DOCTOR') {
          setRole(profile.role);
          setAuthed(true);
        } else {
          await supabase.auth.signOut();
          setAuthed(false);
          setRole('');
        }
      } else {
        setAuthed(false);
      }
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, apptsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments')
          .select('*, patient:profiles!patient_id(first_name, last_name, email), doctor:profiles!doctor_id(first_name, last_name)')
          .order('date_time', { ascending: false }),
      ]);
      setUsers(usersRes.data || []);
      setAppointments(apptsRes.data || []);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthed(false);
  };

  const handleDeleteUser = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!confirm(`Permanently delete user "${user?.email}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (e: any) {
      alert('Failed to delete: ' + e.message);
    }
  };

  // Loading state
  if (authed === null) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span style={{ color: '#64748B' }}>Checking session...</span>
      </div>
    );
  }

  // Not logged in
  if (!authed) {
    return <LoginScreen onLogin={(assignedRole) => {
      setRole(assignedRole);
      setAuthed(true);
    }} />;
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><Shield size={20} color="white" /></div>
          <div>
            <h2>ClinicUz</h2>
            <span>{role === 'ADMIN' ? 'Admin Portal' : 'Doctor Dashboard'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          
          {role === 'ADMIN' && (
            <>
              <button className={`nav-item ${view === 'users' ? 'active' : ''}`} onClick={() => setView('users')}>
                <Users size={18} /> Patients
              </button>
              <button className={`nav-item ${view === 'doctors' ? 'active' : ''}`} onClick={() => setView('doctors')}>
                <HeartPulse size={18} /> Providers
              </button>
            </>
          )}

          <button className={`nav-item ${view === 'appointments' ? 'active' : ''}`} onClick={() => setView('appointments')}>
            <Calendar size={18} /> {role === 'ADMIN' ? 'All Appointments' : 'My Schedule'}
          </button>
          <button className="nav-item nav-item-logout" onClick={handleLogout}>
            <LogOut size={18} /> Sign Out
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="main-content">
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 400 }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {view === 'dashboard' && <DashboardView users={users} appointments={appointments} />}
            {view === 'users' && role === 'ADMIN' && <UsersView users={users.filter(u => u.role !== 'DOCTOR')} onDelete={handleDeleteUser} />}
            {view === 'doctors' && role === 'ADMIN' && <DoctorsView users={users} onDelete={handleDeleteUser} onRefresh={fetchData} />}
            {view === 'appointments' && <AppointmentsView appointments={appointments} role={role} onRefresh={fetchData} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
