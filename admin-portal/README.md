# ClinicUz Administration Portal

The Clinical Administration Portal is a high-performance web dashboard designed for healthcare providers and clinical administrators. It provides real-time oversight of patient queues, doctor schedules, and clinical reporting.

## 🌟 Key Features

- **🌍 Multilingual Interface:** Full support for English, Uzbek, and Russian.
- **👨‍⚕️ Patient Queue Management:** Real-time visibility into daily appointments for doctors.
- **📊 Advanced Reporting:** Export appointment data and clinical logs to **Excel (.xlsx)**.
- **🛡️ Role-Based Access (RBAC):** Dedicated views for `ADMIN` (system settings, doctor onboarding) and `DOCTOR` (patient management).
- **📝 Clinical Documentation:** Seamless interface for writing symptoms and prescriptive diagnoses that sync directly to the patient's mobile timeline.
- **🎨 Modern Dark UI:** Optimized for long-session comfort with a sleek, deep-slate theme.

## 🛠️ Technology Stack

- **Framework:** React v19
- **Bundler:** Vite v8
- **Language:** TypeScript
- **State & Data:** Isomorphic Supabase integration
- **Styling:** Modular Vanilla CSS
- **Reporting:** XLSX for data portability

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (LTS)
- A configured Supabase project (see root `supabase-schema.sql`)

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in this directory:
```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Running Development Server
```bash
npm run dev
```

## 🧪 Testing
- **Unit Tests:** `npm run test` (Vitest)
- **E2E Tests:** `npm run test:e2e` (Playwright)

---
*Part of the ClinicUz Ecosystem.*
