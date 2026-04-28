# ClinicUz 

ClinicUz is a comprehensive, production-ready Dual-Platform Healthcare System designed to bridge the gap between patients, medical specialists, and clinical administration. 

🌐 **Live Admin Portal Deployment:** [https://clinicuzadminportal.vercel.app/](https://clinicuzadminportal.vercel.app/)  
*(The web administration dashboard is fully deployed and hosted via Vercel for immediate cloud access.)*

The system operates across a **Patient-Facing Mobile Application** and an **Administrative Web Portal**, both unified securely through a centralized **Supabase** backend with full **Multilingual Support (EN, UZ, RU)**.

---

## 🚀 Key Features

### 1. Patient Mobile Application (React Native / Expo)
The primary mobile interface where users register accounts and leverage healthcare tools:
- **🌍 Full Localization (i18n):** Seamlessly switch between **English, Uzbek, and Russian** across the entire UI, including notifications and booking flows.
- **🤖 AI-Powered Health Assistant:** A real-time triage assistant (GPT-3.5-Turbo) providing health guidance, symptom triage, and specialist recommendations.
- **🏥 Advanced Appointment Booking:** Search doctors by specialty, view availability, and get a localized dynamic booking summary.
- **📄 Medical Record Pipeline:** Securely download official medical records as **A4 PDF Documents** directly to the device using `expo-print`.
- **🔔 Real-time Notifications:** Localized updates for appointment confirmations and health reminders.
- **🛡️ Account Management:** Comprehensive profile settings including a "Danger Zone" for secure account deletion requests.

### 2. Clinical Administration Portal (React / Vite)
A private web dashboard accessible exclusively to authenticated internal team members (`ADMIN` and `DOCTOR` roles).
- **🌍 Multilingual Dashboard:** Full i18n support for administrative staff and doctors.
- **📊 Patient Queue Management:** Doctors can view their daily appointments, manage patient status, and write diagnoses.
- **📥 Data Portability:** Export clinical data and appointment reports to **Excel (.xlsx)** format for offline analysis.
- **👨‍⚕️ Provider Onboarding:** Admin tools to perform full CRUD operations for doctors, specialties, and schedules.
- **🎨 Sleek Dark Interface:** A modern, deep-slate dark theme architected with Vanilla CSS for high performance and visual excellence.

### 3. Backend & Infrastructure (Supabase)
- **🔐 Secure Authentication:** Passwordless Email OTP strategy powered by **Supabase Auth**.
- **👮 Row-Level Security (RLS):** Aggressive security policies ensuring data isolation between patients and administrative staff.
- **⚡ Real-time Engine:** Instant synchronization of appointments and medical updates across all platforms.
- **⚙️ Automated Workflows:** PostgreSQL triggers for profile initialization and role-based access control.

---

## 🛠️ Technology Stack

### Mobile Application
- **Core:** React Native v0.81.5 & Expo SDK 54
- **Navigation:** Expo Router / React Navigation v7
- **Internationalization:** `i18next` & `react-i18next`
- **Styling:** Custom design system with glassmorphism effects
- **Icons:** `lucide-react-native`

### Web Administration Portal
- **Core:** React v19 & Vite v8
- **Language:** TypeScript
- **Internationalization:** `i18next` with Browser Language Detection
- **Reporting:** `xlsx` for report generation
- **Styling:** Modular Vanilla CSS

### Cloud Infrastructure
- **Database:** PostgreSQL (via Supabase)
- **AI Backend:** OpenAI API (GPT-3.5-Turbo)
- **CI/CD:** GitHub Actions for automated testing and builds
- **Hosting:** Vercel (Web Portal)

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js (LTS)
- Expo Go App (for physical device testing)
- Supabase Account & OpenAI API Key

### 2. Installation
```bash
# Install mobile dependencies
npm install

# Install web portal dependencies
cd admin-portal
npm install
```

### 3. Configuration
Create `.env` files in both the root and `admin-portal/` directories:

```bash
# Mobile (.env)
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key

# Web Admin (/admin-portal/.env)
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### 4. Running Locally
**Terminal 1 (Mobile):**
```bash
npx expo start -c
```
**Terminal 2 (Admin Portal):**
```bash
cd admin-portal
npm run dev
```

---

## 🧪 Testing Infrastructure

ClinicUz maintains a rigorous testing standard across the entire stack:

- **Load Testing:** `artillery run load-test.yml` (Stress, Spike, and Load scenarios).
- **Web Unit Testing:** `npm run test` (Vitest & React Testing Library).
- **Web E2E Testing:** `npm run test:e2e` (Playwright).
- **Mobile E2E Testing:** `npm run test:e2e` (Maestro).

---
*Developed with precision for ClinicUz.*

