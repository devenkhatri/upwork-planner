'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { UpworkJob } from '@/lib/types';
import { parseTags, parseQuestions, formatBudget } from '@/lib/nocodb';

function ScoreBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="score-card">
      <div className="score-card-value" style={{ color }}>
        {value ?? '—'}
      </div>
      <div className="score-card-label">{label}</div>
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${((value ?? 0) / 10) * 100}%` }} />
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'var(--accent-green)';
  if (score >= 6) return 'var(--accent-blue)';
  if (score >= 4) return 'var(--accent-amber)';
  return 'var(--accent-red)';
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < full ? '★' : '☆'}</span>
      ))}
      <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: '12px' }}>
        {rating?.toFixed(1)}
      </span>
    </span>
  );
}

function parseHooks(hooksStr: string): string[] {
  if (!hooksStr) return [];
  // Split on numbered list or newlines
  const lines = hooksStr
    .split(/\n|(?=\d+\.\s)/)
    .map((l) => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
  return lines.slice(0, 3);
}

function parseRequiredQuestions(qStr: string): string[] {
  if (!qStr || qStr === 'none') return [];
  return qStr
    .split(/\n|(?=\d+\.\s)/)
    .map((l) => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<UpworkJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/jobs/${params.id}`);
        if (!res.ok) throw new Error('Job not found');
        setJob(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) load();
  }, [params.id]);

  const handleArchiveToggle = async () => {
    if (!job) return;
    const newStatus = job.status === 'archive' ? 'active' : 'archive';
    try {
      const res = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: [job.jobId], status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');

      setJob((prev) => (prev ? { ...prev, status: newStatus === 'active' ? null : 'archive' } : null));

      if (newStatus === 'archive') {
        router.push('/');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating job status');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container detail-page">
          <div className="skeleton-card" style={{ height: 400 }} />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="page-wrapper">
        <div className="container detail-page">
          <div className="empty-state">
            <span className="empty-icon">⚠️</span>
            <p className="empty-title">{error || 'Job not found'}</p>
            <Link href="/" className="btn btn-primary">← Back to Jobs</Link>
          </div>
        </div>
      </div>
    );
  }

  const isApply = job.applyDecision === 'Apply';
  const tags = parseTags(job.tags);
  const screeningQuestions = parseQuestions(job.questions);
  const hooks = parseHooks(job.uniqueHooks);
  const requiredQs = parseRequiredQuestions(job.requiredQuestions);
  const budget = formatBudget(job.budget, job.jobType);

  const riskFlags = (job.riskIndicators || '').split(',').map((r) => r.trim()).filter((r) => r && r !== 'none');

  return (
    <>
      {/* Sticky Mini Header */}
      <header className="app-header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="detail-back" style={{ marginBottom: 0 }}>
              ← Back to Jobs
            </Link>
            <div className="header-stats">
              <div className={`decision-badge ${isApply ? 'apply' : 'skip'}`} style={{ fontSize: 14, padding: '6px 16px' }}>
                {isApply ? '✓ Apply' : '✕ Skip'} — Score {job.applyScore?.toFixed(2)}
              </div>
              <button
                onClick={handleArchiveToggle}
                className="btn btn-outline"
                style={{
                  height: 38,
                  borderColor: job.status === 'archive' ? 'var(--accent-green)' : 'var(--accent-red)',
                  color: job.status === 'archive' ? 'var(--accent-green)' : 'var(--accent-red)',
                  background: 'transparent',
                  fontWeight: 600
                }}
              >
                {job.status === 'archive' ? '📤 Restore Job' : '📥 Archive Job'}
              </button>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-upwork"
              >
                Open on Upwork ↗
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="container detail-page">

          {/* ── Hero ── */}
          <div
            className="detail-hero animate-in"
            style={{ '--card-accent-color': isApply ? 'var(--gradient-apply)' : 'var(--gradient-skip)' } as React.CSSProperties}
          >
            <h1 className="detail-title">{job.title}</h1>

            <div className="card-badges" style={{ marginBottom: 16 }}>
              <span className={`phase-badge ${(job.projectPhase || 'unknown').toLowerCase().replace('mvp', 'mvp')}`}>
                {job.projectPhase || 'unknown'}
              </span>
              {riskFlags.map((f) => (
                <span key={f} className="risk-badge">{f.replace(/_/g, ' ')}</span>
              ))}
              {riskFlags.length === 0 && <span className="risk-badge low-risk">Low Risk</span>}
              <span className="proposals-badge">👥 {job.proposals} proposals</span>
              <span className="proposals-badge">📍 {job.clientLocation}</span>
              <span className="proposals-badge">🗓 {job.relativeDate}</span>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="card-budget">
                <span className="budget-value" style={{ fontSize: 20 }}>{budget}</span>
                <span className="budget-type">{job.jobType} · {job.experienceLevel}</span>
              </div>
              {tags.slice(0, 6).map((tag) => (
                <span key={tag} className="tag-chip">{tag}</span>
              ))}
            </div>

            <div className="detail-actions">
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-upwork">
                🔗 Open on Upwork ↗
              </a>
              <button
                onClick={handleArchiveToggle}
                className="btn btn-outline"
                style={{
                  height: 44,
                  borderColor: job.status === 'archive' ? 'var(--accent-green)' : 'var(--accent-red)',
                  color: job.status === 'archive' ? 'var(--accent-green)' : 'var(--accent-red)',
                  background: 'transparent',
                  fontWeight: 600
                }}
              >
                {job.status === 'archive' ? '📤 Restore Job' : '📥 Archive Job'}
              </button>
              <button className="btn btn-outline" onClick={() => router.back()}>
                ← Back
              </button>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {Boolean(job.paymentVerified) ? '✓ Payment verified' : '⚠ Payment unverified'}
                {' · '}
                {Boolean(job.hasHired) ? 'Has hired before' : 'New client'}
              </span>
            </div>
          </div>

          {/* ── Two-column Layout ── */}
          <div className="detail-grid">
            {/* Left: Description + Hooks + Questions */}
            <div>
              {/* Job Description */}
              <div className="detail-section animate-in" style={{ animationDelay: '80ms' }}>
                <h2 className="section-title">Job Description</h2>
                <p className="description-text">{job.description}</p>
              </div>

              {/* Unique Hooks */}
              {hooks.length > 0 && (
                <div className="detail-section animate-in" style={{ animationDelay: '120ms' }}>
                  <h2 className="section-title">🎣 Unique Hooks to Reference</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Mention these in your proposal to prove you read the post carefully.
                  </p>
                  {hooks.map((hook, i) => (
                    <div key={i} className="hook-item">
                      <div className="hook-number">{i + 1}</div>
                      <div className="hook-text">&ldquo;{hook}&rdquo;</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Required Questions */}
              {requiredQs.length > 0 && (
                <div className="detail-section animate-in" style={{ animationDelay: '160ms' }}>
                  <h2 className="section-title">❓ Required Questions to Answer</h2>
                  {requiredQs.map((q, i) => (
                    <div key={i} className="question-item">
                      <strong style={{ color: 'var(--accent-amber)' }}>Q{i + 1}.</strong> {q}
                    </div>
                  ))}
                </div>
              )}

              {/* Screening Questions from Job */}
              {screeningQuestions.length > 0 && (
                <div className="detail-section animate-in" style={{ animationDelay: '200ms' }}>
                  <h2 className="section-title">📋 Client Screening Questions</h2>
                  {screeningQuestions.map((q, i) => (
                    <div key={i} className="question-item">
                      <strong style={{ color: 'var(--text-muted)' }}>#{q.position + 1}</strong> {q.question}
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {job.recommendations && (
                <div className="detail-section animate-in" style={{ animationDelay: '240ms' }}>
                  <h2 className="section-title">💡 Proposal Recommendations</h2>
                  <p className="recommendations-text">{job.recommendations}</p>
                </div>
              )}
            </div>

            {/* Right: Scores + Client Info */}
            <div>
              {/* Total Score */}
              <div
                className="detail-section animate-in"
                style={{ animationDelay: '100ms', '--card-accent-color': isApply ? 'var(--gradient-apply)' : 'var(--gradient-skip)' } as React.CSSProperties}
              >
                <div className="total-score-display">
                  <div className="total-score-value">{job.applyScore?.toFixed(2)}</div>
                  <div className="total-score-label">Apply Score (out of 10)</div>
                  <div className={`total-decision ${isApply ? 'apply' : 'skip'}`}>
                    {isApply ? '✓ Recommended: Apply' : '✕ Recommended: Skip'}
                  </div>
                </div>

                <h2 className="section-title" style={{ marginTop: 20 }}>Score Breakdown</h2>
                <div className="score-grid">
                  <ScoreBar value={job.skillFit} label="Skill Fit" color={getScoreColor(job.skillFit)} />
                  <ScoreBar value={job.clientQuality} label="Client Quality" color={getScoreColor(job.clientQuality)} />
                  <ScoreBar value={job.rewardVsEffort} label="Reward / Effort" color={getScoreColor(job.rewardVsEffort)} />
                  <ScoreBar value={job.competitionAdvantage} label="Competition Adv." color={getScoreColor(job.competitionAdvantage)} />
                </div>

                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                  0.4 × Skill + 0.3 × Client + 0.2 × Reward + 0.1 × Competition
                </p>
              </div>

              {/* Analysis */}
              <div className="detail-section animate-in" style={{ animationDelay: '140ms' }}>
                <h2 className="section-title">🔬 AI Analysis</h2>
                <div className="client-grid" style={{ marginBottom: 16 }}>
                  <div className="client-stat">
                    <span className="client-stat-label">Complexity</span>
                    <span className="client-stat-value">{job.complexityScore ?? '—'} / 5</span>
                  </div>
                  <div className="client-stat">
                    <span className="client-stat-label">Budget Seriousness</span>
                    <span className="client-stat-value">{job.budgetSeriousness ?? '—'} / 10</span>
                  </div>
                  <div className="client-stat">
                    <span className="client-stat-label">Professionalism</span>
                    <span className="client-stat-value">{job.professionalismSignal ?? '—'} / 10</span>
                  </div>
                  <div className="client-stat">
                    <span className="client-stat-label">Long-term Potential</span>
                    <span className="client-stat-value" style={{ textTransform: 'capitalize' }}>
                      {job.longTermPotential || '—'}
                    </span>
                  </div>
                </div>

                {riskFlags.length > 0 && (
                  <div>
                    <div className="client-stat-label" style={{ marginBottom: 8 }}>Risk Indicators</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {riskFlags.map((f) => (
                        <span key={f} className="risk-badge">{f.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Client Info */}
              <div className="detail-section animate-in" style={{ animationDelay: '180ms' }}>
                <h2 className="section-title">👤 Client Profile</h2>
                <div className="client-grid">
                  <div className="client-stat">
                    <span className="client-stat-label">Rating</span>
                    <StarRating rating={job.clientRating ?? 0} />
                  </div>
                  <div className="client-stat">
                    <span className="client-stat-label">Hire Rate</span>
                    <span className="client-stat-value">{job.clientHireRatePercent ?? '—'}%</span>
                  </div>
                  <div className="client-stat">
                    <span className="client-stat-label">Total Spent</span>
                    <span className="client-stat-value">
                      ${(job.clientTotalSpent ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="client-stat">
                    <span className="client-stat-label">Avg Hourly Rate</span>
                    <span className="client-stat-value">
                      {job.clientAvgHourlyRate ? `$${job.clientAvgHourlyRate}/hr` : 'N/A'}
                    </span>
                  </div>
                  <div className="client-stat">
                    <span className="client-stat-label">Location</span>
                    <span className="client-stat-value">{job.clientLocation || '—'}</span>
                  </div>
                  <div className="client-stat">
                    <span className="client-stat-label">Payment</span>
                    <span className="client-stat-value" style={{ color: Boolean(job.paymentVerified) ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {Boolean(job.paymentVerified) ? '✓ Verified' : '✕ Unverified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
