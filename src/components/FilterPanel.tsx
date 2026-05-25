'use client';

import { FilterState } from '@/lib/types';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClear: () => void;
}

const JOB_TYPES = ['Fixed', 'Hourly'];
const PHASES = ['discovery', 'MVP', 'rebuild', 'scaling', 'unknown'];
const DECISIONS = ['Apply', 'Skip'];
const EXPERIENCE_LEVELS = ['Entry Level', 'Intermediate', 'Expert'];
const LONG_TERM = ['one-time', 'ongoing', 'multi-phase', 'unknown'];

function countActiveFilters(filters: FilterState): number {
  return (
    filters.jobType.length +
    filters.projectPhase.length +
    filters.applyDecision.length +
    filters.experienceLevel.length +
    filters.longTermPotential.length +
    (filters.minScore > 0 ? 1 : 0) +
    (filters.maxScore < 10 ? 1 : 0) +
    (filters.minProposals > 0 ? 1 : 0) +
    (filters.maxProposals < 50 ? 1 : 0)
  );
}

function toggleValue(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export default function FilterPanel({ filters, onChange, onClear }: FilterPanelProps) {
  const activeCount = countActiveFilters(filters);

  const update = (key: keyof FilterState, value: string[] | number) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="filter-panel animate-in">
      {/* Job Type */}
      <div className="filter-group">
        <label>Job Type</label>
        <div className="filter-chips">
          {JOB_TYPES.map((t) => (
            <button
              key={t}
              className={`chip ${filters.jobType.includes(t) ? 'selected' : ''}`}
              onClick={() => update('jobType', toggleValue(filters.jobType, t))}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Project Phase */}
      <div className="filter-group">
        <label>Project Phase</label>
        <div className="filter-chips">
          {PHASES.map((p) => (
            <button
              key={p}
              className={`chip ${filters.projectPhase.includes(p) ? 'selected' : ''}`}
              onClick={() => update('projectPhase', toggleValue(filters.projectPhase, p))}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Apply Decision */}
      <div className="filter-group">
        <label>Apply Decision</label>
        <div className="filter-chips">
          {DECISIONS.map((d) => (
            <button
              key={d}
              className={`chip ${d === 'Apply' ? 'apply-chip' : 'skip-chip'} ${filters.applyDecision.includes(d) ? 'selected' : ''}`}
              onClick={() => update('applyDecision', toggleValue(filters.applyDecision, d))}
            >
              {d === 'Apply' ? '✓ Apply' : '✕ Skip'}
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div className="filter-group">
        <label>Experience Level</label>
        <div className="filter-chips">
          {EXPERIENCE_LEVELS.map((e) => (
            <button
              key={e}
              className={`chip ${filters.experienceLevel.includes(e) ? 'selected' : ''}`}
              onClick={() => update('experienceLevel', toggleValue(filters.experienceLevel, e))}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Long-term Potential */}
      <div className="filter-group">
        <label>Long-term Potential</label>
        <div className="filter-chips">
          {LONG_TERM.map((l) => (
            <button
              key={l}
              className={`chip ${filters.longTermPotential.includes(l) ? 'selected' : ''}`}
              onClick={() => update('longTermPotential', toggleValue(filters.longTermPotential, l))}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Apply Score Range */}
      <div className="filter-group">
        <label>Min Apply Score</label>
        <div className="filter-range">
          <input
            type="range"
            className="range-input"
            min={0}
            max={10}
            step={0.5}
            value={filters.minScore}
            onChange={(e) => update('minScore', parseFloat(e.target.value))}
          />
          <div className="range-labels">
            <span>0</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{filters.minScore}+</span>
            <span>10</span>
          </div>
        </div>
      </div>

      {/* Max Proposals Range */}
      <div className="filter-group">
        <label>Max Proposals</label>
        <div className="filter-range">
          <input
            type="range"
            className="range-input"
            min={0}
            max={50}
            step={1}
            value={filters.maxProposals}
            onChange={(e) => update('maxProposals', parseInt(e.target.value))}
          />
          <div className="range-labels">
            <span>0</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>≤ {filters.maxProposals}</span>
            <span>50</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="filter-footer">
        <div className="active-filters">
          {filters.jobType.map((v) => (
            <span key={v} className="active-filter-tag">
              Type: {v}
              <button onClick={() => update('jobType', filters.jobType.filter((x) => x !== v))}>×</button>
            </span>
          ))}
          {filters.projectPhase.map((v) => (
            <span key={v} className="active-filter-tag">
              Phase: {v}
              <button onClick={() => update('projectPhase', filters.projectPhase.filter((x) => x !== v))}>×</button>
            </span>
          ))}
          {filters.applyDecision.map((v) => (
            <span key={v} className="active-filter-tag">
              {v}
              <button onClick={() => update('applyDecision', filters.applyDecision.filter((x) => x !== v))}>×</button>
            </span>
          ))}
          {filters.experienceLevel.map((v) => (
            <span key={v} className="active-filter-tag">
              {v}
              <button onClick={() => update('experienceLevel', filters.experienceLevel.filter((x) => x !== v))}>×</button>
            </span>
          ))}
          {filters.longTermPotential.map((v) => (
            <span key={v} className="active-filter-tag">
              {v}
              <button onClick={() => update('longTermPotential', filters.longTermPotential.filter((x) => x !== v))}>×</button>
            </span>
          ))}
          {filters.minScore > 0 && (
            <span className="active-filter-tag">
              Score ≥ {filters.minScore}
              <button onClick={() => update('minScore', 0)}>×</button>
            </span>
          )}
          {filters.maxProposals < 50 && (
            <span className="active-filter-tag">
              ≤ {filters.maxProposals} proposals
              <button onClick={() => update('maxProposals', 50)}>×</button>
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <button className="btn btn-outline" onClick={onClear}>
            Clear all ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
