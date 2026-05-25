'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { UpworkJob, FilterState, SortField, SortDirection } from '@/lib/types';
import JobCard from '@/components/JobCard';
import FilterPanel from '@/components/FilterPanel';

const DEFAULT_FILTERS: FilterState = {
  search: '',
  jobType: [],
  projectPhase: [],
  applyDecision: [],
  experienceLevel: [],
  longTermPotential: [],
  minScore: 0,
  maxScore: 10,
  minProposals: 0,
  maxProposals: 50,
};

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'absoluteDate:desc', label: '📅 Latest First' },
  { value: 'applyScore:desc', label: '⭐ Highest Score' },
  { value: 'skillFit:desc', label: '🎯 Best Skill Fit' },
  { value: 'clientQuality:desc', label: '👤 Best Client' },
  { value: 'rewardVsEffort:desc', label: '💰 Best Reward/Effort' },
  { value: 'proposals:asc', label: '🏁 Fewest Proposals' },
  { value: 'competitionAdvantage:desc', label: '🥇 Competition Advantage' },
  { value: 'budgetSeriousness:desc', label: '💵 Most Serious Budget' },
  { value: 'complexityScore:asc', label: '⚡ Lowest Complexity' },
];

function applyClientFilters(jobs: UpworkJob[], filters: FilterState): UpworkJob[] {
  return jobs.filter((job) => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const inTitle = job.title?.toLowerCase().includes(q);
      const inDesc = job.description?.toLowerCase().includes(q);
      const inTags = job.tags?.toLowerCase().includes(q);
      const inPhase = job.projectPhase?.toLowerCase().includes(q);
      if (!inTitle && !inDesc && !inTags && !inPhase) return false;
    }
    // Job type
    if (filters.jobType.length > 0 && !filters.jobType.includes(job.jobType)) return false;
    // Phase
    if (filters.projectPhase.length > 0 && !filters.projectPhase.includes(job.projectPhase)) return false;
    // Decision
    if (filters.applyDecision.length > 0 && !filters.applyDecision.includes(job.applyDecision)) return false;
    // Experience
    if (filters.experienceLevel.length > 0 && !filters.experienceLevel.includes(job.experienceLevel)) return false;
    // Long-term
    if (filters.longTermPotential.length > 0 && !filters.longTermPotential.includes(job.longTermPotential)) return false;
    // Score
    if ((job.applyScore ?? 0) < filters.minScore) return false;
    // Proposals
    if ((job.proposals ?? 0) > filters.maxProposals) return false;
    return true;
  });
}

