# Upwork Job Planner — Build Tasks

## Phase 1: Project Bootstrap
- [x] Analyze JSON dataset structure (19 records, 23 fields)
- [ ] Initialize Next.js 14 app in /Users/devengoratela/Work/upwork-planner
- [ ] Create .env.example
- [ ] Install dependencies

## Phase 2: NocoDB Setup Script
- [ ] Create scripts/setup-nocodb.mjs (table creation + data ingestion)
- [ ] Implement AI enrichment via OpenRouter API
- [x] Implement PATCH handler in `src/app/api/jobs/route.ts` for bulk/single status update
- [ ] Implement apply score formula

## Phase 3: Next.js App — Core
- [ ] src/lib/types.ts (TypeScript interfaces)
- [ ] src/lib/nocodb.ts (NocoDB client)
- [ ] src/app/globals.css (design system, dark theme)
- [ ] src/app/layout.tsx (root layout)

## Phase 4: Next.js App — Components
- [ ] src/components/JobCard.tsx
- [ ] src/components/FilterPanel.tsx
- [ ] src/components/SearchSort.tsx
- [ ] src/components/ScoreRing.tsx

## Phase 5: Next.js App — Pages
- [ ] src/app/page.tsx (main jobs listing)
- [ ] src/app/jobs/[id]/page.tsx (job detail)

## Phase 6: Verification
- [ ] Build check (npm run build)
- [ ] Dev server starts cleanly
- [ ] Document run instructions
