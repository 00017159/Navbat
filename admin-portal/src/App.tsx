import { createClient } from '@supabase/supabase-js';
import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye, EyeOff,
  FileText,
  HeartPulse,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Trash2,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import logoImg from './assets/logo.png';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';

// ── Toast Notification ─────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface ToastState { message: string; type: ToastType; id: number }

function Toast({ toasts, onRemove }: { toasts: ToastState[]; onRemove: (id: number) => void }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', borderRadius: 14, minWidth: 300, maxWidth: 420,
          background: t.type === 'success' ? '#0F2B1A' : t.type === 'error' ? '#2B0F0F' : '#0F1A2B',
          border: `1px solid ${t.type === 'success' ? '#22c55e33' : t.type === 'error' ? '#ef444433' : '#3b82f633'}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'slideIn 0.2s ease',
        }}>
          {t.type === 'success' && <CheckCircle2 size={18} color="#22c55e" style={{ flexShrink: 0 }} />}
          {t.type === 'error' && <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />}
          {t.type === 'info' && <Info size={18} color="#3b82f6" style={{ flexShrink: 0 }} />}
          <span style={{ flex: 1, color: '#F1F5F9', fontSize: 14, lineHeight: 1.4 }}>{t.message}</span>
          <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#64748B' }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────
interface ConfirmOptions { title: string; message: string; confirmLabel?: string; danger?: boolean }
interface ConfirmDialogProps { options: ConfirmOptions | null; onConfirm: () => void; onCancel: () => void }

function ConfirmDialog({ options, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!options) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,17,32,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#131C2E', border: '1px solid #1E293B', borderRadius: 20, padding: '28px 32px', width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {options.danger
            ? <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
            : <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Info size={20} color="#3b82f6" />
              </div>
          }
          <h3 style={{ margin: 0, color: '#F1F5F9', fontSize: 18, fontFamily: 'Outfit, sans-serif' }}>{options.title}</h3>
        </div>
        <p style={{ margin: '0 0 24px', color: '#94A3B8', fontSize: 14, lineHeight: 1.6, paddingLeft: 52 }}>{options.message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #1E293B', background: '#1E293B', color: '#94A3B8', cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: options.danger ? '#ef4444' : '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
            {options.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── useDialog hook ─────────────────────────────────────────
function useDialog() {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((val: boolean) => void) | null>(null);
  let toastId = useRef(0);

  const toast = (message: string, type: ToastType = 'info') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    setConfirmOptions(options);
    return new Promise(resolve => { resolveRef.current = resolve; });
  };

  const handleConfirm = () => { setConfirmOptions(null); resolveRef.current?.(true); };
  const handleCancel = () => { setConfirmOptions(null); resolveRef.current?.(false); };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return { toast, confirm, toasts, removeToast, confirmOptions, handleConfirm, handleCancel };
}

type View = 'dashboard' | 'users' | 'appointments' | 'doctors' | 'records' | 'clinics';

interface Profile {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  created_at: string;
  doctor_profiles?: {
    specialty: string;
    experience_yrs: number;
    clinic_name: string;
    description: string;
    availability: string;
    bg: string;
    color: string;
    contact_phone?: string;
    contact_email?: string;
  } | null;
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
    // Try auth_id first, then fall back to email (handles doctors created before linking)
    let profile: { role: string; id: string } | null = null;
    const byAuthId = await supabase.from('profiles').select('role, id').eq('auth_id', user.id).single();
    if (byAuthId.data) {
      profile = byAuthId.data;
    } else {
      // Fallback: look up by email and link auth_id
      const byEmail = await supabase.from('profiles').select('role, id').eq('email', user.email).single();
      if (byEmail.data) {
        profile = byEmail.data;
        // Link the auth_id so future logins work via auth_id
        await supabase.from('profiles').update({ auth_id: user.id }).eq('id', byEmail.data.id);
      }
    }
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
function AppointmentsView({ appointments, role, onRefresh, toast }: { appointments: Appointment[]; role: string; onRefresh: () => void; profileId?: string; toast: (msg: string, type?: ToastType) => void; }) {
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
      toast('Diagnosis is required.', 'error');
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
      toast('Failed to save record: ' + e.message, 'error');
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
      toast('No appointments found for ' + monthName + ' ' + currentYear, 'info');
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
                    new Date(a.date_time) <= new Date() ? (
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { setSelectedAppt(a); setIsModalOpen(true); }}>
                        Write Record
                      </button>
                    ) : (
                      <span className="status-badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#D97706', border: '1px solid rgba(245,158,11,0.2)', fontSize: 11 }}>
                        Wait for appointment
                      </span>
                    )
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
function DoctorsView({ users, onDelete, onRefresh, toast }: {
  users: Profile[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
  toast: (msg: string, type?: ToastType) => void;
}) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', specialty: '', clinic_name: '', description: '', experience_yrs: 0, contact_phone: '', contact_email: '' });
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);

  const openEditModal = async (doctor: Profile) => {
    const { data: dp } = await supabase.from('doctor_profiles').select('*').eq('user_id', doctor.id).single();
    const { data: cl } = await supabase.from('clinics').select('id, name').order('name');
    setClinics(cl || []);
    setEditingDoctor(doctor);
    setEditForm({
      first_name: doctor.first_name || '',
      last_name: doctor.last_name || '',
      specialty: dp?.specialty || '',
      clinic_name: dp?.clinic_name || '',
      description: dp?.description || '',
      experience_yrs: dp?.experience_yrs || 0,
      contact_phone: dp?.contact_phone || '',
      contact_email: dp?.contact_email || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditDoctor = async () => {
    if (!editingDoctor) return;

    const phoneRegex = /^\+998\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (editForm.contact_phone && !phoneRegex.test(editForm.contact_phone)) {
      toast('Phone must be in +998XXXXXXXXX format', 'error');
      return;
    }
    if (editForm.contact_email && !emailRegex.test(editForm.contact_email)) {
      toast('Please enter a valid contact email', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error: pe } = await supabase.from('profiles').update({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
      }).eq('id', editingDoctor.id);
      if (pe) throw pe;

      const { error: de } = await supabase.from('doctor_profiles').update({
        specialty: editForm.specialty,
        clinic_name: editForm.clinic_name,
        description: editForm.description,
        experience_yrs: editForm.experience_yrs,
        contact_phone: editForm.contact_phone,
        contact_email: editForm.contact_email
      }).eq('user_id', editingDoctor.id);
      if (de) throw de;

      setIsEditModalOpen(false);
      onRefresh();
    } catch (e: any) {
      toast('Failed to update: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // New Doctor State
  const [doctorForm, setDoctorForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    specialty: 'General Practice',
    experience_yrs: 0,
    availability: 'Available Today',
    bg: '#e0f2fe',
    color: '#0369a1',
    description: '',
    clinic_name: '',
    contact_phone: '',
    contact_email: ''
  });

  const doctors = users.filter(u => u.role === 'DOCTOR');
  const filtered = doctors.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = async () => {
    setIsModalOpen(true);
    const { data } = await supabase.from('clinics').select('id, name').order('name');
    setClinics(data || []);
  };

  const handleAddDoctor = async () => {
    if (!doctorForm.email || !doctorForm.first_name || !doctorForm.last_name) {
      toast('Email, First Name, and Last Name are required.', 'error');
      return;
    }
    if (!doctorForm.password || doctorForm.password.length < 6) {
      toast('Password must be at least 6 characters.', 'error');
      return;
    }

    const phoneRegex = /^\+998\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (doctorForm.contact_phone && !phoneRegex.test(doctorForm.contact_phone)) {
      toast('Public Phone must be in +998XXXXXXXXX format', 'error');
      return;
    }
    if (doctorForm.contact_email && !emailRegex.test(doctorForm.contact_email)) {
      toast('Please enter a valid public email', 'error');
      return;
    }
    if (!emailRegex.test(doctorForm.email)) {
      toast('Please enter a valid login email', 'error');
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
          experience_yrs: doctorForm.experience_yrs,
          availability: doctorForm.availability,
          bg: doctorForm.bg,
          color: doctorForm.color,
          description: doctorForm.description,
          clinic_name: doctorForm.clinic_name,
          contact_phone: doctorForm.contact_phone,
          contact_email: doctorForm.contact_email,
          rating: 5.0,
          review_count: 0
        });

      if (doctorProfileError) throw doctorProfileError;

      setIsModalOpen(false);
      onRefresh();
      toast(`Dr. ${doctorForm.first_name} ${doctorForm.last_name} created!`, 'success');

      // reset form
      setDoctorForm({
        email: '', first_name: '', last_name: '', password: '', specialty: 'General Practice',
        experience_yrs: 0, availability: 'Available Today', bg: '#e0f2fe', color: '#0369a1', description: '', clinic_name: '', contact_phone: '', contact_email: ''
      });
    } catch (e: any) {
      if (e.code === '23505') {
        toast('An account with this email already exists in the system.', 'error');
      } else {
        toast('Failed to add doctor: ' + e.message, 'error');
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
        <button className="btn-primary" onClick={openAddModal}>+ Add Doctor</button>
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
              <th>Clinic</th>
              <th>Contact Info</th>
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
                <td>{u.doctor_profiles?.specialty
                  ? <span className="role-badge doctor">{u.doctor_profiles.specialty}</span>
                  : <span style={{ color: '#64748B', fontSize: 13 }}>—</span>}
                </td>
                <td style={{ color: '#94A3B8', fontSize: 13 }}>{u.doctor_profiles?.clinic_name || '—'}</td>
                <td style={{ color: '#64748B', fontSize: 13 }}>
                  <div>{u.doctor_profiles?.contact_phone || '—'}</div>
                  <div>{u.doctor_profiles?.contact_email || ''}</div>
                </td>
                <td style={{ color: '#64748B', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-delete" style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', color: 'var(--accent-blue)' }} onClick={() => openEditModal(u)}>
                      <Pencil size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Edit
                    </button>
                    <button className="btn-delete" onClick={() => onDelete(u.id)}>
                      <Trash2 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Doctor Modal */}
      {isEditModalOpen && editingDoctor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,17,32,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-card" style={{ width: 440, transform: 'none', padding: 24, borderRadius: 16, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: 4, color: '#F1F5F9' }}>Edit Doctor</h2>
            <p style={{ color: '#64748B', marginBottom: 16, fontSize: 13 }}>{editingDoctor.email}</p>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>First Name</label><input type="text" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Last Name</label><input type="text" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>Specialty</label><input type="text" value={editForm.specialty} onChange={e => setEditForm({ ...editForm, specialty: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Experience (yrs)</label><input type="number" value={editForm.experience_yrs} onChange={e => setEditForm({ ...editForm, experience_yrs: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>Public Phone</label><input type="text" placeholder="+998 90 123 45 67" value={editForm.contact_phone} onChange={e => setEditForm({ ...editForm, contact_phone: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Public Email</label><input type="email" placeholder="contact@doctor.uz" value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Clinic</label>
              <select value={editForm.clinic_name} onChange={e => setEditForm({ ...editForm, clinic_name: e.target.value })} style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none' }}>
                <option value="">Select a clinic...</option>
                {clinics.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Bio / Description</label>
              <textarea style={{ minHeight: 80, resize: 'vertical' }} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn-primary" style={{ flex: 1, background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', boxShadow: 'none' }} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleEditDoctor} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,17,32,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-card" style={{ width: 400, transform: 'none', padding: 24, borderRadius: 16, maxHeight: '90vh', overflowY: 'auto' }}>
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
              <div className="form-group" style={{ flex: 1 }}><label>Experience (years)</label><input type="number" min="0" value={doctorForm.experience_yrs} onChange={e => setDoctorForm({ ...doctorForm, experience_yrs: parseInt(e.target.value) || 0 })} placeholder="e.g. 5" /></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>Public Phone</label><input type="text" placeholder="+998 90 123 45 67" value={doctorForm.contact_phone} onChange={e => setDoctorForm({ ...doctorForm, contact_phone: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Public Email</label><input type="email" placeholder="contact@doctor.uz" value={doctorForm.contact_email} onChange={e => setDoctorForm({ ...doctorForm, contact_email: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Clinic Name</label>
                <select
                  value={doctorForm.clinic_name}
                  onChange={e => setDoctorForm({ ...doctorForm, clinic_name: e.target.value })}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none' }}
                >
                  <option value="">Select a clinic...</option>
                  {clinics.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
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
  phone?: string;
  email?: string;
  created_at: string;
}

function ClinicsView({ toast, confirm }: {
  toast: (msg: string, type?: ToastType) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', description: '', phone: '', email: '' });
  const [editForm, setEditForm] = useState({ name: '', location: '', description: '', phone: '', email: '' });

  const openEditClinic = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setEditForm({ name: clinic.name, location: clinic.location, description: clinic.description || '', phone: clinic.phone || '', email: clinic.email || '' });
    setIsEditModalOpen(true);
  };

  const handleEditClinic = async () => {
    if (!editingClinic || !editForm.name || !editForm.location) {
      toast('Name and location are required.', 'error');
      return;
    }

    const phoneRegex = /^\+998\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (editForm.phone && !phoneRegex.test(editForm.phone)) {
      toast('Phone must be in +998XXXXXXXXX format', 'error');
      return;
    }
    if (editForm.email && !emailRegex.test(editForm.email)) {
      toast('Please enter a valid contact email', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('clinics').update({
        name: editForm.name,
        location: editForm.location,
        description: editForm.description,
        phone: editForm.phone,
        email: editForm.email
      }).eq('id', editingClinic.id);
      if (error) throw error;
      setIsEditModalOpen(false);
      toast('Clinic updated successfully.', 'success');
      fetchClinics();
    } catch (e: any) {
      toast('Failed to update: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

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
      toast('Clinic name and location are required.', 'error');
      return;
    }

    const phoneRegex = /^\+998\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (form.phone && !phoneRegex.test(form.phone)) {
      toast('Phone must be in +998XXXXXXXXX format', 'error');
      return;
    }
    if (form.email && !emailRegex.test(form.email)) {
      toast('Please enter a valid contact email', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('clinics').insert({
        name: form.name, location: form.location, description: form.description, phone: form.phone, email: form.email
      });
      if (error) throw error;
      setIsModalOpen(false);
      setForm({ name: '', location: '', description: '', phone: '', email: '' });
      toast('Clinic added successfully!', 'success');
      fetchClinics();
    } catch (e: any) {
      toast('Failed to add clinic: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClinic = async (id: string) => {
    const ok = await confirm({ title: 'Delete Clinic', message: 'This will permanently delete the clinic. This cannot be undone.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      const { error } = await supabase.from('clinics').delete().eq('id', id);
      if (error) throw error;
      toast('Clinic deleted.', 'success');
      fetchClinics();
    } catch (e: any) {
      toast('Failed to delete: ' + e.message, 'error');
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
                <th>Contact</th>
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
                  <td style={{ color: '#64748B', fontSize: 13 }}>
                    <div>{c.phone || '—'}</div>
                    <div>{c.email || ''}</div>
                  </td>
                  <td style={{ color: '#64748B', fontSize: 13, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description || '—'}</td>
                  <td style={{ color: '#64748B', fontSize: 13 }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-delete" style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', color: 'var(--accent-blue)' }} onClick={() => openEditClinic(c)}>
                        <Pencil size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDeleteClinic(c.id)}>
                        <Trash2 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Clinic Modal */}
      {isEditModalOpen && editingClinic && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,17,32,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-card" style={{ width: 450, transform: 'none', padding: 24, borderRadius: 16, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: 4, color: '#F1F5F9' }}>Edit Clinic</h2>
            <p style={{ color: '#64748B', marginBottom: 16, fontSize: 13 }}>ID: {editingClinic.id.slice(0, 8)}...</p>

            <div className="form-group">
              <label>Clinic Name</label>
              <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Phone Number</label>
                <input type="text" placeholder="+998 90 123 45 67" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Contact Email</label>
                <input type="email" placeholder="contact@clinic.uz" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea style={{ minHeight: 80, resize: 'vertical' }} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn-primary" style={{ flex: 1, background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', boxShadow: 'none' }} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleEditClinic} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Clinic Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,17,32,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-card" style={{ width: 450, transform: 'none', padding: 24, borderRadius: 16, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontFamily: 'Outfit', color: '#F1F5F9' }}>Add New Clinic</h2>

            <div className="form-group">
              <label>Clinic Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Central Medical Center" />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Tashkent, Mirzo Ulugbek District" />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Phone Number</label>
                <input type="text" placeholder="+998 90 123 45 67" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Contact Email</label>
                <input type="email" placeholder="contact@clinic.uz" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
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
  const { toast, confirm, toasts, removeToast, confirmOptions, handleConfirm, handleCancel } = useDialog();

  // Check existing session
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // 1. Try auth_id first
        let { data: profile } = await supabase
          .from('profiles')
          .select('role, id')
          .eq('auth_id', session.user.id)
          .single();

        // 2. Fallback to email if auth_id link is missing (handles older accounts)
        if (!profile && session.user.email) {
          const { data: byEmail } = await supabase
            .from('profiles')
            .select('role, id')
            .eq('email', session.user.email)
            .single();
          
          if (byEmail) {
            profile = byEmail;
            // Auto-link auth_id for future fast lookups
            await supabase.from('profiles').update({ auth_id: session.user.id }).eq('id', byEmail.id);
          }
        }

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
        supabase.from('profiles').select('*, doctor_profiles(specialty, experience_yrs, clinic_name, description, availability, bg, color, contact_phone, contact_email)').order('created_at', { ascending: false }),
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
    const ok = await confirm({
      title: 'Delete User',
      message: `Permanently delete "${user?.email}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      toast('User deleted successfully.', 'success');
      await fetchData();
    } catch (e: any) {
      toast('Failed to delete: ' + e.message, 'error');
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
          <div className="brand-icon" style={{ padding: 0, overflow: 'hidden' }}>
            <img src={logoImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="L" />
          </div>
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
          <div className="brand-icon" style={{ padding: 0, overflow: 'hidden' }}>
            <img src={logoImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
          </div>
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
                <HeartPulse size={18} /> Doctors
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
            {view === 'doctors' && role === 'ADMIN' && <DoctorsView users={users} onDelete={handleDeleteUser} onRefresh={fetchData} toast={toast} />}
            {view === 'clinics' && role === 'ADMIN' && <ClinicsView toast={toast} confirm={confirm} />}
            {view === 'appointments' && <AppointmentsView appointments={role === 'DOCTOR' ? appointments.filter((a: any) => a.doctor_id === profileId) : appointments} role={role} onRefresh={fetchData} profileId={profileId} toast={toast} />}
            {view === 'records' && role === 'DOCTOR' && <RecordsView doctorProfileId={profileId} />}
          </>
        )}
      </main>
      <Toast toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog options={confirmOptions} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}

export default App;
