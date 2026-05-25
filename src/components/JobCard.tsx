'use client';

import Link from 'next/link';
import { UpworkJob } from '@/lib/types';
import { parseTags, formatBudget } from '@/lib/nocodb';
import ScoreRing from './ScoreRing';

interface JobCardProps {
  job: UpworkJob;
  index?: number;
  onArchiveToggle?: () => void;
}

function getPhaseClass(phase: string): string {
  const map: Record<string, string> = {
    discovery: 'discovery',
    MVP: 'mvp',
    rebuild: 'rebuild',
    scaling: 'scaling',
  };
  return map[phase] || 'unknown';
}

function getRiskLabel(risk: string): { label: string; isHigh: boolean } {
  if (!risk || risk === 'none') return { label: 'Low Risk', isHigh: false };
  const flags = risk.split(',').map((r) => r.trim()).filter(Boolean);
  if (flags.length === 0) return { label: 'Low Risk', isHigh: false };
  const dangerous = ['ASAP_pressure', 'vague_scope', 'budget_mismatch', 'oversized_scope'];
  const isHigh = flags.some((f) => dangerous.includes(f));
  return { label: isHigh ? '⚠ Risk Flags' : 'Minor Risks', isHigh };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffD = Math.floor(diffH / 24);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function JobCard({
  job,
  index = 0,
  onArchiveToggle,
}: JobCardProps) {
  const isApply = job.applyDecision === 'Apply';
  const tags = parseTags(job.tags);
  const { label: riskLabel, isHigh: isHighRisk } = getRiskLabel(job.riskIndicators);
  const budgetDisplay = formatBudget(job.budget, job.jobType);

  const metricColor = (val: number) => {
    if (val >= 8) return 'text-green';
    if (val >= 6) return 'text-blue';
    if (val >= 4) return 'text-amber';
    return 'text-red';
  };

  return (
    <Link
      href={`/jobs/${job.jobId}`}
      className={`job-card ${isApply ? 'apply' : 'skip'} animate-in`}
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
    >
      {/* Header */}
      <div className="card-header" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <div className="card-title-block">
          <h2 className="card-title">{job.title}</h2>
          <div className="card-meta">
            <span className="meta-tag">
              {formatDate(job.absoluteDate)}
            </span>
            <span className="meta-tag">
              <span className="dot" />
              {job.clientLocation || 'Unknown'}
            </span>
            <span className="meta-tag">
              <span className="dot" />
              {job.jobType}
            </span>
            {job.experienceLevel && (
              <span className="meta-tag">
                <span className="dot" />
                {job.experienceLevel}
              </span>
            )}
          </div>
        </div>

        <div className="card-score-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ScoreRing score={job.applyScore || 0} isApply={isApply} />
          <div className={`decision-badge ${isApply ? 'apply' : 'skip'}`}>
            {isApply ? '✓ Apply' : '✕ Skip'}
          </div>
          {onArchiveToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onArchiveToggle();
              }}
              className="card-archive-btn"
              title={job.status === 'archive' ? 'Restore Job' : 'Archive Job'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              {job.status === 'archive' ? '📤 Restore' : '📥 Archive'}
            </button>
          )}
        </div>
      </div>

      {/* Phase + Risk + Proposals */}
      <div className="card-badges">
        <span className={`phase-badge ${getPhaseClass(job.projectPhase)}`}>
          {job.projectPhase || 'unknown'}
        </span>
        <span className={`risk-badge ${!isHighRisk ? 'low-risk' : ''}`}>
          {riskLabel}
        </span>
        <span className="proposals-badge">
          👥 {job.proposals} proposals
        </span>
        {job.longTermPotential === 'ongoing' || job.longTermPotential === 'multi-phase' ? (
          <span className="phase-badge scaling">🔁 Long-term</span>
        ) : null}
      </div>

      {/* Metrics Grid */}
      <div className="card-metrics">
        <div className="metric-item">
          <span className={`metric-value ${metricColor(job.skillFit)}`}>{job.skillFit ?? '—'}</span>
          <span className="metric-label">Skill Fit</span>
        </div>
        <div className="metric-item">
          <span className={`metric-value ${metricColor(job.clientQuality)}`}>{job.clientQuality ?? '—'}</span>
          <span className="metric-label">Client Quality</span>
        </div>
        <div className="metric-item">
          <span className={`metric-value ${metricColor(job.rewardVsEffort)}`}>{job.rewardVsEffort ?? '—'}</span>
          <span className="metric-label">Reward/Effort</span>
        </div>
        <div className="metric-item">
          <span className={`metric-value ${metricColor(job.competitionAdvantage)}`}>{job.competitionAdvantage ?? '—'}</span>
          <span className="metric-label">Competition</span>
        </div>
      </div>

      {/* Footer: Tags + Budget */}
      <div className="card-footer">
        <div className="card-tags">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} className="tag-chip">{tag}</span>
          ))}
          {tags.length > 4 && (
            <span className="tag-chip">+{tags.length - 4}</span>
          )}
        </div>
        <div className="card-budget">
          <span className="budget-value">{budgetDisplay}</span>
          <span className="budget-type">
            {job.paymentVerified ? '✓ Verified' : 'Unverified'}
          </span>
        </div>
      </div>
    </Link>
  );
}
