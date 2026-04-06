-- NavbatUz Database Schema for Supabase
-- Run this in Supabase Dashboard → SQL Editor

-- Enums
CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
CREATE TYPE appointment_status AS ENUM ('UPCOMING', 'COMPLETED', 'CANCELLED');
CREATE TYPE consultation_type AS ENUM ('IN_PERSON', 'ONLINE');

-- Users table (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  price_amount FLOAT DEFAULT 0,
  currency TEXT DEFAULT 'UZS',
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
  price TEXT,
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

-- Profiles: users can read all profiles, update their own
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Doctor profiles: everyone can read
CREATE POLICY "Doctor profiles readable" ON doctor_profiles FOR SELECT USING (true);

-- Appointments: users can see their own, create their own
CREATE POLICY "Users see own appointments" ON appointments FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "Users create own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users update own appointments" ON appointments FOR UPDATE USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Medical records: patients see their own
CREATE POLICY "Patients see own records" ON medical_records FOR SELECT USING (auth.uid() = patient_id);

-- Reviews: everyone can read, authenticated users can create
CREATE POLICY "Reviews readable" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- ═══════════════════════════════════════
-- TRIGGER: Auto-create profile on signup
-- ═══════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name)
  VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════
-- SEED: Sample doctors (using service role)
-- ═══════════════════════════════════════
-- NOTE: Doctors are inserted below as regular profiles.
-- Since they don't go through auth.users, we use generated UUIDs.

INSERT INTO profiles (id, email, role, first_name, last_name) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'malika@navbat.uz', 'DOCTOR', 'Dr. Malika', 'Yusupova'),
  ('d0000001-0000-0000-0000-000000000002', 'jasur@navbat.uz', 'DOCTOR', 'Dr. Jasur', 'Toshmatov'),
  ('d0000001-0000-0000-0000-000000000003', 'sarvinoz@navbat.uz', 'DOCTOR', 'Dr. Sarvinoz', 'Rahmonova'),
  ('d0000001-0000-0000-0000-000000000004', 'davron@navbat.uz', 'DOCTOR', 'Dr. Davron', 'Umarov');

INSERT INTO doctor_profiles (user_id, specialty, experience_yrs, rating, review_count, price_amount, currency, availability, bg, color) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Cardiologist', 12, 4.8, 248, 150000, 'so''m', 'Available Today', '#FEF3C7', '#92400E'),
  ('d0000001-0000-0000-0000-000000000002', 'Neurologist', 8, 4.9, 156, 180000, 'so''m', 'Next: Tomorrow', '#FFEDD5', '#C2410C'),
  ('d0000001-0000-0000-0000-000000000003', 'Pediatrician', 5, 4.7, 312, 120000, 'so''m', 'Available Today', '#F3E8FF', '#6B21A8'),
  ('d0000001-0000-0000-0000-000000000004', 'Dermatologist', 15, 4.5, 189, 200000, 'so''m', 'Available Tomorrow', '#E0F2FE', '#0369A1');
