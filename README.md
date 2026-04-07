# ClinicUz 🏥

ClinicUz is a modern, reliable, and user-friendly mobile healthcare application designed to connect patients with medical specialists. Built dynamically with **React Native** and **Expo**, ClinicUz enables patients to browse doctors, check availability, query an AI Assistant, and easily book **free** in-person consultations.

---

## ✨ Key Features

- **Robust Authentication:** Secure email/password login and registration powered by Supabase.
- **Swipeable App Navigation:** Fluid edge-to-edge swipe navigation leveraging React Navigation `MaterialTopTabs`.
- **Intelligent Booking System:** Filter doctors by specialty, search by name, and book specific calendar dates and hourly time slots.
- **Appointment Management:** Track all your `Upcoming`, `Completed`, and `Cancelled` appointments from a dedicated dashboard.
- **AI Medical Assistant:** Seamless OpenAI API integration offering smart medical triage, health advice, and persistent conversation history.
- **Dynamic Dark Mode:** First-class dark mode support scaling automatically with your system device preferences to prevent eye strain.
- **Notifications Hub:** Track system alerts and upcoming consultation changes with an integrated badge tracker system.
- **Bulletproof State & Security:** Clean logout flows entirely wiping local navigation history, alongside Postgres Row Level Security restricting patient data access exclusively to themselves.

---

## 🛠️ Technology Stack

- **Frontend Core:** [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (SDK 50+)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **UI Components:** Built completely with custom vanilla stylesheets for maximal performance; Iconography by [Lucide React Native](https://lucide.dev/).
- **Backend as a Service:** [Supabase](https://supabase.com/) (Fully manages Auth & PostgreSQL)
- **Artificial Intelligence:** [OpenAI API](https://openai.com/) (GPT-3.5-Turbo)
- **Language:** Fully typed in **TypeScript**.

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing.

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS recommended)
- [Git](https://git-scm.com/)
- Expo Go App on your physical device (iOS/Android) 
- A free [Supabase](https://supabase.com/) account
- An [OpenAI](https://openai.com/) standard API key 

### 2. Installation
Clone the repository and install dependencies:
```bash
# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory of the project and add your database and AI credentials:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

### 4. Database Setup
1. Log into your Supabase Dashboard.
2. Navigate to the **SQL Editor**.
3. Copy and paste the entire contents of `supabase-schema.sql` (found in the root directory).
4. Run the script. This will automatically spin up tables for `profiles`, `doctor_profiles`, `appointments`, `medical_records`, install RLS permission rules, and automatically seed sample doctors for you!

### 5. Running the Application
Start the Expo development server:
```bash
npx expo start -c
```
- **Android:** Press `a` in the terminal to open in a local Android Emulator.
- **iOS:** Press `i` to open in the local iOS Simulator.
- **Physical Device:** Scan the QR code displayed in the terminal with the Expo Go app.

---

## 📁 Project Structure

```text
/
├── assets/                 # Brand images, app icons, and fonts
├── src/                    
│   ├── app/                # Expo Router Screen configurations
│   ├── components/         # Reusable structural components
│   ├── services/           # Supabase connection, API integrations, and AI services
│   └── constants/          # Static themes and configuration constants
├── app.json                # Core Expo metadata and splash-screen constraints
└── supabase-schema.sql     # Complete database deployment instructions
```

---

## 🔒 Security Summary
Thanks to Supabase's heavily typed Auth implementation, user sessions are protected using JWTs. All primary tables utilize PostgreSQL **Row Level Security (RLS)** ensuring users only query, alter, or insert rows that explicitly belong to them.

---
*Created carefully with ❤️ for ClinicUz.*
