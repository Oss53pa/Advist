/**
 * Dashboard overview service — real per-organization counts and lists from
 * the Atlas Studio / Advist tables. Replaces the previous hardcoded mocks
 * on UserDashboard.
 *
 * Scoping: all queries are filtered by organization_id (the tenant the
 * user belongs to) and, for "my signatures", by the current user_id. RLS
 * already restricts rows to the caller's org; we filter explicitly so the
 * counts are correct and intent is clear.
 *
 * Every call is resilient: on error it returns a safe empty/zero value
 * rather than throwing, so a missing table or transient failure degrades
 * to an empty dashboard instead of a crash.
 */
import { supabase } from '../lib/supabase';

export interface DashboardStats {
  documentsThisMonth: number;
  pendingSignatures: number;
  activeWorkflows: number;
  completedThisWeek: number;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  resourceName: string | null;
  at: string; // ISO timestamp
}

export interface PendingDocumentItem {
  id: string;
  title: string;
  status: string | null;
  dueDate: string | null;
}

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function startOfWeekISO(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  return monday.toISOString();
}

async function safeCount(
  build: () => PromiseLike<{ count: number | null; error: unknown }>
): Promise<number> {
  try {
    const { count, error } = await build();
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Per-org dashboard KPIs. */
export async function getDashboardStats(orgId: string, userId: string): Promise<DashboardStats> {
  const [documentsThisMonth, pendingSignatures, activeWorkflows, completedThisWeek] =
    await Promise.all([
      safeCount(() =>
        supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .is('deleted_at', null)
          .gte('created_at', startOfMonthISO())
      ),
      safeCount(() =>
        supabase
          .from('document_signatures')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'pending')
      ),
      safeCount(() =>
        supabase
          .from('workflow_instances')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('status', 'active')
      ),
      safeCount(() =>
        supabase
          .from('workflow_instances')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('status', 'completed')
          .gte('completed_at', startOfWeekISO())
      ),
    ]);

  return { documentsThisMonth, pendingSignatures, activeWorkflows, completedThisWeek };
}

/** Recent activity from the immutable audit log (most recent first). */
export async function getRecentActivity(orgId: string, limit = 4): Promise<RecentActivityItem[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, resource_name, resource_type, timestamp')
      .eq('organization_id', orgId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      action: (row.action as string) ?? 'activité',
      resourceName: (row.resource_name as string) ?? (row.resource_type as string) ?? null,
      at: (row.timestamp as string) ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export interface OrgUsage {
  currentUsers: number;
  currentDocuments: number;
  currentActiveWorkflows: number;
  currentStorageGb: number;
}

/**
 * Real per-org usage counts for the Organization Settings screen.
 * Storage is summed from documents.file_size (bytes → GB, 1 decimal).
 */
export async function getOrgUsage(orgId: string): Promise<OrgUsage> {
  const [users, docsCount, activeWorkflows, storageBytes] = await Promise.all([
    safeCount(() =>
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
    ),
    safeCount(() =>
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null)
    ),
    safeCount(() =>
      supabase
        .from('workflow_instances')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .in('status', ['active', 'paused'])
    ),
    (async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('file_size')
          .eq('organization_id', orgId)
          .is('deleted_at', null);
        if (error || !data) return 0;
        return data.reduce((acc, r) => acc + ((r as { file_size?: number }).file_size ?? 0), 0);
      } catch {
        return 0;
      }
    })(),
  ]);
  return {
    currentUsers: users,
    currentDocuments: docsCount,
    currentActiveWorkflows: activeWorkflows,
    currentStorageGb: Math.round((storageBytes / (1024 * 1024 * 1024)) * 10) / 10,
  };
}

/**
 * Documents currently awaiting action (active workflows for the org),
 * with the linked document title and due date.
 */
export async function getPendingDocuments(
  orgId: string,
  limit = 3
): Promise<PendingDocumentItem[]> {
  try {
    const { data, error } = await supabase
      .from('workflow_instances')
      .select('id, name, status, due_date, documents ( title )')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((row) => {
      const doc = row.documents as { title?: string } | { title?: string }[] | null;
      const docTitle = Array.isArray(doc) ? doc[0]?.title : doc?.title;
      return {
        id: row.id as string,
        title: docTitle || (row.name as string) || 'Document',
        status: (row.status as string) ?? null,
        dueDate: (row.due_date as string) ?? null,
      };
    });
  } catch {
    return [];
  }
}