function sortJobs(jobs: UpworkJob[], field: SortField, direction: SortDirection): UpworkJob[] {
  return [...jobs].sort((a, b) => {
    let aVal: number | string = ((a as unknown) as Record<string, unknown>)[field] as number | string ?? 0;
    let bVal: number | string = ((b as unknown) as Record<string, unknown>)[field] as number | string ?? 0;

    if (field === 'absoluteDate') {
      aVal = new Date(a.absoluteDate || 0).getTime();
      bVal = new Date(b.absoluteDate || 0).getTime();
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export default function JobsPage() {
  const [allJobs, setAllJobs] = useState<UpworkJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortValue, setSortValue] = useState('absoluteDate:desc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

  // Fetch all jobs on mount
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/jobs');
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
        const data = await res.json();
        setAllJobs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const [sortField, sortDirection] = useMemo((): [SortField, SortDirection] => {
    const [f, d] = sortValue.split(':');
    return [f as SortField, (d as SortDirection) || 'desc'];
  }, [sortValue]);

  const filteredJobs = useMemo(() => {
    const statusFiltered = allJobs.filter((job) => {
      const isArchived = job.status === 'archive';
      return viewMode === 'active' ? !isArchived : isArchived;
    });
    const filtered = applyClientFilters(statusFiltered, filters);
    return sortJobs(filtered, sortField, sortDirection);
  }, [allJobs, filters, sortField, sortDirection, viewMode]);

  const stats = useMemo(() => {
    const active = allJobs.filter((j) => j.status !== 'archive');
    return {
      total: active.length,
      apply: active.filter((j) => j.applyDecision === 'Apply').length,
      skip: active.filter((j) => j.applyDecision === 'Skip').length,
      avgScore: active.length
        ? (active.reduce((s, j) => s + (j.applyScore || 0), 0) / active.length).toFixed(1)
        : '0.0',
    };
  }, [allJobs]);

  const handleStatusChange = async (ids: string[], newStatus: 'active' | 'archive') => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: ids, status: newStatus }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update status: ${errorText}`);
      }

      setAllJobs((prev) =>
        prev.map((job) =>
          ids.includes(job.jobId)
            ? { ...job, status: newStatus === 'active' ? null : 'archive' }
            : job
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating job status');
    }
  };

  const handleSingleArchive = (jobId: string) => handleStatusChange([jobId], 'archive');
  const handleSingleRestore = (jobId: string) => handleStatusChange([jobId], 'active');

  const handleClearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);


  return (
    <>
      {/* ── Header ── */}
      <header className="app-header">
        <div className="container">
          <div className="header-inner">
            <div className="header-brand">
              <div className="brand-logo">🎯</div>
              <div>
                <div className="brand-text">Upwork Planner</div>
                <div className="brand-sub">AI-Powered Application Strategy</div>
              </div>
            </div>
            <div className="header-stats">
              <div className="stat-pill">
                <strong>{stats.total}</strong> jobs
              </div>
              <div className="stat-pill apply">
                <strong>{stats.apply}</strong> Apply
              </div>
              <div className="stat-pill skip">
                <strong>{stats.skip}</strong> Skip
              </div>
              <div className="stat-pill">
                Avg Score: <strong>{stats.avgScore}</strong>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="container">
          {/* ── Toolbar ── */}
          <div className="toolbar">
            {/* Search */}
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                id="search-input"
                className="search-input"
                type="search"
                placeholder="Search jobs, skills, descriptions…"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>

            {/* Sort */}
            <select
              id="sort-select"
              className="sort-select"
              value={sortValue}
              onChange={(e) => setSortValue(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Filter Toggle */}
            <button
              id="filter-toggle"
              className={`btn btn-outline ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters((v) => !v)}
            >
              ⚙ Filters
              {(() => {
                const n =
                  filters.jobType.length +
                  filters.projectPhase.length +
                  filters.applyDecision.length +
                  filters.experienceLevel.length +
                  filters.longTermPotential.length +
                  (filters.minScore > 0 ? 1 : 0) +
                  (filters.maxProposals < 50 ? 1 : 0);
                return n > 0 ? (
                  <span
                    style={{
                      marginLeft: 4,
                      background: 'var(--accent-blue)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {n}
                  </span>
                ) : null;
              })()}
            </button>
          </div>

          {/* ── Filter Panel ── */}
          {showFilters && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onClear={handleClearFilters}
            />
          )}

          {/* ── Results Header ── */}
          <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                className={`btn ${viewMode === 'active' ? 'btn-primary' : 'btn-outline'}`}
                style={{ height: 38, padding: '0 var(--space-4)', borderRadius: 'var(--radius-md)' }}
                onClick={() => { setViewMode('active'); }}
              >
                💼 Active Jobs ({allJobs.filter(j => j.status !== 'archive').length})
              </button>
              <button
                className={`btn ${viewMode === 'archived' ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  height: 38,
                  padding: '0 var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  borderColor: viewMode === 'archived' ? 'var(--accent-purple)' : 'var(--border-card)',
                  color: viewMode === 'archived' ? '#fff' : 'var(--text-secondary)',
                  background: viewMode === 'archived' ? 'var(--accent-purple)' : 'var(--bg-card)'
                }}
                onClick={() => { setViewMode('archived'); }}
              >
                📁 Archived ({allJobs.filter(j => j.status === 'archive').length})
              </button>
            </div>

            <p className="results-count" style={{ margin: 0 }}>
              Showing <strong>{filteredJobs.length}</strong> of {viewMode === 'active' ? allJobs.filter(j => j.status !== 'archive').length : allJobs.filter(j => j.status === 'archive').length} {viewMode === 'active' ? 'active' : 'archived'} jobs
              {filters.search && (
                <> for &ldquo;<strong>{filters.search}</strong>&rdquo;</>
              )}
            </p>

          </div>

          {/* ── Job Grid ── */}
          {loading ? (
            <div className="loading-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : error ? (
            <div className="empty-state">
              <span className="empty-icon">⚠️</span>
              <p className="empty-title">Failed to load jobs</p>
              <p className="empty-sub">{error}</p>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🔍</span>
              <p className="empty-title">{viewMode === 'active' ? 'No jobs match your filters' : 'No archived jobs'}</p>
              <p className="empty-sub">{viewMode === 'active' ? 'Try adjusting your search or clearing filters.' : 'Jobs you archive will appear here.'}</p>
              {viewMode === 'active' && (
                <button className="btn btn-outline" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="jobs-grid animate-stagger">
              {filteredJobs.map((job, i) => (
                <JobCard
                  key={job.jobId}
                  job={job}
                  index={i}
                  onArchiveToggle={() => {
                    if (job.status === 'archive') {
                      handleSingleRestore(job.jobId);
                    } else {
                      handleSingleArchive(job.jobId);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

    </>
  );
}
