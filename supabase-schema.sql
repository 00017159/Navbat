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

-- Profiles: everyone can read, users update their own (matched via auth_id)
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = auth_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (true);

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

-- Medical records: patients see their own
CREATE POLICY "Patients see own records" ON medical_records FOR SELECT
  USING (patient_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- Reviews: everyone can read, authenticated users can create
CREATE POLICY "Reviews readable" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON reviews FOR INSERT
  WITH CHECK (patient_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- Global Admin Bypasses
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Admins can insert all profiles" ON profiles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Admins can delete all profiles" ON profiles FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Admins can update all doctor_profiles" ON doctor_profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Admins can delete all doctor_profiles" ON doctor_profiles FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Admins can view all appointments" ON appointments FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'ADMIN'));
  
CREATE POLICY "Admins can update all appointments" ON appointments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'ADMIN'));
  
CREATE POLICY "Admins can delete all appointments" ON appointments FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'ADMIN'));

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
-- SEED: Sample doctors (no auth account needed)
-- ═══════════════════════════════════════

INSERT INTO profiles (id, email, role, first_name, last_name) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'malika@navbat.uz', 'DOCTOR', 'Dr. Malika', 'Yusupova'),
  ('d0000001-0000-0000-0000-000000000002', 'jasur@navbat.uz', 'DOCTOR', 'Dr. Jasur', 'Toshmatov'),
  ('d0000001-0000-0000-0000-000000000003', 'sarvinoz@navbat.uz', 'DOCTOR', 'Dr. Sarvinoz', 'Rahmonova'),
  ('d0000001-0000-0000-0000-000000000004', 'davron@navbat.uz', 'DOCTOR', 'Dr. Davron', 'Umarov');

INSERT INTO doctor_profiles (user_id, specialty, experience_yrs, rating, review_count, availability, bg, color) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Cardiologist', 12, 4.8, 248, 'Available Today', '#FEF3C7', '#92400E'),
  ('d0000001-0000-0000-0000-000000000002', 'Neurologist', 8, 4.9, 156, 'Next: Tomorrow', '#FFEDD5', '#C2410C'),
  ('d0000001-0000-0000-0000-000000000003', 'Pediatrician', 5, 4.7, 312, 'Available Today', '#F3E8FF', '#6B21A8'),
  ('d0000001-0000-0000-0000-000000000004', 'Dermatologist', 15, 4.5, 189, 'Available Tomorrow', '#E0F2FE', '#0369A1');

-- ═══════════════════════════════════════
-- MANUALLY PROMOTE FIRST ADMIN
-- ═══════════════════════════════════════
-- Run this individually after signing up your primary account:
-- UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'sadullayevshohjahon990@gmail.com';
