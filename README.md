# AI Finance Tracker (Finance Hub)

An ultra-modern, full-stack personal finance application powered by **Google Gemini AI** and **Supabase**. This app combines a sleek aurora glassmorphism UI with powerful automation to make financial tracking effortless.

## 🌟 Key Features

- **AI-Powered Quick Add**: Paste bank SMS or type natural language (e.g., "spent 500 on coffee") to automatically categorize and log transactions.
- **Full-Stack Sync**: Powered by Supabase for real-time cloud synchronization and secure PostgreSQL storage.
- **Local-First Architecture**: Works offline using encrypted LocalStorage and syncs to the cloud once a session is active.
- **Shop Hub**: Integrated POS system for small business owners, featuring inventory management and AI-driven profit analytics.
- **Trip Management**: Plan itineraries with AI and manage shared group expenses with automatic "who owes whom" settlement logic.
- **Financial Health Score**: A dynamic 0-100 score based on savings rates, debt-to-income ratios, and budget adherence.
- **Secure Backup**: Create and restore password-protected `.pfh` backup files.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS.
- **Backend/Database**: Supabase (Auth, PostgreSQL, Real-time).
- **Intelligence**: Google Gemini API (Flash 2.5/3.0 series).
- **Icons/UI**: Custom Glassmorphism & Aurora Background.

## 🚀 Quick Start

1.  **Environment Variables**:
    - `API_KEY`: Your Google Gemini API Key.
    - `SUPABASE_URL`: Your Supabase Project URL.
    - `SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.

2.  **Authentication**:
    - Use the "Sign In" button in the header to create an account or log in to enable cloud synchronization.

3.  **Local Development**:
    - The app is built with ES Modules. Ensure your environment supports modern browser features like Web Crypto and Service Workers for full functionality.

---
*Developed as part of Phase 0.*