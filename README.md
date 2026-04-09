# ClinicUz 🏥

ClinicUz is a comprehensive, production-ready Dual-Platform Healthcare System designed to bridge the gap between patients, medical specialists, and clinical administration. 

The system operates across a **Patient-Facing Mobile Application** and an **Administrative Web Portal**, both unified securely through a centralized PostgreSQL backend.

---

## ✨ System Architecture Overview

The codebase operates natively as a monorepo containing two dedicated frontends hooked up to a unified backend ecosystem:

### 1. Patient Mobile Application (React Native / Expo)
The primary mobile interface where users register accounts and leverage healthcare tools:
- **Interactive Triage:** An AI-powered triage assistant running on OpenAI's GPT-3.5-Turbo providing pre-visit guidance.
- **Provider Searching:** Search and filter capabilities bridging dynamic specialty endpoints (e.g. Cardiologists, Dentists).
- **Appointment Booking:** Seamlessly book physical or virtual consultations with verified doctors in real-time.
- **Medical Documentation Pipeline:** The app securely downloads official medical records dynamically synthesized natively as **A4-sized PDF Documents** to the user’s mobile file system using `expo-print` and `expo-sharing`.
- **UI Framework:** Responsive fluid routing utilizing `expo-router` with Tab and Stack Navigators. Native glassmorphism implemented through `expo-glass-effect`.

### 2. Clinical Administration Portal (React / Vite)
A private web dashboard accessible exclusively to authenticated internal team members (`ADMIN` and `DOCTOR` roles).
- **Dual-Role Navigation:** Dynamic rendering blocks standard doctors from accessing root administrative controls, isolating them cleanly to only their patient queues.
- **Provider Onboarding System:** A rich interface to perform full CRUD operations adding new specialist doctors to the mobile app seamlessly.
- **Prescriptive Analytics:** A custom-built pipeline wherein Doctors can pull historical appointments and write official "Symptoms and Prescriptive Diagnosis" directly to the database. These securely push directly to the patient's mobile app timeline.
- **UI Framework:** Lightning-fast single-page interface bundled by **Vite** using pure Vanilla CSS specifically architected around a sleek, dark-mode styling scheme.

### 3. Backend Architecture (Supabase / Postgres)
- **Email OTP Authentication:** Passwordless, highly-secure One-Time-Password architecture. Upon a user's first login, PostgreSQL triggers naturally hook into the execution and auto-generate linked profile rows without manual setup.
- **Dynamic Policy Enforcement (RLS):** Strict Row-Level-Security (RLS) policies completely isolate data layers. Patients can only query and read data matching their `auth.uid()`, while `SECURITY DEFINER` Postgres functions safely elevate system administrators to access the holistic DB.
- **Schema Management:** All logic lives centrally in `supabase-schema.sql`, featuring structured foreign-key mapping across `profiles`, `doctor_profiles`, `appointments`, `medical_records`, and `reviews`.

---

## 🛠️ Complete Technology Stack

### Mobile Application
- **Core Framework:** [React Native](https://reactnative.dev/) v0.81.5 & [Expo](https://expo.dev/) SDK 54
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) / [React Navigation](https://reactnavigation.org/) v7 (Stack & Top Tabs)
- **Local Caching:** `@react-native-async-storage/async-storage`
- **File Management & Exportation:** `expo-print` (HTML-to-PDF Conversion) & `expo-sharing` (OS-level device file routing)
- **Iconography:** `lucide-react-native`

### Web Administration Portal
- **Framework & Bundler:** [React](https://reactjs.org/) v19 & [Vite](https://vitejs.dev/) v8
- **Language Compiler:** TypeScript
- **Styling:** Custom Vanilla CSS properties scoped to Deep-Slate Dark Theme
- **Data Fetching:** Isomorphic Supabase configuration allowing real-time mapping natively in the browser.

### Cloud Infrastructure
- **Relational Database:** [Supabase PostgreSQL](https://supabase.com/)
- **Authentication:** Supabase Auth (Email OTP & Password Login Strategies)
- **Deployment & Hosting:** [Vercel](https://vercel.com/) (Production-grade global CDN for Admin Portal)
- **Generative AI Backend:** [OpenAI API](https://openai.com/) GPT-3.5-Turbo for Natural Language Processing routines.
- **Continuous Quality:** Automated **Jest** testing suite ensuring core API and service stability.

---

##  Getting Started

Follow these instructions to get the mono-repo up and running on your local machine for development and testing.

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS recommended)
- [Git](https://git-scm.com/)
- Expo Go App on your physical device (iOS/Android) 
- A free [Supabase](https://supabase.com/) account
- An [OpenAI](https://openai.com/) standard API key 

### 2. Installation
Clone the repository and install dependencies at both root levels:
```bash
# Install mobile dependencies
npm install

# Install web portal dependencies
cd admin-portal
npm install
```

### 3. Environment Variables
Create `.env` files in both the root directory and the `/admin-portal/` directory, adding your credentials:

```bash
# Root Directory (.env)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key

# Admin Portal (/admin-portal/.env)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
1. Log into your Supabase Dashboard.
2. Navigate to the **SQL Editor**.
3. Copy and paste the entire contents of `supabase-schema.sql` (found in the root directory).
4. Run the script. This fully synchronizes the tables, bypass authorizations, and SQL views.

### 5. Running the Application

To boot up the complete system ecosystem, run two terminal windows.

**Terminal 1 (Mobile Patient Application):**
```bash
npx expo start -c
```
- Open with **iOS Simulator** (`i`), **Android Emulator** (`a`), or physical device QR scan.

**Terminal 2 (Admin Portal Dashboard):**
```bash
cd admin-portal
npm run dev
```
- Will deploy natively on `http://localhost:5173`. Simply sign in using a registered `ADMIN` or `DOCTOR` account.

### 6. Running Tests
The project uses **Jest** for unit and integration testing. To run the test suite:
```bash
npm test
```

---

## 🛡️ Technical Audit & Security Architecture
The ClinicUz system is built with a "Security-by-Design" philosophy, verified through a comprehensive technical audit:

- **Row-Level Security (RLS)**: Data is guarded at the database layer. No API endpoint can access user data without a valid JWT matching the `patient_id`.
- **Service-Oriented Patterns**: Business logic is decoupled from the UI in `api.ts`, promoting clean code and easier security auditing.
- **Production Infrastructure**: The Admin Portal uses a hardened Vercel deployment pipeline, ensuring global availability and SSL encryption by default.
- **Infrastructure Integrity**: Leveraging Supabase's serverless PostgreSQL gives us enterprise-grade data durability and managed authentication out of the box.

---
*Developed securely and rapidly for ClinicUz.*
