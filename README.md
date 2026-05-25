# 🎯 Upwork Job Application Planner

An AI-powered dashboard designed to help freelancers analyze, score, and plan applications for Upwork jobs. This application ingests scraped Upwork job listings, enriches them with intelligent metrics using AI via OpenRouter, stores the results in NocoDB, and serves a premium glassmorphic dashboard for sorting, filtering, and organizing your application strategy.

---

## 🚀 Key Features

### 1. AI-Driven Job Evaluation
- **Apply Score (0–10)**: Calculated using a weighted formula: `0.4 × Skill Fit + 0.3 × Client Quality + 0.2 × Reward vs Effort + 0.1 × Competition Advantage`.
- **Complexity Score (1–5)**: Evaluated from description length, specific requirements, and phase indicators.
- **Project Phase Classification**: Groups listings into `discovery`, `MVP`, `rebuild`, `scaling`, or `unknown` based on scope description.
- **Risk Indicators**: Automatically flags phrases indicating scope-creep pressure (e.g., "ASAP", "unclear scope", "not a big project").
- **Client Profile Grading**: Assesses ratings, hire rate, spending habits, and history.

### 2. Proposal Strategy Generator
- **🎣 Unique Hooks**: Extracts 2–3 specific points from the job description to reference in the cover letter to prove thorough reading.
- **📋 Client Screening & Required Questions**: Extracts explicit questions that must be answered.
- **💡 Proposal Recommendations**: Generates personalized strategies and talking points.

### 3. Interactive Listing Dashboard
- **Live Search**: Instant full-text search across job titles, descriptions, tags, and phases.
- **Multi-Filter Panel**: Refine by job type, phase, decision (Apply/Skip), experience level, score, budget ranges, and proposal counts.
- **Sorting Options**: Sort by date, score, skill match, client spending, budget, and competition.
- **Dark Glassmorphic UI**: High-end modern styling with responsive layouts, loading skeletons, and smooth micro-animations.

### 4. Job Archiving & Restore System
- **Active / Archived Tabs**: Switch listings instantly between active planning and archived folders.
- **Exclusionary Stats**: Active dashboard stats (total jobs, recommended counts, average score) dynamically ignore archived records.
- **Quick-Actions**: Single-button archiving on job cards and detail headers.

---

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js**: v18 or later.
- **NocoDB**: Access to a NocoDB instance (self-hosted or cloud).
- **OpenRouter API Key**: For AI evaluation and data enrichment.

---

### Step 1: Environment Configuration

Create a `.env.local` file in the root directory:

```env
# NocoDB Connection Settings
NOCODB_BASE_URL=https://your-nocodb-host.com
NOCODB_API_TOKEN=your_nocodb_api_token
NOCODB_BASE_ID=your_nocodb_base_id

# OpenRouter API (AI Enrichment)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-flash-1.5 # Optional: default is google/gemini-flash-1.5

# Next.js Public Vars (Browser API Calls)
NEXT_PUBLIC_NOCODB_BASE_URL=https://your-nocodb-host.com
NEXT_PUBLIC_NOCODB_API_TOKEN=your_nocodb_api_token
NEXT_PUBLIC_NOCODB_BASE_ID=your_nocodb_base_id
```

*Note: Your NocoDB Base ID is visible in the URL when opening a base (e.g., `/#/nc/BASE_ID/...`). Get your API token in NocoDB under **Account Settings → Team & Auth → API Tokens**.*

---

### Step 2: Initialize Database and Ingest Data

Run the NocoDB setup script. This will create the `UpworkJobs` table with `jobId` mapped as the primary key and all necessary AI columns, evaluate the scraped jobs file using OpenRouter, and ingest the records.

```bash
npm run setup-nocodb
```

---

### Step 3: Run the Next.js Web App

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view your Upwork Planner.

---

## 🏗️ Project Architecture

```
upwork-planner/
├── scripts/
│   └── setup-nocodb.mjs        # One-time table creator and AI evaluation/ingestion
├── src/
│   ├── lib/
│   │   ├── types.ts            # TypeScript interfaces (UpworkJob, FilterState, etc.)
│   │   └── nocodb.ts           # NocoDB client wrappers and data formats
│   ├── app/
│   │   ├── globals.css         # Typography, glassmorphism design tokens, animations
│   │   ├── layout.tsx          # Root nextjs layout
│   │   ├── page.tsx            # Main jobs listing view, search, sorting and tabs
│   │   ├── api/
│   │   │   └── jobs/
│   │   │       ├── route.ts    # Fetch all active/archived jobs & status PATCH handler
│   │   │       └── [id]/
│   │   │           └── route.ts# Fetch individual job details
│   │   └── jobs/[id]/
│   │       └── page.tsx        # Job detail page layout with hooks and client profile
│   └── components/
│       ├── ScoreRing.tsx       # Circular SVG rating gauge
│       ├── JobCard.tsx         # Job card layout with quick archive controls
│       └── FilterPanel.tsx     # Chip-based category toggles and range sliders
```
