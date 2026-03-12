# 🐝 HiveZone (CampusHive)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-blue?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB_%26_Auth-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Mobile-blue?style=for-the-badge)](https://capacitorjs.com/)

> **The zone for student-powered digital ecosystem.**

HiveZone is a comprehensive campus hub designed to eliminate academic isolation, reduce financial pressure, and create safe support systems for students. Starting with major universities like UG and KNUST, HiveZone builds the digital infrastructure for modern campus life.

---

## ✨ Core Pillars

### 📚 Study Circles (Academic Thrive)
Collaborate with peers, share resources, and conquer your courses together. No student should struggle with academics in isolation.
*   **Group Study**: Create or join verified study circles for any course.
*   **Resource Sharing**: Seamlessly share notes, past questions, and guides.

### 💼 Campus Hustle (Gig Hub)
Access ethical earning opportunities within your campus. Connect with peers who need your skills.
*   **Verified Gigs**: Find student-friendly tasks and jobs.
*   **Skill Showcase**: Portfolios and ratings for campus service providers.

### 🧠 Mental Alleviation (Peer Support)
A safe, anonymous space for students to seek support and find comfort in shared experiences.
*   **Safe Spaces**: Find peer-led support groups.
*   **Verified Privacy**: Secure and sensitive environment for everyone.

### 💬 Direct Communication
Robust real-time messaging with full support for multi-file attachments, voice notes, and instant notifications.

---

## 📱 Mobile App (Capacitor)

HiveZone isn't just a website. It is a full native experience for Android and iOS using **Capacitor**.

*   **Live Updates**: Since the app wraps the live Vercel deployment, updates are instant and require no new downloads.
*   **Native Feel**: No browser URL bars, full-screen immersion, and persistent logins.
*   **Coming Soon**: Native camera integration and offline caching.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/) (App Router), React 19 |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Backend** | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage) |
| **Push** | [OneSignal](https://onesignal.com/) (Web & Native) |
| **Mobile** | [Capacitor](https://capacitorjs.com/) |
| **Icons** | [Hugeicons](https://hugeicons.com/) |
| **Typography** | Manyto, New York (Local Fonts) |

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   npm / yarn / pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Trapkhing/hivezone.git
    cd hivezone
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Create a `.env.local` file with your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

### Mobile Development

To open the project in Android Studio or Xcode:
```bash
npx cap open android
# or
npx cap open ios
```

---

## 🎨 Design System

HiveZone uses a custom "Warm Honey" design language:
*   **Primary Background**: `#f9e3a2` (Honey Gold)
*   **Primary Accent**: `#ffc107` (Amber)
*   **Contrast**: `#2c2c2c` (Dark Charcoal)
*   **Typography**: Bold, playful, and high-readability fonts optimized for readability and energy.

---

## 🗺 Roadmap

- [x] Initial Web Release
- [x] Capacitor Integration (Mobile v1)
- [x] Chat Attachments & Media
- [ ] Native Push Notification Upgrade
- [ ] Offline-First Study Circles
- [ ] Campus Marketplace (v2)

---

## 📄 License

Copyright &copy; 2026 HiveZone Team. All rights reserved.
