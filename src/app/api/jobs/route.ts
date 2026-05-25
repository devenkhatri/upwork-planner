import { NextResponse } from 'next/server';
import { getAllJobs, updateJobsStatus } from '@/lib/nocodb';

export async function GET() {
  try {
    const jobs = await getAllJobs({
      sortField: 'absoluteDate',
      sortDirection: 'desc',
    });
    return NextResponse.json(jobs);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { jobIds, status } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: 'jobIds must be a non-empty array' }, { status: 400 });
    }

    if (status !== 'active' && status !== 'archive') {
      return NextResponse.json({ error: 'status must be "active" or "archive"' }, { status: 400 });
    }

    const result = await updateJobsStatus(jobIds, status);
    return NextResponse.json({
      ok: true,
      successCount: result.success,
      failedCount: result.failed
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

