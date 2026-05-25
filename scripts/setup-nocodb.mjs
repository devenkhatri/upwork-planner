#!/usr/bin/env node
/**
 * NocoDB Setup & Data Ingestion Script
 * Run: node scripts/setup-nocodb.mjs
 *
 * Steps:
 *  1. Creates the UpworkJobs table in NocoDB
 *  2. Enriches each record via OpenRouter AI
 *  3. Inserts all records into NocoDB
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = resolve(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
  console.log('✅ Loaded .env.local');
} else {
  console.warn('⚠️  No .env.local found. Using environment variables.');
}

const NOCODB_BASE_URL = process.env.NOCODB_BASE_URL;
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;
const NOCODB_BASE_ID = process.env.NOCODB_BASE_ID;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-flash-1.5';
const TABLE_NAME = 'UpworkJobs';

if (!NOCODB_BASE_URL || !NOCODB_API_TOKEN || !NOCODB_BASE_ID) {
  console.error('❌ Missing required env vars: NOCODB_BASE_URL, NOCODB_API_TOKEN, NOCODB_BASE_ID');
  process.exit(1);
}
if (!OPENROUTER_API_KEY) {
  console.error('❌ Missing OPENROUTER_API_KEY');
  process.exit(1);
}

const noco = {
  base: `${NOCODB_BASE_URL}/api/v1`,
  headers: { 'xc-token': NOCODB_API_TOKEN, 'Content-Type': 'application/json' },
};

// ─────────────────────────────────────────────
// 1. Get or create table
// ─────────────────────────────────────────────
async function getTableId() {
  // Try NocoDB v2 base tables endpoint, fall back to v1 projects endpoint
  const endpoints = [
    `${noco.base}/meta/bases/${NOCODB_BASE_ID}/tables`,
    `${noco.base}/db/meta/projects/${NOCODB_BASE_ID}/tables`,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: noco.headers });
      if (!res.ok) continue;
      const data = await res.json();
      const tables = data.list || [];
      const existing = tables.find((t) => t.title === TABLE_NAME);
      if (existing) return existing.id;
      // No match but endpoint worked — table doesn't exist yet
      return null;
    } catch {
      continue;
    }
  }
  return null;
}

async function createTable() {
  console.log(`\n📋 Creating table: ${TABLE_NAME} with all ${COLUMNS.length} columns...`);

  // NocoDB requires columns array in the creation payload
  const payload = {
    title: TABLE_NAME,
    columns: COLUMNS.map((col) => ({
      title: col.title,
      uidt: col.uidt,
      pk: col.pk || false
    })),
  };

  // Try v2 endpoint first, fall back to v1
  const endpoints = [
    `${noco.base}/meta/bases/${NOCODB_BASE_ID}/tables`,
    `${noco.base}/db/meta/projects/${NOCODB_BASE_ID}/tables`,
  ];

  for (const url of endpoints) {
    const res = await fetch(url, {
      method: 'POST',
      headers: noco.headers,
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Table created with ID: ${data.id}`);
      return data.id;
    }
    const errText = await res.text();
    console.warn(`  ⚠️  Endpoint ${url} failed (${res.status}): ${errText.slice(0, 150)}`);
  }

  throw new Error('Failed to create table on all endpoints. Check your NOCODB_BASE_ID and API token.');
}

const COLUMNS = [
  { title: 'jobId', uidt: 'SingleLineText', pk: true },
  { title: 'subId', uidt: 'SingleLineText' },
  { title: 'title', uidt: 'SingleLineText' },
  { title: 'url', uidt: 'URL' },
  { title: 'description', uidt: 'LongText' },
  { title: 'budget', uidt: 'SingleLineText' },
  { title: 'jobType', uidt: 'SingleLineText' },
  { title: 'experienceLevel', uidt: 'SingleLineText' },
  { title: 'clientLocation', uidt: 'SingleLineText' },
  { title: 'clientRating', uidt: 'Number' },
  { title: 'clientHireRatePercent', uidt: 'Number' },
  { title: 'clientTotalSpent', uidt: 'Number' },
  { title: 'clientAvgHourlyRate', uidt: 'Number' },
  { title: 'clientName', uidt: 'SingleLineText' },
  { title: 'hasHired', uidt: 'Checkbox' },
  { title: 'paymentVerified', uidt: 'Checkbox' },
  { title: 'proposals', uidt: 'Number' },
  { title: 'relativeDate', uidt: 'SingleLineText' },
  { title: 'absoluteDate', uidt: 'DateTime' },
  { title: 'tags', uidt: 'LongText' },
  { title: 'questions', uidt: 'LongText' },
  { title: 'allowedApplicantCountries', uidt: 'LongText' },
  // AI columns
  { title: 'complexityScore', uidt: 'Number' },
  { title: 'projectPhase', uidt: 'SingleLineText' },
  { title: 'riskIndicators', uidt: 'LongText' },
  { title: 'budgetSeriousness', uidt: 'Number' },
  { title: 'professionalismSignal', uidt: 'Number' },
  { title: 'longTermPotential', uidt: 'SingleLineText' },
  { title: 'uniqueHooks', uidt: 'LongText' },
  { title: 'requiredQuestions', uidt: 'LongText' },
  { title: 'skillFit', uidt: 'Number' },
  { title: 'clientQuality', uidt: 'Number' },
  { title: 'rewardVsEffort', uidt: 'Number' },
  { title: 'competitionAdvantage', uidt: 'Number' },
  { title: 'applyScore', uidt: 'Number' },
  { title: 'applyDecision', uidt: 'SingleLineText' },
  { title: 'recommendations', uidt: 'LongText' },
  { title: 'status', uidt: 'SingleLineText' },
];

// ─────────────────────────────────────────────
// 2. AI Enrichment via OpenRouter
// ─────────────────────────────────────────────
async function enrichWithAI(job) {
  const prompt = `You are an expert Upwork proposal strategist and freelancer coach. Analyze this Upwork job listing and return a JSON object with the exact fields specified.

JOB TITLE: ${job.title}

DESCRIPTION:
${job.description}

BUDGET: ${job.budget || 'N/A'}
JOB TYPE: ${job.jobType}
PROPOSALS: ${job.proposals}
CLIENT RATING: ${job.clientRating}/5
CLIENT HIRE RATE: ${job.clientHireRatePercent}%
CLIENT TOTAL SPENT: $${job.clientTotalSpent}
EXPERIENCE LEVEL: ${job.experienceLevel}
TAGS: ${JSON.stringify(job.tags)}
${job.questions?.length ? `SCREENING QUESTIONS:\n${job.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}` : ''}

Return ONLY a valid JSON object with EXACTLY these fields (no markdown, no explanation):
{
  "complexityScore": <integer 1-5, based on description length, distinct modules/features, presence of "Phase 1/MVP/production rebuild">,
  "projectPhase": <"discovery"|"MVP"|"rebuild"|"scaling"|"unknown">,
  "riskIndicators": "<comma-separated risk flags from: ASAP_pressure, vague_scope, budget_mismatch, oversized_scope, unclear_deliverables, or 'none'>",
  "budgetSeriousness": <integer 1-10>,
  "professionalismSignal": <integer 1-10>,
  "longTermPotential": <"one-time"|"ongoing"|"multi-phase"|"unknown">,
  "uniqueHooks": "<2-3 specific lines/concepts from the post to mention in your proposal to prove you read it>",
  "requiredQuestions": "<numbered list of questions the client explicitly asked freelancers to answer, or 'none'>",
  "skillFit": <integer 0-10, how well a senior full-stack AI/web developer matches this job>,
  "clientQuality": <integer 0-10, based on hire rate, rating, spend, post clarity>,
  "rewardVsEffort": <integer 0-10, budget and upside vs complexity and time required>,
  "competitionAdvantage": <integer 0-10, low proposals + high skill match = higher score>,
  "recommendations": "<3-5 concrete, specific proposal tips for this exact job>"
}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://upwork-planner.local',
      'X-Title': 'Upwork Job Planner',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${err}`);
  }

  const data = await res.json();
  if (data.error) {
    console.warn(`  ⚠️  OpenRouter API returned error: ${data.error.message || JSON.stringify(data.error)}`);
    return getDefaultAI();
  }

  const content = data.choices?.[0]?.message?.content || '{}';

  // Strip markdown code fences if present
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return { ...getDefaultAI(), ...parsed };
  } catch (e) {
    console.warn('  ⚠️  JSON parse failed, using defaults. Raw:', cleaned.slice(0, 200));
    return getDefaultAI();
  }
}

function getDefaultAI() {
  return {
    complexityScore: 3,
    projectPhase: 'unknown',
    riskIndicators: 'none',
    budgetSeriousness: 5,
    professionalismSignal: 5,
    longTermPotential: 'unknown',
    uniqueHooks: 'Review full description for hooks',
    requiredQuestions: 'none',
    skillFit: 5,
    clientQuality: 5,
    rewardVsEffort: 5,
    competitionAdvantage: 5,
    recommendations: 'Review job posting carefully before applying.',
  };
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, Number(val) || 0));
}

function computeApplyScore(ai) {
  const score =
    0.4 * clamp(ai.skillFit, 0, 10) +
    0.3 * clamp(ai.clientQuality, 0, 10) +
    0.2 * clamp(ai.rewardVsEffort, 0, 10) +
    0.1 * clamp(ai.competitionAdvantage, 0, 10);
  return Math.round(score * 100) / 100;
}

// ─────────────────────────────────────────────
// 3. Insert / query records
// ─────────────────────────────────────────────

// NocoDB data API accepts both tableId and table title in the URL.
// We use TABLE_NAME (title) which works in both v1 and v2.
function dataUrl(suffix = '') {
  return `${noco.base}/db/data/noco/${NOCODB_BASE_ID}/${TABLE_NAME}${suffix}`;
}

async function insertRecord(record) {
  const res = await fetch(dataUrl(), {
    method: 'POST',
    headers: noco.headers,
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Insert failed: ${res.status} ${errText}`);
  }
  return await res.json();
}

async function checkExistingRecords() {
  const res = await fetch(dataUrl('?limit=1'), { headers: noco.headers });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.pageInfo?.totalRows || 0;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Upwork Planner — NocoDB Setup Script');
  console.log('==========================================');
  console.log(`📡 NocoDB: ${NOCODB_BASE_URL}`);
  console.log(`🤖 AI Model: ${OPENROUTER_MODEL}`);

  // Load dataset
  const datasetPath = resolve(__dirname, '..', 'dataset_upwork-job-scraper_2026-05-24_06-55-21-455.json');
  if (!existsSync(datasetPath)) {
    console.error(`❌ Dataset not found at: ${datasetPath}`);
    process.exit(1);
  }
  const rawData = JSON.parse(readFileSync(datasetPath, 'utf-8'));
  console.log(`\n📂 Loaded ${rawData.length} records from dataset`);

  // Get or create table
  let tableId = await getTableId();
  if (tableId) {
    console.log(`✅ Table "${TABLE_NAME}" already exists (ID: ${tableId})`);
    const existing = await checkExistingRecords();
    if (existing > 0) {
      console.log(`ℹ️  Table already has ${existing} records. Skipping insertion.`);
      console.log('   Delete all rows manually in NocoDB to re-run ingestion.');
      return;
    }
  } else {
    tableId = await createTable();
    console.log('✅ All columns created with table');
  }

  // Process each record
  console.log('\n🔄 Processing records with AI enrichment...');
  console.log('─'.repeat(50));

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < rawData.length; i++) {
    const job = rawData[i];
    console.log(`\n[${i + 1}/${rawData.length}] ${job.title.slice(0, 70)}...`);

    try {
      // AI enrichment
      console.log('  🤖 Calling OpenRouter...');
      const ai = await enrichWithAI({
        ...job,
        tags: job.tags || [],
        questions: job.questions || [],
      });

      const applyScore = computeApplyScore(ai);
      const applyDecision = applyScore >= 7 ? 'Apply' : 'Skip';

      // Build record
      const record = {
        jobId: String(job.id),
        subId: job.subId || '',
        title: job.title || '',
        url: job.url || '',
        description: job.description || '',
        budget: job.budget || 'N/A',
        jobType: job.jobType || 'Fixed',
        experienceLevel: job.experienceLevel || '',
        clientLocation: job.clientLocation || '',
        clientRating: job.clientRating ?? null,
        clientHireRatePercent: job.clientHireRatePercent ?? null,
        clientTotalSpent: job.clientTotalSpent ?? null,
        clientAvgHourlyRate: job.clientAvgHourlyRate ?? null,
        clientName: job.clientName || null,
        hasHired: job.hasHired ?? false,
        paymentVerified: job.paymentVerified ?? false,
        proposals: job.proposals ?? 0,
        relativeDate: job.relativeDate || '',
        absoluteDate: job.absoluteDate || null,
        tags: JSON.stringify(job.tags || []),
        questions: JSON.stringify(job.questions || []),
        allowedApplicantCountries: job.allowedApplicantCountries
          ? JSON.stringify(job.allowedApplicantCountries)
          : null,
        // AI fields — all clamped to valid ranges
        complexityScore: clamp(ai.complexityScore ?? 3, 1, 5),
        projectPhase: ai.projectPhase ?? 'unknown',
        riskIndicators: ai.riskIndicators ?? 'none',
        budgetSeriousness: clamp(ai.budgetSeriousness ?? 5, 0, 10),
        professionalismSignal: clamp(ai.professionalismSignal ?? 5, 0, 10),
        longTermPotential: ai.longTermPotential ?? 'unknown',
        uniqueHooks: ai.uniqueHooks ?? '',
        requiredQuestions: ai.requiredQuestions ?? 'none',
        skillFit: clamp(ai.skillFit ?? 5, 0, 10),
        clientQuality: clamp(ai.clientQuality ?? 5, 0, 10),
        rewardVsEffort: clamp(ai.rewardVsEffort ?? 5, 0, 10),
        competitionAdvantage: clamp(ai.competitionAdvantage ?? 5, 0, 10),
        applyScore,
        applyDecision,
        recommendations: ai.recommendations ?? '',
      };

      await insertRecord(record);
      console.log(
        `  ✅ Inserted | Score: ${applyScore.toFixed(2)} | Decision: ${applyDecision} | Phase: ${ai.projectPhase}`
      );
      successCount++;
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
      failCount++;
    }

    // Rate limit pause between records
    if (i < rawData.length - 1) await sleep(1500);
  }

  console.log('\n==========================================');
  console.log(`✅ Done! ${successCount} inserted, ${failCount} failed`);
  console.log(`🔗 View your data: ${NOCODB_BASE_URL}/dashboard`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
