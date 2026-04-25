-- NavbatUz Database Schema for Supabase
-- Run this in Supabase Dashboard → SQL Editor

-- Enums
CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
CREATE TYPE appointment_status AS ENUM ('UPCOMING', 'COMPLETED', 'CANCELLED');
CREATE TYPE consultation_type AS ENUM ('IN_PERSON', 'ONLINE');

-- Profiles table (decoupled from auth.users so doctors can exist independently)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'PATIENT',
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Doctor profiles
CREATE TABLE doctor_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  experience_yrs INT DEFAULT 0,
  rating FLOAT DEFAULT 0.0,
  review_count INT DEFAULT 0,
  availability TEXT,
  bg TEXT,
  color TEXT
);

-- Appointments
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status appointment_status DEFAULT 'UPCOMING',
  date_time TIMESTAMPTZ NOT NULL,
  type consultation_type DEFAULT 'IN_PERSON',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent Double Booking at the Database Level
-- Ensures a doctor cannot have two non-cancelled appointments at the exact same time
CREATE UNIQUE INDEX unique_active_appointment ON appointments (doctor_id, date_time) WHERE status != 'CANCELLED';

-- Medical records
CREATE TABLE medical_records (
  id SERIAL PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  diagnosis TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  prescriptions TEXT[] DEFAULT '{}',
  notes TEXT,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════
-- RLS HELPER FUNCTIONS (Prevent Infinite Recursion)
-- ═══════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = auth.uid() AND role = 'ADMIN');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = auth.uid() AND role IN ('DOCTOR', 'ADMIN'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════

-- Profiles: users see own (by auth_id or matching verified email), doctors/admins see all, and ANYONE can see DOCTORS. Users update own (by auth_id or matching verified email).
CREATE POLICY "Profiles visibility" ON profiles FOR SELECT USING (
  auth.uid() = auth_id OR 
  email = (auth.jwt() ->> 'email') OR
  public.is_staff() OR
  role = 'DOCTOR'
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (
  auth.uid() = auth_id OR 
  email = (auth.jwt() ->> 'email')
);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = auth_id AND role = 'PATIENT');

-- Doctor profiles: everyone can read
CREATE POLICY "Doctor profiles readable" ON doctor_profiles FOR SELECT USING (true);
CREATE POLICY "Doctor profiles insertable" ON doctor_profiles FOR INSERT WITH CHECK (true);

-- Appointments: users can see their own, create their own
CREATE POLICY "Users see own appointments" ON appointments FOR SELECT
  USING (
    patient_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR doctor_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
  );
CREATE POLICY "Users create own appointments" ON appointments FOR INSERT
  WITH CHECK (patient_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users update own appointments" ON appointments FOR UPDATE
  USING (
    patient_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR doctor_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
  );

-- Medical records: patients see their own, doctors insert and see
CREATE POLICY "Patients see own records" ON medical_records FOR SELECT
  USING (patient_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Doctors see patient records" ON medical_records FOR SELECT
  USING (doctor_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Doctors insert records" ON medical_records FOR INSERT
  WITH CHECK (doctor_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- Reviews: everyone can read, authenticated users can create
CREATE POLICY "Reviews readable" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON reviews FOR INSERT
  WITH CHECK (patient_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- Global Admin Bypasses
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can insert all profiles" ON profiles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete all profiles" ON profiles FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins can update all doctor_profiles" ON doctor_profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete all doctor_profiles" ON doctor_profiles FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins can view all appointments" ON appointments FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all appointments" ON appointments FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete all appointments" ON appointments FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins view all records" ON medical_records FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins insert all records" ON medical_records FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins update all records" ON medical_records FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins delete all records" ON medical_records FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════
-- TRIGGER: Auto-create profile on signup
-- ═══════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, email, first_name)
  VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1))
  ON CONFLICT (email)
  DO UPDATE SET auth_id = EXCLUDED.auth_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════
-- TRIGGER: Prevent Privilege Escalation
-- ═══════════════════════════════════════

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is trying to change their role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow if the user making the change is an ADMIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'ADMIN') THEN
      -- Otherwise, force the role to stay the same
      NEW.role = OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_role_security
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- ═══════════════════════════════════════
-- RPC: Delete My Account
-- ═══════════════════════════════════════

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void AS $$
BEGIN
  -- Deleting the auth.users row automatically cascades 
  -- and deletes the profile, appointments, and everything else
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════
-- MANUALLY PROMOTE FIRST ADMIN
-- ═══════════════════════════════════════
-- Run this individually after signing up your primary account:
-- UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'sadullayevshohjahon990@gmail.com';

-- ═══════════════════════════════════════
-- DB MIGRATION: Add phone and email fields
-- ═══════════════════════════════════════
-- Run these ALTER TABLE commands in Supabase SQL Editor:
/*
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;
*/
