import { UpworkJob, SortField, SortDirection } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_NOCODB_BASE_URL || process.env.NOCODB_BASE_URL || '';
const API_TOKEN = process.env.NEXT_PUBLIC_NOCODB_API_TOKEN || process.env.NOCODB_API_TOKEN || '';
const BASE_ID = process.env.NEXT_PUBLIC_NOCODB_BASE_ID || process.env.NOCODB_BASE_ID || '';
const TABLE_NAME = 'UpworkJobs';

const headers = {
  'xc-token': API_TOKEN,
  'Content-Type': 'application/json',
};

export async function getAllJobs(params?: {
  search?: string;
  sortField?: SortField;
  sortDirection?: SortDirection;
  filters?: Record<string, string[]>;
}): Promise<UpworkJob[]> {
  const { search, sortField = 'absoluteDate', sortDirection = 'desc', filters = {} } = params || {};

  const queryParams = new URLSearchParams();
  queryParams.set('limit', '200');
  queryParams.set('where', buildWhereClause(search, filters));
  queryParams.set('sort', `${sortDirection === 'desc' ? '-' : ''}${sortField}`);

  const url = `${BASE_URL}/api/v1/db/data/noco/${BASE_ID}/${TABLE_NAME}?${queryParams.toString()}`;

  const res = await fetch(url, { headers, cache: 'no-store' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NocoDB fetch failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return (data.list || []) as UpworkJob[];
}

export async function getJobByJobId(jobId: string): Promise<UpworkJob | null> {
  const queryParams = new URLSearchParams();
  queryParams.set('where', `(jobId,eq,${jobId})`);
  queryParams.set('limit', '1');

  const url = `${BASE_URL}/api/v1/db/data/noco/${BASE_ID}/${TABLE_NAME}?${queryParams.toString()}`;

  const res = await fetch(url, { headers, cache: 'no-store' });
  if (!res.ok) return null;

  const data = await res.json();
  const list = data.list || [];
  return list.length > 0 ? (list[0] as UpworkJob) : null;
}

// Update status for a single job (PATCH by jobId — NocoDB primary key)
export async function updateJobStatus(
  jobId: string,
  status: 'active' | 'archive'
): Promise<boolean> {
  const url = `${BASE_URL}/api/v1/db/data/noco/${BASE_ID}/${TABLE_NAME}/${jobId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
  return res.ok;
}

// Bulk update status for multiple jobs
export async function updateJobsStatus(
  jobIds: string[],
  status: 'active' | 'archive'
): Promise<{ success: number; failed: number }> {
  const results = await Promise.allSettled(
    jobIds.map((id) => updateJobStatus(id, status))
  );
  const success = results.filter((r) => r.status === 'fulfilled' && r.value).length;
  return { success, failed: jobIds.length - success };
}

function buildWhereClause(search?: string, filters?: Record<string, string[]>): string {
  const conditions: string[] = [];

  if (search && search.trim()) {
    const s = search.trim();
    conditions.push(`(title,like,%${s}%)`);
  }

  if (filters) {
    for (const [field, values] of Object.entries(filters)) {
      if (values && values.length > 0) {
        const orConditions = values.map((v) => `(${field},eq,${v})`).join('~or');
        conditions.push(values.length > 1 ? `(${orConditions})` : orConditions);
      }
    }
  }

  return conditions.length > 0 ? conditions.join('~and') : '';
}

export function parseTags(tagsStr: string | null | undefined): string[] {
  if (!tagsStr) return [];
  try {
    const parsed = JSON.parse(tagsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
  }
}

export function parseQuestions(questionsStr: string | null | undefined): { question: string; position: number }[] {
  if (!questionsStr) return [];
  try {
    const parsed = JSON.parse(questionsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function formatBudget(budget: string, jobType: string): string {
  if (!budget || budget === 'N/A') return 'Budget TBD';
  if (budget.startsWith('$')) return `${budget} (Fixed)`;
  const parts = budget.split(' - ');
  if (parts.length === 2) return `$${parts[0]}–$${parts[1]}/hr`;
  return budget;
}
