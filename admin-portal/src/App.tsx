import { createClient } from '@supabase/supabase-js';
import {
  Activity,
  Building2,
  Calendar,
  Clock,
  Download,
  Eye, EyeOff,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';

type View = 'dashboard' | 'users' | 'appointments' | 'doctors' | 'records' | 'clinics';

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
function LoginScreen({ onLogin }: { onLogin: (role: string, profileId: string) => void }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp');
  const [showPassword, setShowPassword] = useState(false);

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
      await resolveLogin();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!email.includes('@')) { setError('Enter a valid email'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) throw e;
      await resolveLogin();
    } catch (e: any) {
      setError(e.message === 'Invalid login credentials' ? 'Invalid email or password.' : e.message);
    } finally {
      setLoading(false);
    }
  };

  const resolveLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Auth failed');
    const { data: profile } = await supabase.from('profiles').select('role, id').eq('auth_id', user.id).single();
    if (profile?.role !== 'ADMIN' && profile?.role !== 'DOCTOR') {
      await supabase.auth.signOut();
      throw new Error('Access denied. Staff privileges required.');
    }
    onLogin(profile.role, profile.id);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>ClinicUz Portal</h1>
        <p>Sign in with your staff credentials to access the system.</p>

        {error && <div className="login-error">{error}</div>}

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            className={`btn-primary`}
            style={{ flex: 1, fontSize: 13, padding: '8px 0', background: loginMode === 'otp' ? '#1E63D3' : '#1E293B', border: loginMode === 'otp' ? 'none' : '1px solid #334155', boxShadow: loginMode === 'otp' ? undefined : 'none' }}
            onClick={() => { setLoginMode('otp'); setStep('email'); setError(''); }}
          >
            Admin Login
          </button>
          <button
            className={`btn-primary`}
            style={{ flex: 1, fontSize: 13, padding: '8px 0', background: loginMode === 'password' ? '#1E63D3' : '#1E293B', border: loginMode === 'password' ? 'none' : '1px solid #334155', boxShadow: loginMode === 'password' ? undefined : 'none' }}
            onClick={() => { setLoginMode('password'); setStep('email'); setError(''); }}
          >
            Doctors Login
          </button>
        </div>

        {loginMode === 'otp' ? (
          // OTP Flow
          step === 'email' ? (
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
          )
        ) : (
          // Password Flow
          <>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="doctor@clinic.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  {showPassword ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
                </button>
              </div>
            </div>
            <button className="btn-primary" onClick={handlePasswordLogin} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
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
function AppointmentsView({ appointments, role, onRefresh, profileId }: { appointments: Appointment[]; role: string; onRefresh: () => void; profileId: string }) {
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

  const handleDownloadXlsx = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthName = now.toLocaleString('default', { month: 'long' });

    const monthlyAppts = appointments.filter(a => {
      const d = new Date(a.date_time);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const rows = monthlyAppts.map(a => ({
      'Patient Name': a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : '—',
      'Email': a.patient?.email || '—',
      'Date & Time': new Date(a.date_time).toLocaleString(),
      'Type': a.type,
      'Status': a.status,
      'Notes': a.notes || '—'
    }));

    if (rows.length === 0) {
      alert('No appointments found for ' + monthName + ' ' + currentYear);
      return;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${monthName} ${currentYear}`);

    const colWidths = Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String((r as any)[key] || '').length))
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `patients_${monthName}_${currentYear}.xlsx`);
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{role === 'DOCTOR' ? 'My Schedule' : 'Appointments'}</h1>
          <p>{role === 'DOCTOR' ? 'Your upcoming and past appointments' : 'All clinic appointments across the system'}</p>
        </div>
        {role === 'DOCTOR' && (
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleDownloadXlsx}>
            <Download size={16} /> Monthly Report
          </button>
        )}
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
              <th>{role === 'DOCTOR' || role === 'ADMIN' ? 'Actions' : 'Notes'}</th>
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
                  {(role === 'DOCTOR' || role === 'ADMIN') && a.status !== 'COMPLETED' ? (
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,17,32,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-card" style={{ width: 500, transform: 'none', padding: 24, borderRadius: 16 }}>
            <h2 style={{ marginTop: 0, marginBottom: 8, fontFamily: 'Outfit', color: '#F1F5F9' }}>Clinical Record</h2>
            <p style={{ color: '#94A3B8', marginBottom: 20 }}>Patient: <strong style={{ color: '#F1F5F9' }}>{selectedAppt.patient?.first_name} {selectedAppt.patient?.last_name}</strong></p>

            <div className="form-group">
              <label>Diagnosis / Symptoms</label>
              <textarea
                style={{ minHeight: 80, resize: 'vertical' }}
                value={recordForm.diagnosis}
                onChange={e => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                placeholder="Observed symptoms and final diagnosis..."
              />
            </div>

            <div className="form-group">
              <label>Prescriptions & Suggestions</label>
              <textarea
                style={{ minHeight: 80, resize: 'vertical' }}
                value={recordForm.notes}
                onChange={e => setRecordForm({ ...recordForm, notes: e.target.value })}
                placeholder="Medications, rest details, treatment plan..."
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-primary" style={{ flex: 1, background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', boxShadow: 'none' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
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
    password: '',
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
    if (!doctorForm.password || doctorForm.password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      // 1. Insert profile first (without auth_id)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: doctorForm.email,
          first_name: doctorForm.first_name,
          last_name: doctorForm.last_name,
          role: 'DOCTOR'
        }).select().single();

      if (profileError) throw profileError;

      // 2. Create auth account via a temporary client (so admin session stays intact)
      const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { error: signUpError } = await tempClient.auth.signUp({
        email: doctorForm.email,
        password: doctorForm.password,
        options: {
          data: { role: 'DOCTOR' }
        }
      });

      if (signUpError) {
        // Rollback profile if auth creation fails
        await supabase.from('profiles').delete().eq('id', profileData.id);
        throw signUpError;
      }

      // 3. Insert doctor profile mapping
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
      alert(`Doctor ${doctorForm.first_name} ${doctorForm.last_name} created!\n\nLogin credentials:\nEmail: ${doctorForm.email}\nPassword: ${doctorForm.password}`);

      // reset form
      setDoctorForm({
        email: '', first_name: '', last_name: '', password: '', specialty: 'General Practice',
        experience_yrs: '5', availability: 'Available Today', bg: '#F3E8FF', color: '#6B21A8', description: '', clinic_name: ''
      });
    } catch (e: any) {
      if (e.code === '23505') {
        alert('Failed to add doctor: An account with this email already exists in the system.');
      } else {
        alert('Failed to add doctor: ' + e.message);
      }
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,17,32,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-card" style={{ width: 400, transform: 'none', padding: 24, borderRadius: 16 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontFamily: 'Outfit', color: '#F1F5F9' }}>Add New Doctor</h2>

            <div className="form-group"><label>Email</label><input type="email" value={doctorForm.email} onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })} placeholder="dr.smith@clinic.uz" /></div>
            <div className="form-group">
              <label>Password (doctor will use this to log in)</label>
              <input type="text" value={doctorForm.password} onChange={e => setDoctorForm({ ...doctorForm, password: e.target.value })} placeholder="Min 6 characters" />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>First Name</label><input type="text" value={doctorForm.first_name} onChange={e => setDoctorForm({ ...doctorForm, first_name: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Last Name</label><input type="text" value={doctorForm.last_name} onChange={e => setDoctorForm({ ...doctorForm, last_name: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>Specialty</label><input type="text" value={doctorForm.specialty} onChange={e => setDoctorForm({ ...doctorForm, specialty: e.target.value })} placeholder="e.g. Cardiologist" /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Clinic Name</label><input type="text" value={doctorForm.clinic_name} onChange={e => setDoctorForm({ ...doctorForm, clinic_name: e.target.value })} placeholder="Main Medical Center" /></div>
            </div>

            <div className="form-group">
              <label>Doctor Bio / Description</label>
              <textarea
                style={{ minHeight: 80, resize: 'vertical' }}
                value={doctorForm.description}
                onChange={e => setDoctorForm({ ...doctorForm, description: e.target.value })}
                placeholder="Write a brief background about the doctor..."
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-primary" style={{ flex: 1, background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', boxShadow: 'none' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddDoctor} disabled={loading}>{loading ? 'Creating...' : 'Create Doctor'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Medical Records (Doctor View) ─────────────────────────
interface MedicalRecord {
  id: string;
  diagnosis: string;
  notes: string;
  date: string;
  prescriptions: string[];
  patient: { first_name: string; last_name: string; email: string } | null;
}

function RecordsView({ doctorProfileId }: { doctorProfileId: string }) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRecords();
  }, [doctorProfileId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*, patient:profiles!patient_id(first_name, last_name, email)')
        .eq('doctor_id', doctorProfileId)
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (e) {
      console.error('Fetch records error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter(r =>
    r.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
    r.patient?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.patient?.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="loading-screen" style={{ minHeight: 400 }}><div className="spinner" /></div>;
  }

  return (
    <>
      <div className="page-header">
        <h1>Medical Records</h1>
        <p>Records you have written for your patients</p>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h2>My Records</h2>
          <span className="badge">{records.length} total</span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by patient name or diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Diagnosis</th>
              <th>Notes / Prescriptions</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="empty-state">No records found</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar patient">
                      {(r.patient?.first_name || 'P')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">{r.patient ? `${r.patient.first_name} ${r.patient.last_name}` : '—'}</div>
                      <div className="user-email">{r.patient?.email || ''}</div>
                    </div>
                  </div>
                </td>
                <td style={{ maxWidth: 200 }}>{r.diagnosis}</td>
                <td style={{ maxWidth: 250, color: '#94A3B8', fontSize: 13 }}>{r.notes || '—'}</td>
                <td style={{ color: '#64748B', fontSize: 13 }}>{new Date(r.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Clinics Management ────────────────────────────────────
interface Clinic {
  id: string;
  name: string;
  location: string;
  description: string;
  created_at: string;
}

function ClinicsView() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', description: '' });

  useEffect(() => { fetchClinics(); }, []);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClinics(data || []);
    } catch (e) {
      console.error('Fetch clinics error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClinic = async () => {
    if (!form.name || !form.location) {
      alert('Clinic name and location are required.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('clinics').insert({
        name: form.name,
        location: form.location,
        description: form.description
      });
      if (error) throw error;
      setIsModalOpen(false);
      setForm({ name: '', location: '', description: '' });
      fetchClinics();
    } catch (e: any) {
      alert('Failed to add clinic: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClinic = async (id: string) => {
    if (!confirm('Delete this clinic? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('clinics').delete().eq('id', id);
      if (error) throw error;
      fetchClinics();
    } catch (e: any) {
      alert('Failed to delete: ' + e.message);
    }
  };

  const filtered = clinics.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="loading-screen" style={{ minHeight: 400 }}><div className="spinner" /></div>;
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Clinics</h1>
          <p>Manage clinic locations and details</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setIsModalOpen(true)}>+ Add Clinic</button>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h2>All Clinics</h2>
          <span className="badge">{clinics.length} total</span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="table-scroll-wrapper">
          <table>
            <thead>
              <tr>
                <th>Clinic Name</th>
                <th>Location</th>
                <th>Description</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">No clinics found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                        <Building2 size={16} />
                      </div>
                      <div className="user-name">{c.name}</div>
                    </div>
                  </td>
                  <td style={{ color: '#94A3B8' }}>{c.location}</td>
                  <td style={{ color: '#64748B', fontSize: 13, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description || '—'}</td>
                  <td style={{ color: '#64748B', fontSize: 13 }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-delete" onClick={() => handleDeleteClinic(c.id)}>
                      <Trash2 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,17,32,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-card" style={{ width: 450, transform: 'none', padding: 24, borderRadius: 16 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontFamily: 'Outfit', color: '#F1F5F9' }}>Add New Clinic</h2>

            <div className="form-group">
              <label>Clinic Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Central Medical Center" />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Tashkent, Mirzo Ulugbek District" />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                style={{ minHeight: 80, resize: 'vertical' }}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the clinic..."
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-primary" style={{ flex: 1, background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', boxShadow: 'none' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddClinic} disabled={saving}>{saving ? 'Adding...' : 'Add Clinic'}</button>
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
  const [profileId, setProfileId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check existing session
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, id')
          .eq('auth_id', session.user.id)
          .single();
        if (profile?.role === 'ADMIN' || profile?.role === 'DOCTOR') {
          setRole(profile.role);
          setProfileId(profile.id);
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
    return <LoginScreen onLogin={(assignedRole, pid) => {
      setRole(assignedRole);
      setProfileId(pid);
      setAuthed(true);
    }} />;
  }

  const closeSidebar = () => setSidebarOpen(false);
  const navTo = (v: View) => { setView(v); closeSidebar(); };

  return (
    <div className="dashboard">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-icon"><Shield size={16} color="white" /></div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>ClinicUz</span>
        </div>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Overlay (mobile) */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"><Shield size={20} color="white" /></div>
          <div>
            <h2>ClinicUz</h2>
            <span>{role === 'ADMIN' ? 'Admin Portal' : 'Doctor Dashboard'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => navTo('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </button>

          {role === 'ADMIN' && (
            <>
              <button className={`nav-item ${view === 'users' ? 'active' : ''}`} onClick={() => navTo('users')}>
                <Users size={18} /> Patients
              </button>
              <button className={`nav-item ${view === 'doctors' ? 'active' : ''}`} onClick={() => navTo('doctors')}>
                <HeartPulse size={18} /> Providers
              </button>
              <button className={`nav-item ${view === 'clinics' ? 'active' : ''}`} onClick={() => navTo('clinics')}>
                <Building2 size={18} /> Clinics
              </button>
            </>
          )}

          <button className={`nav-item ${view === 'appointments' ? 'active' : ''}`} onClick={() => navTo('appointments')}>
            <Calendar size={18} /> {role === 'ADMIN' ? 'All Appointments' : 'My Schedule'}
          </button>

          {role === 'DOCTOR' && (
            <button className={`nav-item ${view === 'records' ? 'active' : ''}`} onClick={() => navTo('records')}>
              <FileText size={18} /> My Records
            </button>
          )}

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
            {view === 'dashboard' && <DashboardView users={users} appointments={role === 'DOCTOR' ? appointments.filter((a: any) => a.doctor_id === profileId) : appointments} />}
            {view === 'users' && role === 'ADMIN' && <UsersView users={users.filter(u => u.role !== 'DOCTOR')} onDelete={handleDeleteUser} />}
            {view === 'doctors' && role === 'ADMIN' && <DoctorsView users={users} onDelete={handleDeleteUser} onRefresh={fetchData} />}
            {view === 'clinics' && role === 'ADMIN' && <ClinicsView />}
            {view === 'appointments' && <AppointmentsView appointments={role === 'DOCTOR' ? appointments.filter((a: any) => a.doctor_id === profileId) : appointments} role={role} onRefresh={fetchData} profileId={profileId} />}
            {view === 'records' && role === 'DOCTOR' && <RecordsView doctorProfileId={profileId} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
