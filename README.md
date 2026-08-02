# ❤️ Kindness Board – A Wall of Hope

> **College Palliative Care Support Initiative**  
> A dedicated community web platform designed for students, faculty, staff, and visitors to share anonymous or signed words of hope, encouragement, prayers, and gratitude for palliative care patients and healthcare caregivers.

---

## 🌟 Overview & Purpose

In palliative and hospice care, emotional support and compassion are vital companions to medical treatment. Knowing that others are caring for them brings comfort and strength to patients during difficult journeys.

The **Kindness Board** serves as a digital bridge between our academic community and regional **Palliative Care Centres**. Messages contributed through this platform are displayed on digital boards and periodically compiled into printed **Kindness Booklets** hand-delivered by student volunteers.

---

## ✨ Key Features & Functionality

- **🌿 Wall of Hope (Public Board)**: Browse real-time cards featuring messages of encouragement, gratitude, and inspiration.
- **🏷️ Category Filtering & Sorting**: Filter notes by *Words of Hope*, *Prayer*, *Gratitude*, *Encouragement*, *Caregiver Thanks*, *Inspirational Quotes*, or *General Kindness*.
- **❤️ Interactive Warmth Counters**: Readers can click "Send Warmth" on any card to express support, with interactive celebration effects.
- **✨ AI Wording Assist**: Gentle real-time text suggestions to help contributors articulate thoughtful notes.
- **🛡️ Real-time Content Guard**: Automated safety filters ensuring all shared content remains respectful and uplifting.
- **📱 QR Code Generator**: Built-in event QR code generator allowing campus kiosks and physical bulletin boards to scan and link directly to the submission form.
- **💾 Automatic Draft Recovery**: Unsent messages are automatically saved in local browser storage so work is never lost.
- **☀️ Daily Featured Message**: Highlights a special daily message of hope on the home dashboard.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System with CSS Tokens, Glassmorphism & Animations), JavaScript (ES6+ Modular Architecture).
- **Backend / Database**: [Supabase](https://supabase.com/) Real-time Database (PostgreSQL) with hybrid LocalStorage fallback.
- **Iconography**: Lucide Icons.
- **Libraries**: `canvas-confetti` (Celebration animations) & `qrcodejs` (Event QR code generation).

---

## 📁 Project Architecture

```
kindness-board/
├── index.html            # Home Page & Project Overview
├── board.html            # Public Kindness Board & Submission Form
├── about.html            # Initiative Mission & Impact Details
├── timeline.html         # Campaign Journey & Event Timeline
├── gallery.html          # Event Snapshots & Volunteer Moments
├── contact.html          # Welfare Club Details & FAQs
├── css/
│   └── styles.css        # Core Design Tokens & Responsive Layouts
├── js/
│   ├── app.js            # Core UI Logic & Event Handlers
│   ├── storage.js        # Hybrid Cloud (Supabase) + Local Storage Engine
│   ├── aiHelper.js       # Real-time Content Safety & Wording Assist
│   └── supabaseConfig.js # Supabase API Client Credentials
└── supabase/
    └── schema.sql        # Database Table Schema & Indexes
```

---

## 🚀 How to Run Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sidharthks906/kindness-board.git
   cd kindness-board
   ```

2. **Launch a local server**:
   You can use any standard static server, for example with Python:
   ```bash
   python -m http.server 8080
   ```
   Or using Node `serve`:
   ```bash
   npx serve .
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:8080` in your web browser.

---

## ☁️ Database Setup (Supabase)

If setting up your own Supabase instance:
1. Create a new project in [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste the contents of `supabase/schema.sql` and run it to initialize the `messages` table.
4. Copy your Supabase **Project URL** and **Anon Key** into `js/supabaseConfig.js`.

---

## 📄 License & Attribution

Organized by the **St. Jude College Social Welfare Club** in partnership with regional Palliative Care Units.  
Distributed under the MIT License for educational and community welfare initiatives.
