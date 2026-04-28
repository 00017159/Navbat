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
import { useTranslation } from 'react-i18next';
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
            {options.confirmLabel ? 'Cancel' : 'Cancel'}
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
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp');
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestOtp = async () => {
    if (!email.includes('@')) { setError(t('auth.invalid_email')); return; }
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
    if (otp.length < 6) { setError(t('auth.otp_too_short')); return; }
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
    if (!email.includes('@')) { setError(t('auth.invalid_email')); return; }
    if (password.length < 6) { setError(t('auth.password_too_short')); return; }
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
      throw new Error(t('auth.access_denied'));
    }
    onLogin(profile.role, profile.id);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 16 }}>
          {['en', 'uz', 'ru'].map(l => (
            <button 
              key={l}
              onClick={() => i18n.changeLanguage(l)}
              style={{ 
                padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                background: i18n.language === l ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: i18n.language === l ? '#60A5FA' : '#94A3B8',
                border: '1px solid ' + (i18n.language === l ? 'rgba(59, 130, 246, 0.4)' : 'rgba(51, 65, 85, 0.5)'),
                cursor: 'pointer'
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <h1>{t('auth.title')}</h1>
        <p>{t('auth.description')}</p>

        {error && <div className="login-error">{error}</div>}

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            className={`btn-primary`}
            style={{ flex: 1, fontSize: 13, padding: '8px 0', background: loginMode === 'otp' ? '#1E63D3' : '#1E293B', border: loginMode === 'otp' ? 'none' : '1px solid #334155', boxShadow: loginMode === 'otp' ? undefined : 'none' }}
            onClick={() => { setLoginMode('otp'); setStep('email'); setError(''); }}
          >
            {t('auth.admin_login')}
          </button>
          <button
            className={`btn-primary`}
            style={{ flex: 1, fontSize: 13, padding: '8px 0', background: loginMode === 'password' ? '#1E63D3' : '#1E293B', border: loginMode === 'password' ? 'none' : '1px solid #334155', boxShadow: loginMode === 'password' ? undefined : 'none' }}
            onClick={() => { setLoginMode('password'); setStep('email'); setError(''); }}
          >
            {t('auth.doctor_login')}
          </button>
        </div>

        {loginMode === 'otp' ? (
          // OTP Flow
          step === 'email' ? (
            <>
              <div className="form-group">
                <label>{t('auth.email')}</label>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRequestOtp()}
                />
              </div>
              <button className="btn-primary" onClick={handleRequestOtp} disabled={loading}>
                {loading ? t('common.loading') : t('auth.send_code')}
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>{t('auth.verify_code')}</label>
                <input
                  type="text"
                  placeholder={t('auth.verify_placeholder')}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                  maxLength={6}
                />
              </div>
              <button className="btn-primary" onClick={handleVerifyOtp} disabled={loading}>
                {loading ? t('auth.verifying') : t('auth.sign_in')}
              </button>
              <button
                style={{ marginTop: 12, background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter' }}
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              >
                {t('auth.back_to_email')}
              </button>
            </>
          )
        ) : (
          // Password Flow
          <>
            <div className="form-group">
              <label>{t('auth.email')}</label>
              <input
                type="email"
                placeholder="doctor@clinic.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
              />
            </div>
            <div className="form-group">
              <label>{t('auth.password')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password_placeholder')}
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
              {loading ? t('auth.signing_in') : t('auth.sign_in')}
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
  const { t } = useTranslation();

  return (
    <>
      <div className="page-header">
        <h1>{t('dashboard.title')}</h1>
        <p>{t('dashboard.subtitle')}</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card blue">
          <div className="metric-icon blue"><Users size={24} /></div>
          <div className="metric-value">{totalPatients}</div>
          <div className="metric-label">{t('dashboard.total_patients')}</div>
        </div>
        <div className="metric-card green">
          <div className="metric-icon green"><Activity size={24} /></div>
          <div className="metric-value">{totalDoctors}</div>
          <div className="metric-label">{t('dashboard.active_doctors')}</div>
        </div>
        <div className="metric-card purple">
          <div className="metric-icon purple"><Clock size={24} /></div>
          <div className="metric-value">{upcomingCount}</div>
          <div className="metric-label">{t('dashboard.upcoming_visits')}</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-icon amber"><UserCheck size={24} /></div>
          <div className="metric-value">{completedCount}</div>
          <div className="metric-label">{t('dashboard.completed')}</div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="table-section">
        <div className="table-header">
          <h2>{t('dashboard.recent_appointments')}</h2>
          <span className="badge">{appointments.length} {t('common.total')}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>{t('appointments.patient')}</th>
              <th>{t('appointments.doctor')}</th>
              <th>{t('appointments.date_time')}</th>
              <th>{t('appointments.type')}</th>
              <th>{t('appointments.status')}</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr><td colSpan={5} className="empty-state">{t('dashboard.no_appointments')}</td></tr>
            ) : appointments.slice(0, 10).map(a => (
              <tr key={a.id}>
                <td>{a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : '—'}</td>
                <td>{a.doctor ? `${a.doctor.first_name} ${a.doctor.last_name}` : '—'}</td>
                <td style={{ color: '#94A3B8' }}>{new Date(a.date_time).toLocaleString()}</td>
                <td style={{ color: '#94A3B8' }}>{t('type.' + a.type?.toLowerCase(), a.type)}</td>
                <td><span className={`status-badge ${a.status?.toLowerCase()}`}>{t('status.' + a.status?.toLowerCase(), a.status)}</span></td>
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
  const { t } = useTranslation();
  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <h1>{t('users.title')}</h1>
        <p>{t('users.subtitle')}</p>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h2>{t('users.all_users')}</h2>
          <span className="badge">{users.length} {t('common.registered')}</span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder={t('users.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>{t('users.col_user')}</th>
              <th>{t('users.col_role')}</th>
              <th>{t('users.col_joined')}</th>
              <th>{t('users.col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="empty-state">{t('users.no_users')}</td></tr>
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
                <td><span className={`role-badge ${u.role?.toLowerCase()}`}>{t('roles.' + u.role?.toLowerCase(), u.role)}</span></td>
                <td style={{ color: '#64748B', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  {u.role !== 'ADMIN' && (
                    <button className="btn-delete" onClick={() => onDelete(u.id)}>
                      <Trash2 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {t('users.delete_btn')}
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
  const { t } = useTranslation();
  const [recordForm, setRecordForm] = useState({ diagnosis: '', notes: '' });

  const filtered = appointments.filter(a =>
    a.patient?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.patient?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.patient?.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.doctor?.first_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddRecord = async () => {
    if (!selectedAppt || !recordForm.diagnosis) {
      toast(t('appointments.diagnosis_required'), 'error');
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
      toast(t('appointments.save_failed') + ': ' + e.message, 'error');
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
      toast(t('appointments.no_month_appointments') + ' ' + monthName + ' ' + currentYear, 'info');
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
          <h1>{role === 'DOCTOR' ? t('appointments.my_schedule') : t('appointments.title')}</h1>
          <p>{role === 'DOCTOR' ? t('appointments.subtitle_doctor') : t('appointments.subtitle_admin')}</p>
        </div>
        {role === 'DOCTOR' && (
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleDownloadXlsx}>
            <Download size={16} /> {t('appointments.monthly_report')}
          </button>
        )}
      </div>

      <div className="table-section">
        <div className="table-header">
          <h2>{t('appointments.all_appointments')}</h2>
          <span className="badge">{appointments.length} {t('common.total')}</span>
        </div>
        <div className="search-bar">
          <input type="text" placeholder={t('appointments.search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <table>
          <thead>
            <tr>
              <th>{t('appointments.patient')}</th>
              <th>{t('appointments.doctor')}</th>
              <th>{t('appointments.date_time')}</th>
              <th>{t('appointments.type')}</th>
              <th>{t('appointments.status')}</th>
              <th>{t('appointments.notes')}</th>
              <th>{role === 'DOCTOR' || role === 'ADMIN' ? t('appointments.actions') : ''}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="empty-state">{t('appointments.no_appointments')}</td></tr>
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
                <td style={{ color: '#94A3B8' }}>{t('type.' + a.type?.toLowerCase(), a.type)}</td>
                <td><span className={`status-badge ${a.status?.toLowerCase()}`}>{t('status.' + a.status?.toLowerCase(), a.status)}</span></td>
                <td style={{ color: '#64748B', fontSize: 13, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.notes || ''}>
                  {a.notes || '—'}
                </td>
                <td>
                  {(role === 'DOCTOR' || role === 'ADMIN') && a.status !== 'COMPLETED' ? (
                    <button 
                      className="btn-primary" 
                      style={{ padding: '6px 12px', fontSize: 12 }} 
                      onClick={() => { 
                        if (new Date(a.date_time) > new Date()) {
                          toast(t('appointments.future_appointment_warning'), 'info');
                        } else {
                          setSelectedAppt(a); 
                          setIsModalOpen(true); 
                        }
                      }}
                    >
                      {t('appointments.write_record')}
                    </button>
                  ) : <span style={{ color: '#64748B', fontSize: 13 }}>{a.status === 'COMPLETED' ? '—' : ''}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedAppt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,17,32,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-card" style={{ width: 500, transform: 'none', padding: 24, borderRadius: 16 }}>
            <h2 style={{ marginTop: 0, marginBottom: 8, fontFamily: 'Outfit', color: '#F1F5F9' }}>{t('appointments.record_modal_title')}</h2>
            <p style={{ color: '#94A3B8', marginBottom: 20 }}>{t('appointments.record_patient_label')}: <strong style={{ color: '#F1F5F9' }}>{selectedAppt.patient?.first_name} {selectedAppt.patient?.last_name}</strong></p>

            <div className="form-group">
              <label>{t('appointments.diagnosis_label')}</label>
              <textarea
                style={{ minHeight: 80, resize: 'vertical' }}
                value={recordForm.diagnosis}
                onChange={e => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                placeholder={t('appointments.diagnosis_placeholder')}
              />
            </div>

            <div className="form-group">
              <label>{t('appointments.prescriptions_label')}</label>
              <textarea
                style={{ minHeight: 80, resize: 'vertical' }}
                value={recordForm.notes}
                onChange={e => setRecordForm({ ...recordForm, notes: e.target.value })}
                placeholder={t('appointments.prescriptions_placeholder')}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-primary" style={{ flex: 1, background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', boxShadow: 'none' }} onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</button>
              <button className="btn-primary" style={{ flex: 1, background: '#10B981' }} onClick={handleAddRecord} disabled={loading}>{loading ? t('common.saving') : t('appointments.save_complete')}</button>
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
  const { t } = useTranslation();

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
      toast(t('doctors.phone_format'), 'error');
      return;
    }
    if (editForm.contact_email && !emailRegex.test(editForm.contact_email)) {
      toast(t('doctors.email_invalid'), 'error');
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
      toast(t('doctors.required_fields'), 'error');
      return;
    }
    if (!doctorForm.password || doctorForm.password.length < 6) {
      toast(t('doctors.password_min'), 'error');
      return;
    }

    const phoneRegex = /^\+998\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (doctorForm.contact_phone && !phoneRegex.test(doctorForm.contact_phone)) {
      toast(t('doctors.phone_format'), 'error');
      return;
    }
    if (doctorForm.contact_email && !emailRegex.test(doctorForm.contact_email)) {
      toast(t('doctors.email_invalid'), 'error');
      return;
    }
    if (!emailRegex.test(doctorForm.email)) {
      toast(t('doctors.login_email_invalid'), 'error');
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
      toast(`Dr. ${doctorForm.first_name} ${doctorForm.last_name} ${t('doctors.doctor_created')}`, 'success');

      // reset form
      setDoctorForm({
        email: '', first_name: '', last_name: '', password: '', specialty: 'General Practice',
        experience_yrs: 0, availability: 'Available Today', bg: '#e0f2fe', color: '#0369a1', description: '', clinic_name: '', contact_phone: '', contact_email: ''
      });
    } catch (e: any) {
      if (e.code === '23505') {
        toast(t('doctors.duplicate_email'), 'error');
      } else {
        toast(t('doctors.add_failed') + ': ' + e.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{t('doctors.title')}</h1>
          <p>{t('doctors.subtitle')}</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>{t('doctors.add_doctor')}</button>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h2>{t('doctors.active_providers')}</h2>
          <span className="badge">{doctors.length} {t('common.total')}</span>
        </div>
        <div className="search-bar">
          <input type="text" placeholder={t('doctors.search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <table>
          <thead>
            <tr>
              <th>{t('doctors.col_provider')}</th>
              <th>{t('doctors.col_specialty')}</th>
              <th>{t('doctors.col_clinic')}</th>
              <th>{t('doctors.col_contact')}</th>
              <th>{t('doctors.col_joined')}</th>
              <th>{t('doctors.col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="empty-state">{t('doctors.no_doctors')}</td></tr>
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
                      <Pencil size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />{t('common.edit')}
                    </button>
                    <button className="btn-delete" onClick={() => onDelete(u.id)}>
                      <Trash2 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />{t('common.delete')}
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
            <h2 style={{ marginTop: 0, marginBottom: 4, color: '#F1F5F9' }}>{t('doctors.edit_doctor_title')}</h2>
            <p style={{ color: '#64748B', marginBottom: 16, fontSize: 13 }}>{editingDoctor.email}</p>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>{t('doctors.label_first_name')}</label><input type="text" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>{t('doctors.label_last_name')}</label><input type="text" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>{t('doctors.label_specialty')}</label><input type="text" value={editForm.specialty} onChange={e => setEditForm({ ...editForm, specialty: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>{t('doctors.label_experience_yrs')}</label><input type="number" value={editForm.experience_yrs} onChange={e => setEditForm({ ...editForm, experience_yrs: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>{t('doctors.label_phone')}</label><input type="text" placeholder="+998 90 123 45 67" value={editForm.contact_phone} onChange={e => setEditForm({ ...editForm, contact_phone: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>{t('doctors.label_pub_email')}</label><input type="email" placeholder="contact@doctor.uz" value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>{t('doctors.label_clinic')}</label>
              <select value={editForm.clinic_name} onChange={e => setEditForm({ ...editForm, clinic_name: e.target.value })} style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none' }}>
                <option value="">{t('doctors.select_clinic')}</option>
                {clinics.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>{t('doctors.label_description')}</label>
              <textarea style={{ minHeight: 80, resize: 'vertical' }} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn-primary" style={{ flex: 1, background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', boxShadow: 'none' }} onClick={() => setIsEditModalOpen(false)}>{t('common.cancel')}</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleEditDoctor} disabled={loading}>{loading ? t('common.saving') : t('common.save_changes')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,17,32,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-card" style={{ width: 400, transform: 'none', padding: 24, borderRadius: 16, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontFamily: 'Outfit', color: '#F1F5F9' }}>{t('doctors.add_doctor_title')}</h2>

            <div className="form-group"><label>{t('doctors.label_email')}</label><input type="email" value={doctorForm.email} onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })} placeholder="dr.smith@clinic.uz" /></div>
            <div className="form-group">
              <label>{t('doctors.label_password')}</label>
              <input type="text" value={doctorForm.password} onChange={e => setDoctorForm({ ...doctorForm, password: e.target.value })} placeholder="Min 6 characters" />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>{t('doctors.label_first_name')}</label><input type="text" value={doctorForm.first_name} onChange={e => setDoctorForm({ ...doctorForm, first_name: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>{t('doctors.label_last_name')}</label><input type="text" value={doctorForm.last_name} onChange={e => setDoctorForm({ ...doctorForm, last_name: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>{t('doctors.label_specialty')}</label><input type="text" value={doctorForm.specialty} onChange={e => setDoctorForm({ ...doctorForm, specialty: e.target.value })} placeholder="e.g. Cardiologist" /></div>
              <div className="form-group" style={{ flex: 1 }}><label>{t('doctors.label_experience')}</label><input type="number" min="0" value={doctorForm.experience_yrs} onChange={e => setDoctorForm({ ...doctorForm, experience_yrs: parseInt(e.target.value) || 0 })} placeholder="e.g. 5" /></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}><label>{t('doctors.label_phone')}</label><input type="text" placeholder="+998 90 123 45 67" value={doctorForm.contact_phone} onChange={e => setDoctorForm({ ...doctorForm, contact_phone: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>{t('doctors.label_pub_email')}</label><input type="email" placeholder="contact@doctor.uz" value={doctorForm.contact_email} onChange={e => setDoctorForm({ ...doctorForm, contact_email: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>{t('doctors.label_clinic')}</label>
                <select value={doctorForm.clinic_name} onChange={e => setDoctorForm({ ...doctorForm, clinic_name: e.target.value })} style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none' }}>
                  <option value="">{t('doctors.select_clinic')}</option>
                  {clinics.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            <div className="form-group">
              <label>{t('doctors.label_bio')}</label>
              <textarea style={{ minHeight: 80, resize: 'vertical' }} value={doctorForm.description} onChange={e => setDoctorForm({ ...doctorForm, description: e.target.value })} placeholder="Write a brief background about the doctor..." />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-primary" style={{ flex: 1, background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', boxShadow: 'none' }} onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddDoctor} disabled={loading}>{loading ? t('doctors.creating') : t('doctors.create_doctor')}</button>
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
  const { t } = useTranslation();

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
        <h1>{t('records.title')}</h1>
        <p>{t('records.subtitle')}</p>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h2>{t('records.my_records')}</h2>
          <span className="badge">{records.length} {t('common.total')}</span>
        </div>
        <div className="search-bar">
          <input type="text" placeholder={t('records.search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <table>
          <thead>
            <tr>
              <th>{t('records.col_patient')}</th>
              <th>{t('records.col_diagnosis')}</th>
              <th>{t('records.col_notes')}</th>
              <th>{t('records.col_date')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="empty-state">{t('records.no_records')}</td></tr>
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
  const { t } = useTranslation();

  const openEditClinic = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setEditForm({ name: clinic.name, location: clinic.location, description: clinic.description || '', phone: clinic.phone || '', email: clinic.email || '' });
    setIsEditModalOpen(true);
  };

  const handleEditClinic = async () => {
    if (!editingClinic || !editForm.name || !editForm.location) {
      toast(t('clinics.name_required'), 'error');
      return;
    }

    const phoneRegex = /^\+998\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (editForm.phone && !phoneRegex.test(editForm.phone)) {
      toast(t('clinics.phone_format'), 'error');
      return;
    }
    if (editForm.email && !emailRegex.test(editForm.email)) {
      toast(t('clinics.email_invalid'), 'error');
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
      toast(t('clinics.update_success'), 'success');
      fetchClinics();
    } catch (e: any) {
      toast(t('clinics.update_failed') + ': ' + e.message, 'error');
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
      toast(t('clinics.name_location_required'), 'error');
      return;
    }

    const phoneRegex = /^\+998\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (form.phone && !phoneRegex.test(form.phone)) {
      toast(t('clinics.phone_format'), 'error');
      return;
    }
    if (form.email && !emailRegex.test(form.email)) {
      toast(t('clinics.email_invalid'), 'error');
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
      toast(t('clinics.add_success'), 'success');
      fetchClinics();
    } catch (e: any) {
      toast(t('clinics.add_failed') + ': ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClinic = async (id: string) => {
    const ok = await confirm({ title: t('clinics.delete_title'), message: t('clinics.delete_message'), confirmLabel: t('common.delete'), danger: true });
    if (!ok) return;
    try {
      const { error } = await supabase.from('clinics').delete().eq('id', id);
      if (error) throw error;
      toast(t('clinics.delete_success'), 'success');
      fetchClinics();
    } catch (e: any) {
      toast(t('clinics.delete_failed') + ': ' + e.message, 'error');
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
          <h1>{t('clinics.title')}</h1>
          <p>{t('clinics.subtitle')}</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setIsModalOpen(true)}>{t('clinics.add_clinic')}</button>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h2>{t('clinics.all_clinics')}</h2>
          <span className="badge">{clinics.length} {t('common.total')}</span>
        </div>
        <div className="search-bar">
          <input type="text" placeholder={t('clinics.search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="table-scroll-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('clinics.col_name')}</th>
                <th>{t('clinics.col_location')}</th>
                <th>{t('clinics.col_contact')}</th>
                <th>{t('clinics.col_description')}</th>
                <th>{t('clinics.col_added')}</th>
                <th>{t('clinics.col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">{t('clinics.no_clinics')}</td></tr>
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
                        <Pencil size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />{t('common.edit')}
                      </button>
                      <button className="btn-delete" onClick={() => handleDeleteClinic(c.id)}>
                        <Trash2 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />{t('common.delete')}
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
            <h2 style={{ marginTop: 0, marginBottom: 4, color: '#F1F5F9' }}>{t('clinics.edit_clinic_title')}</h2>
            <p style={{ color: '#64748B', marginBottom: 16, fontSize: 13 }}>ID: {editingClinic.id.slice(0, 8)}...</p>

            <div className="form-group">
              <label>{t('clinics.label_name')}</label>
              <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>{t('clinics.label_location')}</label>
              <input type="text" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>{t('clinics.label_phone')}</label>
                <input type="text" placeholder="+998 90 123 45 67" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>{t('clinics.label_email')}</label>
                <input type="email" placeholder="contact@clinic.uz" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>{t('clinics.label_description')}</label>
              <textarea style={{ minHeight: 80, resize: 'vertical' }} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn-primary" style={{ flex: 1, background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', boxShadow: 'none' }} onClick={() => setIsEditModalOpen(false)}>{t('common.cancel')}</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleEditClinic} disabled={saving}>{saving ? t('common.saving') : t('common.save_changes')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Clinic Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,17,32,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="login-card" style={{ width: 450, transform: 'none', padding: 24, borderRadius: 16, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontFamily: 'Outfit', color: '#F1F5F9' }}>{t('clinics.add_clinic_title')}</h2>

            <div className="form-group">
              <label>{t('clinics.label_name')}</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Central Medical Center" />
            </div>

            <div className="form-group">
              <label>{t('clinics.label_location')}</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Tashkent, Mirzo Ulugbek District" />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>{t('clinics.label_phone')}</label>
                <input type="text" placeholder="+998 90 123 45 67" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>{t('clinics.label_email')}</label>
                <input type="email" placeholder="contact@clinic.uz" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label>{t('clinics.label_description')}</label>
              <textarea style={{ minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the clinic..." />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-primary" style={{ flex: 1, background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', boxShadow: 'none' }} onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddClinic} disabled={saving}>{saving ? t('clinics.adding') : t('clinics.add_btn')}</button>
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
  const { t, i18n } = useTranslation();

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
      title: t('users.delete_title'),
      message: `${t('users.delete_message')} (${user?.email})`,
      confirmLabel: t('common.delete'),
      danger: true,
    });
    if (!ok) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      toast(t('users.delete_success'), 'success');
      await fetchData();
    } catch (e: any) {
      toast(t('users.delete_failed') + ': ' + e.message, 'error');
    }
  };

  // Loading state
  if (authed === null) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span style={{ color: '#64748B' }}>{t('session.checking')}</span>
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
            <span>{role === 'ADMIN' ? t('sidebar.admin_portal') : t('sidebar.doctor_dashboard')}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => navTo('dashboard')}>
            <LayoutDashboard size={18} /> {t('sidebar.dashboard')}
          </button>

          {role === 'ADMIN' && (
            <>
              <button className={`nav-item ${view === 'users' ? 'active' : ''}`} onClick={() => navTo('users')}>
                <Users size={18} /> {t('sidebar.users')}
              </button>
              <button className={`nav-item ${view === 'doctors' ? 'active' : ''}`} onClick={() => navTo('doctors')}>
                <HeartPulse size={18} /> {t('sidebar.doctors')}
              </button>
              <button className={`nav-item ${view === 'clinics' ? 'active' : ''}`} onClick={() => navTo('clinics')}>
                <Building2 size={18} /> {t('sidebar.clinics')}
              </button>
            </>
          )}

          <button className={`nav-item ${view === 'appointments' ? 'active' : ''}`} onClick={() => navTo('appointments')}>
            <Calendar size={18} /> {role === 'ADMIN' ? t('sidebar.appointments') : t('sidebar.my_schedule')}
          </button>

          {role === 'DOCTOR' && (
            <button className={`nav-item ${view === 'records' ? 'active' : ''}`} onClick={() => navTo('records')}>
              <FileText size={18} /> {t('sidebar.records')}
            </button>
          )}

          <div style={{ marginTop: 'auto', padding: '12px 0' }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8, padding: '0 12px' }}>
              {['en', 'uz', 'ru'].map(l => (
                <button 
                  key={l}
                  onClick={() => i18n.changeLanguage(l)}
                  style={{ 
                    flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    background: i18n.language === l ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    color: i18n.language === l ? '#60A5FA' : '#94A3B8',
                    border: '1px solid ' + (i18n.language === l ? 'rgba(59, 130, 246, 0.4)' : 'rgba(51, 65, 85, 0.5)'),
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <button className="nav-item nav-item-logout" onClick={handleLogout}>
              <LogOut size={18} /> {t('sidebar.logout')}
            </button>
          </div>
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
