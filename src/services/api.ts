import { supabase } from './supabase';

let currentUser: any = null;

export function setCurrentUser(user: any) { currentUser = user; }
export function getCurrentUser() { return currentUser; }

// Legacy compat — no longer needed but kept for screens that still reference it
export function setAuthToken(_: string | null) {}
export function getAuthToken() { return null; }

// ─── Auth (Supabase OTP) ──────────────────────────────────
export async function requestOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw new Error(error.message);
  return { message: `Verification code sent to ${email}` };
}

export async function verifyOtp(email: string, code: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'email',
  });
  if (error) throw new Error(error.message);

  // Fetch user profile from our profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', data.user?.id)
    .single();

  const user = {
    id: profile?.id || data.user?.id,
    authId: data.user?.id,
    email: data.user?.email,
    role: profile?.role || 'PATIENT',
    firstName: profile?.first_name || email.split('@')[0],
    lastName: profile?.last_name || '',
  };

  setCurrentUser(user);
  return { access_token: data.session?.access_token, user };
}

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  return profile;
}

export async function signOut() {
  await supabase.auth.signOut();
  setCurrentUser(null);
}

// ─── Doctors ───────────────────────────────────────────────
export async function getDoctors(specialty?: string) {
  let query = supabase
    .from('profiles')
    .select('*, doctor_profiles(*)')
    .eq('role', 'DOCTOR');

  if (specialty && specialty !== 'All') {
    query = query.eq('doctor_profiles.specialty', specialty);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Transform to match the frontend's expected format
  return (data || [])
    .filter(doc => doc.doctor_profiles) // only doctors with a profile
    .map(doc => ({
      id: doc.id,
      firstName: doc.first_name,
      lastName: doc.last_name,
      email: doc.email,
      doctorProfile: doc.doctor_profiles ? {
        specialty: doc.doctor_profiles.specialty,
        experienceYrs: doc.doctor_profiles.experience_yrs,
        experience: doc.doctor_profiles.experience_yrs,
        rating: doc.doctor_profiles.rating,
        reviewCount: doc.doctor_profiles.review_count,
        priceAmount: doc.doctor_profiles.price_amount,
        currency: doc.doctor_profiles.currency,
        availability: doc.doctor_profiles.availability,
        bg: doc.doctor_profiles.bg,
        color: doc.doctor_profiles.color,
      } : null,
      reviewsReceived: Array(doc.doctor_profiles?.review_count || 0).fill({
        rating: doc.doctor_profiles?.rating || 5,
      }),
    }));
}

export async function getDoctor(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, doctor_profiles(*)')
    .eq('id', id)
    .eq('role', 'DOCTOR')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Helper: get current user's profile id
async function getMyProfileId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .single();
  return profile?.id || null;
}

// ─── Appointments ──────────────────────────────────────────
export async function getAppointments() {
  const profileId = await getMyProfileId();
  if (!profileId) return [];

  const { data, error } = await supabase
    .from('appointments')
    .select('*, doctor:profiles!doctor_id(first_name, last_name, doctor_profiles(specialty))')
    .eq('patient_id', profileId)
    .order('date_time', { ascending: false });

  if (error) throw new Error(error.message);

  // Transform to match frontend format
  return (data || []).map(app => ({
    id: app.id,
    status: app.status,
    dateTime: app.date_time,
    type: app.type,
    notes: app.notes,
    price: app.price,
    doctor: app.doctor ? {
      firstName: app.doctor.first_name,
      lastName: app.doctor.last_name,
      doctorProfile: app.doctor.doctor_profiles,
    } : { firstName: 'Doctor', lastName: '', doctorProfile: { specialty: 'Specialist' } },
  }));
}

export async function createAppointment(data: {
  doctorId: string;
  dateTime: string;
  type?: string;
  notes?: string;
}) {
  const profileId = await getMyProfileId();
  if (!profileId) throw new Error('Not authenticated');

  const { error } = await supabase.from('appointments').insert({
    patient_id: profileId,
    doctor_id: data.doctorId,
    date_time: data.dateTime,
    type: data.type || 'IN_PERSON',
    notes: data.notes,
  });

  if (error) throw new Error(error.message);
  return { message: 'Appointment booked successfully' };
}

// ─── Medical Records ───────────────────────────────────────
export async function getRecords() {
  const profileId = await getMyProfileId();
  if (!profileId) return [];

  const { data, error } = await supabase
    .from('medical_records')
    .select('*, doctor:profiles!doctor_id(first_name, last_name)')
    .eq('patient_id', profileId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map(rec => ({
    id: rec.id,
    diagnosis: rec.diagnosis,
    prescriptions: rec.prescriptions,
    notes: rec.notes,
    attachments: rec.attachments,
    createdAt: rec.created_at,
    date: rec.date,
    doctor: rec.doctor ? {
      firstName: rec.doctor.first_name,
      lastName: rec.doctor.last_name,
    } : { firstName: 'Doctor', lastName: '' },
  }));
}

// ─── Reviews ───────────────────────────────────────────────
export async function getReviews(doctorId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, patient:profiles!patient_id(first_name, last_name)')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createReview(data: { doctorId: string; rating: number; comment?: string }) {
  const profileId = await getMyProfileId();
  if (!profileId) throw new Error('Not authenticated');

  const { error } = await supabase.from('reviews').insert({
    patient_id: profileId,
    doctor_id: data.doctorId,
    rating: data.rating,
    comment: data.comment,
  });

  if (error) throw new Error(error.message);
  return { message: 'Review submitted' };
}
